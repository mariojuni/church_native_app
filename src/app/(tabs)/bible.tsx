import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Platform } from 'react-native';
import { Settings, BookOpen } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { getUserPreferences, saveUserPreferences, getSavedVersions, fetchBibleIndex } from '../../utils/bibleApi';

import BibleReader from '../../components/Bible/BibleReader';

import BooksModal from '../../components/Bible/BooksModal';

import TopNavBar from '../../components/Navigation/TopNavBar';

export default function BibleScreen() {
  const { userProfile } = useAuthStore();
  const [preferences, setPreferences] = useState<any>(null);
  const [savedVersions, setSavedVersions] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);

  const [isBooksModalOpen, setIsBooksModalOpen] = useState(false);
  const router = useRouter();


  // Load initial preferences and versions
  useFocusEffect(
    React.useCallback(() => {
      const init = async () => {
        const prefs = await getUserPreferences();
        setPreferences(prefs);
        const versions = await getSavedVersions();
        setSavedVersions(versions);
      };
      init();
    }, [])
  );

  // Fetch books index when translation changes
  useEffect(() => {
    if (!preferences?.activeTranslation) return;
    
    const loadBooks = async () => {
      const data = await fetchBibleIndex(preferences.activeTranslation);
      if (data && data.books) {
        setBooks(data.books);
      } else {
        setBooks([]);
      }
    };
    loadBooks();
  }, [preferences?.activeTranslation]);

  // Sync highlights from Firebase
  useEffect(() => {
    if (!userProfile?.uid || !preferences) return;
    
    const fetchUserHighlights = async () => {
      try {
        const docRef = doc(db, 'users', userProfile.uid, 'bible', 'preferences');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().highlights) {
          setPreferences((prev: any) => ({
            ...prev,
            highlights: {
              ...(prev.highlights || {}),
              ...docSnap.data().highlights
            }
          }));
        }
      } catch (error) {
        console.error("Error fetching Bible highlights from Firebase:", error);
      }
    };
    fetchUserHighlights();
  }, [userProfile?.uid]);

  const handleUpdatePreferences = async (updates: any) => {
    setPreferences((prev: any) => {
      const newPrefs = { ...prev, ...updates };
      saveUserPreferences(newPrefs);
      
      // Sync highlights to Firestore
      if (updates.highlights && userProfile?.uid) {
        const docRef = doc(db, 'users', userProfile.uid, 'bible', 'preferences');
        setDoc(docRef, { highlights: updates.highlights }, { merge: true })
          .catch(err => console.error("Error saving Bible highlights to Firebase:", err));
      }
      return newPrefs;
    });
  };

  const handleVersionChange = (id: string | number) => {
    handleUpdatePreferences({ activeTranslation: id });
  };

  const refreshSavedVersions = async () => {
    const versions = await getSavedVersions();
    setSavedVersions(versions);
  };

  if (!preferences) return null;

  const currentBook = books.find(b => b.id === preferences.activeBook);
  const activeVersionObj = savedVersions.find(v => String(v.id) === String(preferences.activeTranslation));

  return (
    <View style={styles.container}>
      <BibleReader 
        preferences={preferences}
        updatePreferences={handleUpdatePreferences}
        books={books}
      />

      <TopNavBar 
        leftText={`${currentBook?.title || currentBook?.name || preferences.activeBook} ${preferences.activeChapter}`}
        onLeftPress={() => setIsBooksModalOpen(true)}
        rightText={activeVersionObj?.local_abbreviation || activeVersionObj?.abbreviation || 'BIBLE'}
        onRightPress={() => router.push('/version-manager')}
      />



      <BooksModal 
        isOpen={isBooksModalOpen}
        onClose={() => setIsBooksModalOpen(false)}
        books={books}
        onSelectChapter={(bookId, chapterNum) => {
          handleUpdatePreferences({ activeBook: bookId, activeChapter: chapterNum });
          setIsBooksModalOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F8' }
});
