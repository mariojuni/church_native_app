import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { fetchChapterData } from '../../utils/bibleApi';
import { ChevronLeft, ChevronRight, Copy, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

const highlightColors = {
  yellow: 'rgba(255, 235, 59, 0.4)',
  pink: 'rgba(255, 101, 150, 0.3)',
  blue: 'rgba(77, 139, 255, 0.3)',
  green: 'rgba(74, 222, 128, 0.3)',
};

interface BibleReaderProps {
  preferences: any;
  updatePreferences: (updates: any) => void;
  books: any[];
}

interface Verse {
  id: string;
  verseNumber: string;
  content: string;
}

export default function BibleReader({ preferences, updatePreferences, books }: BibleReaderProps) {
  const { activeTranslation, activeBook, activeChapter } = preferences;
  const [chapterData, setChapterData] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerses, setSelectedVerses] = useState<string[]>([]);

  const passageId = `${activeBook}.${activeChapter}`;
  const chapterHighlights = (preferences.highlights && preferences.highlights[passageId]) || {};

  useEffect(() => {
    const loadChapter = async () => {
      setLoading(true);
      setSelectedVerses([]);
      const data = await fetchChapterData(activeTranslation, passageId);
      if (data) {
        setChapterData(data);
      } else {
        setChapterData([]);
      }
      setLoading(false);
    };
    loadChapter();
  }, [activeTranslation, activeBook, activeChapter]);

  const toggleVerse = (verseNumber: string) => {
    setSelectedVerses(prev => 
      prev.includes(verseNumber) ? prev.filter(v => v !== verseNumber) : [...prev, verseNumber]
    );
  };

  const handleCopy = async () => {
    if (selectedVerses.length > 0) {
      // Sort verses numerically before copying
      const sortedSelected = [...selectedVerses].sort((a, b) => parseInt(a) - parseInt(b));
      const versesText = sortedSelected.map(vNum => {
        const verse = chapterData.find(v => v.verseNumber === vNum);
        return verse ? verse.content : '';
      }).join(' ');

      await Clipboard.setStringAsync(versesText);
      setSelectedVerses([]);
      Alert.alert("Copied", "Verses copied to clipboard!");
    }
  };

  const handleHighlight = (color: string) => {
    const newHighlights = { ...(preferences.highlights || {}) };
    if (!newHighlights[passageId]) newHighlights[passageId] = {};
    
    selectedVerses.forEach(vNum => {
      if (color === 'clear') {
         delete newHighlights[passageId][vNum];
      } else {
         newHighlights[passageId][vNum] = color;
      }
    });
    
    updatePreferences({ highlights: newHighlights });
    setSelectedVerses([]);
  };

  const handlePrevChapter = () => {
    const bookIndex = books.findIndex(b => b.id === activeBook);
    if (bookIndex === -1) return;
    const currentBook = books[bookIndex];
    const chapterIndex = currentBook.chapters?.findIndex((c: any) => String(c.id) === String(activeChapter));

    if (chapterIndex > 0) {
      const prevChapter = currentBook.chapters[chapterIndex - 1];
      updatePreferences({ activeChapter: prevChapter.id });
    } else if (bookIndex > 0) {
      const prevBook = books[bookIndex - 1];
      if (prevBook && prevBook.chapters && prevBook.chapters.length > 0) {
        const lastChapter = prevBook.chapters[prevBook.chapters.length - 1];
        updatePreferences({ activeBook: prevBook.id, activeChapter: lastChapter.id });
      }
    }
  };

  const handleNextChapter = () => {
    const bookIndex = books.findIndex(b => b.id === activeBook);
    if (bookIndex === -1) return;
    const currentBook = books[bookIndex];
    const chapterIndex = currentBook.chapters?.findIndex((c: any) => String(c.id) === String(activeChapter));
    
    if (chapterIndex !== -1 && chapterIndex < (currentBook.chapters?.length - 1)) {
      const nextChapter = currentBook.chapters[chapterIndex + 1];
      updatePreferences({ activeChapter: nextChapter.id });
    } else if (bookIndex < books.length - 1) {
      const nextBook = books[bookIndex + 1];
      if (nextBook && nextBook.chapters && nextBook.chapters.length > 0) {
        const firstChapter = nextBook.chapters[0];
        updatePreferences({ activeBook: nextBook.id, activeChapter: firstChapter.id });
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6596" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.chapterContent}>
          {chapterData.map((verse) => {
            const isSelected = selectedVerses.includes(verse.verseNumber);
            const highlightColorName = chapterHighlights[verse.verseNumber];
            const highlightColorValue = highlightColorName ? highlightColors[highlightColorName as keyof typeof highlightColors] : 'transparent';
            
            return (
              <Text 
                key={verse.id} 
                onPress={() => toggleVerse(verse.verseNumber)}
                style={[
                  styles.verseWrap,
                  { backgroundColor: highlightColorValue },
                  isSelected && styles.verseSelected
                ]}
              >
                <Text style={styles.verseLabel}>{verse.verseNumber}</Text>
                <Text style={styles.verseText}> {verse.content} </Text>
              </Text>
            );
          })}
        </Text>
      </ScrollView>
      
      {/* Navigation Arrows overlay */}
      {selectedVerses.length === 0 && (
        <View style={styles.navOverlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.navBtn} onPress={handlePrevChapter}>
            <ChevronLeft size={20} color="#FF6596" />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.navBtn} onPress={handleNextChapter}>
            <ChevronRight size={20} color="#FF6596" />
          </TouchableOpacity>
        </View>
      )}

      {/* Highlighting Toolbar */}
      {selectedVerses.length > 0 && (
        <View style={styles.actionToolbar}>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <Copy size={20} color="#1a1a1a" />
            <Text style={styles.copyText}>Copy</Text>
          </TouchableOpacity>
          
          <View style={styles.colorPicker}>
            <TouchableOpacity style={[styles.colorDot, { backgroundColor: highlightColors.yellow }]} onPress={() => handleHighlight('yellow')} />
            <TouchableOpacity style={[styles.colorDot, { backgroundColor: highlightColors.pink }]} onPress={() => handleHighlight('pink')} />
            <TouchableOpacity style={[styles.colorDot, { backgroundColor: highlightColors.blue }]} onPress={() => handleHighlight('blue')} />
            <TouchableOpacity style={[styles.colorDot, { backgroundColor: highlightColors.green }]} onPress={() => handleHighlight('green')} />
            
            <TouchableOpacity style={styles.clearDot} onPress={() => handleHighlight('clear')}>
               <X size={14} color="#1a1a1a" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 130,
    paddingBottom: 120,
  },
  chapterContent: {
    fontSize: 18,
    lineHeight: 29,
    fontFamily: 'Inter',
    color: '#1a1a1a',
  },
  verseWrap: {
    borderRadius: 4,
  },
  verseSelected: {
    backgroundColor: 'rgba(255,101,150,0.15)',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dashed',
    textDecorationColor: '#FF6596',
  },
  verseLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6596',
    textAlignVertical: 'top',
  },
  verseText: {
    fontSize: 18,
    lineHeight: 29,
    fontFamily: 'Inter',
    color: '#1a1a1a',
  },
  navOverlay: {
    position: 'absolute',
    bottom: 110,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e1e4e8'
  },
  actionToolbar: {
    position: 'absolute',
    bottom: 100, // Above the floating tab bar
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    padding: 8,
    paddingHorizontal: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
  },
  copyText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600'
  },
  colorPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#e1e4e8',
    paddingLeft: 16,
  },
  colorDot: { 
    width: 24, 
    height: 24, 
    borderRadius: 12 
  },
  clearDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e1e4e8',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
