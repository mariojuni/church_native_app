import { getBibleIndex, saveBibleIndex, getChapter, saveChapter, deleteOfflineBible } from './offlineDb';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const API_BASE = 'https://api.youversion.com/v1';
const API_KEY = 'RAhHurUzL1pk5kt9LwrGIaz0AdnX0obcIH6NNIayuvGogR7f'; 

const getHeaders = () => ({
  'x-yvp-app-key': API_KEY,
  'Accept': 'application/json'
});

export const fetchLanguages = async () => {
  const cacheKey = 'bible_languages';
  try {
    const response = await fetch(`${API_BASE}/languages`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch languages');
    const data = await response.json();
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data.data));
    return data.data; 
  } catch (error) {
    console.warn("Falling back languages to cache/default due to API error");
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    return [{
      id: 39,
      name: "English",
      name_local: "English",
      tag: "eng"
    }];
  }
};

export const fetchVerseOfTheDay = async (translationId = '111') => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const votdRes = await fetch(`${API_BASE}/verse_of_the_days/${dayOfYear}`, { headers: getHeaders() });
    if (!votdRes.ok) return null;
    const votdData = await votdRes.json();
    const passageId = votdData.passage_id || (votdData.data && votdData.data.passage_id);
    if (!passageId) return null;

    const passageRes = await fetch(`${API_BASE}/bibles/${translationId}/passages/${passageId}?format=html`, { headers: getHeaders() });
    if (!passageRes.ok) return null;
    const passageData = await passageRes.json();
    
    return {
      html: passageData.content || (passageData.data && passageData.data.content) || '',
      reference: passageData.reference || (passageData.data && passageData.data.reference),
      passageId: passageId
    };
  } catch (e) {
    console.error("Error fetching Verse of the Day:", e);
    return null;
  }
};

export const fetchBiblesByLanguage = async (languageTag: string) => {
  const cacheKey = `bibles_${languageTag}`;
  try {
    const response = await fetch(`${API_BASE}/bibles?language_ranges[]=${languageTag}&all_available=true`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch bibles for language');
    const data = await response.json();
    
    // Cache the successful response
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data.data));
    return data.data;
  } catch (error) {
    console.warn(`Falling back bibles for ${languageTag} to cache/default due to API error`);
    
    // Try to load from cache
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Hardcoded fallback for English if everything fails
    if (languageTag.toLowerCase().startsWith('en')) {
      return [
        { id: 111, abbreviation: 'NIV', localized_abbreviation: 'NIV', title: 'New International Version' },
        { id: 59, abbreviation: 'ESV', localized_abbreviation: 'ESV', title: 'English Standard Version' },
        { id: 1, abbreviation: 'KJV', localized_abbreviation: 'KJV', title: 'King James Version' },
        { id: 114, abbreviation: 'NKJV', localized_abbreviation: 'NKJV', title: 'New King James Version' },
        { id: 116, abbreviation: 'NLT', localized_abbreviation: 'NLT', title: 'New Living Translation' },
        { id: 2692, abbreviation: 'NASB2020', localized_abbreviation: 'NASB', title: 'New American Standard Bible 2020' },
        { id: 97, abbreviation: 'MSG', localized_abbreviation: 'MSG', title: 'The Message' },
      ];
    }
    return [];
  }
};

const parseHTMLToJSON = (html: string, passageId: string) => {
  const verses = [];
  const verseRegex = /<span[^>]*class="[^"]*yv-v[^"]*"[^>]*v="(\d+)"[^>]*>(.*?)<\/span>(.*?)(?=<span[^>]*class="[^"]*yv-v|$)/gs;
  let match;
  
  while ((match = verseRegex.exec(html)) !== null) {
    const verseNumber = match[1];
    let rawText = (match[2] + " " + match[3]).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (rawText.length > 0) {
      verses.push({ id: `${passageId}.${verseNumber}`, verseNumber, content: rawText });
    }
  }

  if (verses.length === 0 && html.length > 0) {
     verses.push({
        id: passageId,
        verseNumber: "1",
        content: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
     });
  }
  return verses;
};

const sessionCache = new Map<string, any>();

export const fetchBibleIndex = async (translationId: string | number) => {
  const cacheKey = `index-${translationId}`;
  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey);
  }

  const offlineIndex = await getBibleIndex(translationId);
  if (offlineIndex) {
    sessionCache.set(cacheKey, offlineIndex);
    return offlineIndex;
  }

  try {
    const response = await fetch(`${API_BASE}/bibles/${translationId}/index`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch bible index');
    const data = await response.json();
    
    sessionCache.set(cacheKey, data);

    const savedVersions = await getSavedVersions();
    if (savedVersions.some((v: any) => String(v.id) === String(translationId))) {
      await saveBibleIndex(translationId, data);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching index from YouVersion for ${translationId}, falling back to Firestore:`, error);
    try {
      const docRef = doc(db, 'bibles', String(translationId));
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().index) {
        const fallbackData = docSnap.data().index;
        sessionCache.set(cacheKey, fallbackData);
        return fallbackData;
      }
    } catch (fbError) {
      console.error(`Error fetching index from Firestore for ${translationId}:`, fbError);
    }
    return null;
  }
};

export const fetchChapterData = async (translationId: string | number, passageId: string) => {
  const cacheKey = `chapter-${translationId}-${passageId}`;
  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey);
  }

  // 1. Check Offline Database (which now stores stringified JSON array of verses)
  const offlineChapterStr = await getChapter(translationId, passageId);
  if (offlineChapterStr) {
    try {
      const parsed = JSON.parse(offlineChapterStr);
      sessionCache.set(cacheKey, parsed);
      return parsed;
    } catch (e) {
      // Ignore parse error and fall back to online
    }
  }

  // 2. Fetch Online
  try {
    // We need to look up the verse IDs for this chapter from the index
    const index = await fetchBibleIndex(translationId);
    if (!index) throw new Error('Index not found');
    
    let verseIds: string[] = [];
    for (const book of index.books) {
      for (const chapter of book.chapters) {
        if (chapter.passage_id === passageId) {
           // We found the chapter, now get all its verse passage_ids (e.g. GEN.1.1, GEN.1.2)
           if (chapter.verses && chapter.verses.length > 0) {
              verseIds = chapter.verses.map((v: any) => v.passage_id);
           }
           break;
        }
      }
    }

    if (verseIds.length === 0) {
       throw new Error('Verses not found in index');
    }

    // Run a Promise.all to fetch all verses concurrently using the passages API (returns JSON)
    const versePromises = verseIds.map(async (vId) => {
       const res = await fetch(`${API_BASE}/bibles/${translationId}/passages/${vId}`, { headers: getHeaders() });
       if (res.ok) {
          const data = await res.json();
          // Extract verse number from id (e.g., GEN.1.1 -> 1)
          const parts = data.id.split('.');
          const vNum = parts[parts.length - 1];
          return { id: data.id, verseNumber: vNum, content: data.content };
       }
       return null;
    });

    const results = await Promise.all(versePromises);
    const validVerses = results.filter(v => v !== null);

    sessionCache.set(cacheKey, validVerses);

    // If the version is saved offline, save the JSON structure to SQLite
    const savedVersions = await getSavedVersions();
    if (savedVersions.some((v: any) => String(v.id) === String(translationId))) {
      await saveChapter(translationId, passageId, JSON.stringify(validVerses));
    }
    
    return validVerses;
  } catch (error) {
    console.error(`Error fetching chapter ${passageId} for ${translationId} from YouVersion, falling back to Firestore:`, error);
    try {
      const docRef = doc(db, 'bibles', String(translationId), 'chapters', passageId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().verses) {
        const fallbackVerses = docSnap.data().verses;
        sessionCache.set(cacheKey, fallbackVerses);
        return fallbackVerses;
      }
    } catch (fbError) {
      console.error(`Error fetching chapter ${passageId} from Firestore:`, fbError);
    }
    return null;
  }
};

export const downloadBibleOffline = async (translationId: string | number) => {
  try {
    const response = await fetch(`${API_BASE}/bibles/${translationId}/index`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch bible index for download');
    const indexData = await response.json();
    await saveBibleIndex(translationId, indexData);
    
    const allPassageIds: string[] = [];
    for (const book of indexData.books) {
      for (const chapter of book.chapters) {
        if (chapter.passage_id) {
          allPassageIds.push(chapter.passage_id);
        }
      }
    }

    startBackgroundDownload(translationId, allPassageIds);
    return true;
  } catch (error) {
    console.error("Error initiating offline download:", error);
    return false;
  }
};

const startBackgroundDownload = async (translationId: string | number, passageIds: string[]) => {
  const BATCH_SIZE = 5; 
  for (let i = 0; i < passageIds.length; i += BATCH_SIZE) {
    const batch = passageIds.slice(i, i + BATCH_SIZE);
    
    await Promise.allSettled(batch.map(async (passageId) => {
      const exists = await getChapter(translationId, passageId);
      if (exists) return;
      
      try {
        // Fetch the HTML to save API calls (1 call instead of 30+ per chapter)
        const response = await fetch(`${API_BASE}/bibles/${translationId}/passages/${passageId}?format=html`, { headers: getHeaders() });
        if (response.ok) {
          const data = await response.json();
          // Parse HTML into clean JSON array and save to DB
          const parsedVerses = parseHTMLToJSON(data.content, passageId);
          await saveChapter(translationId, passageId, JSON.stringify(parsedVerses));
        }
      } catch (e) {}
    }));
    
    await new Promise(res => setTimeout(res, 200));
  }
};

export const getSavedVersions = async () => {
  const saved = await AsyncStorage.getItem('my_bible_versions');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.length > 0) return parsed;
  }
  
  const defaultVersion = {
    id: 2692,
    abbreviation: "NASB2020",
    language_tag: "en",
    localized_abbreviation: "NASB2020",
    localized_title: "New American Standard Bible - NASB",
    title: "New American Standard Bible 2020"
  };
  
  await AsyncStorage.setItem('my_bible_versions', JSON.stringify([defaultVersion]));
  return [defaultVersion];
};

export const saveVersion = async (version: any) => {
  const saved = await getSavedVersions();
  if (!saved.some((v: any) => String(v.id) === String(version.id))) {
    const newSaved = [...saved, version];
    await AsyncStorage.setItem('my_bible_versions', JSON.stringify(newSaved));
    return newSaved;
  }
  return saved;
};

export const removeVersion = async (versionId: string | number) => {
  const saved = await getSavedVersions();
  const newSaved = saved.filter((v: any) => String(v.id) !== String(versionId));
  await AsyncStorage.setItem('my_bible_versions', JSON.stringify(newSaved));
  await deleteOfflineBible(versionId);
  return newSaved;
};

export const getUserPreferences = async () => {
  const prefs = await AsyncStorage.getItem('bible_prefs');
  if (prefs) return JSON.parse(prefs);
  return {
    activeTranslation: '2692', 
    activeBook: 'GEN',
    activeChapter: '1',
    activePassageId: 'GEN.1',
    highlights: {}
  };
};

export const saveUserPreferences = async (prefs: any) => {
  await AsyncStorage.setItem('bible_prefs', JSON.stringify(prefs));
};

export const fetchOrganization = async (orgId: string) => {
  if (!orgId) return null;
  try {
    const response = await fetch(`${API_BASE}/organizations/${orgId}`, { headers: getHeaders() });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};
