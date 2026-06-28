
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSavedVersions, getUserPreferences, saveUserPreferences, fetchOrganization } from '../../utils/bibleApi';

const POPULAR_LANGUAGES = [
  { id: 'eng', tag: 'eng', name: 'English', local_name: 'English', biblesCount: 12 },
  { id: 'Fil', tag: 'Fil', name: 'Filipino / Tagalog', local_name: 'Filipino', biblesCount: 4 },
  { id: 'spa', tag: 'spa', name: 'Spanish', local_name: 'Español', biblesCount: 8 },
  { id: 'fra', tag: 'fra', name: 'French', local_name: 'Français', biblesCount: 6 },
  { id: 'deu', tag: 'deu', name: 'German', local_name: 'Deutsch', biblesCount: 5 },
  { id: 'zho', tag: 'zho', name: 'Chinese', local_name: '中文', biblesCount: 7 },
  { id: 'jpn', tag: 'jpn', name: 'Japanese', local_name: '日本語', biblesCount: 3 },
  { id: 'kor', tag: 'kor', name: 'Korean', local_name: '한국어', biblesCount: 3 },
  { id: 'rus', tag: 'rus', name: 'Russian', local_name: 'Русский', biblesCount: 4 },
  { id: 'por', tag: 'por', name: 'Portuguese', local_name: 'Português', biblesCount: 5 },
  { id: 'ind', tag: 'ind', name: 'Bahasa Indonesia', local_name: 'Bahasa Indonesia', biblesCount: 4 }
];

export const VersionContext = createContext<any>(null);

export const VersionProvider = ({ children }: { children: React.ReactNode }) => {
  const [savedVersions, setSavedVersions] = useState<any[]>([]);
  const [activeTranslation, setActiveTranslation] = useState<string | number>('');
  const [selectedLanguage, setSelectedLanguage] = useState(POPULAR_LANGUAGES[0]);
  const [publishers, setPublishers] = useState<Record<string, string>>({});

  const refreshSavedVersions = async () => {
    const versions = await getSavedVersions();
    setSavedVersions(versions);
  };

  useEffect(() => {
    const init = async () => {
      const prefs = await getUserPreferences();
      setActiveTranslation(prefs?.activeTranslation || '');
      await refreshSavedVersions();
    };
    init();
  }, []);

  useEffect(() => {
    const fetchPublishers = async () => {
      const newPublishers = { ...publishers };
      const missingOrgs = savedVersions
        .map(v => v.organization_id)
        .filter(id => id && !newPublishers[id]);
      
      const uniqueOrgs = [...new Set(missingOrgs)];

      await Promise.all(uniqueOrgs.map(async (orgId) => {
        const data = await fetchOrganization(orgId);
        newPublishers[orgId] = data ? data.name : 'Public Domain';
      }));
      setPublishers(newPublishers);
    };
    fetchPublishers();
  }, [savedVersions]);

  const handleSelectVersion = async (id: string | number) => {
    const prefs = await getUserPreferences();
    await saveUserPreferences({ ...prefs, activeTranslation: id });
    setActiveTranslation(id);
  };

  return (
    <VersionContext.Provider value={{
      savedVersions, refreshSavedVersions,
      activeTranslation, handleSelectVersion,
      selectedLanguage, setSelectedLanguage,
      publishers,
      POPULAR_LANGUAGES
    }}>
      {children}
    </VersionContext.Provider>
  );
};

export const useVersionContext = () => useContext(VersionContext);
