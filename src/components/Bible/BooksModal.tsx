import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import AppModal from '../ui/AppModal';

interface BooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: any[];
  onSelectChapter: (bookId: string, chapterNum: string) => void;
}

export default function BooksModal({ isOpen, onClose, books, onSelectChapter }: BooksModalProps) {
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'Traditional' | 'Alphabetical'>('Traditional');

  const sortedBooks = [...(books || [])].sort((a, b) => {
    if (sortMode === 'Alphabetical') {
      return (a.title || a.name).localeCompare(b.title || b.name);
    }
    return 0; // Traditional
  });

  const handleBookTap = (bookId: string) => {
    setExpandedBook(expandedBook === bookId ? null : bookId);
  };

  const renderChapters = (book: any) => {
    const chapters = book.chapters || [];
    return (
      <View style={styles.chapterGridContainer}>
        {chapters.map((chapter: any) => {
          const chapNum = chapter.human_reference || String(chapter.id);
          return (
            <TouchableOpacity 
              key={chapter.id}
              style={styles.chapterGridItem}
              onPress={() => {
                onSelectChapter(book.id, chapter.id);
                setExpandedBook(null);
              }}
            >
              <Text style={styles.chapterGridText}>{chapNum}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <AppModal isOpen={isOpen} onClose={onClose} title="Books">
      {/* Book List */}
      <ScrollView style={styles.content}>
        {sortedBooks.map(book => (
          <View key={book.id}>
            <TouchableOpacity 
              style={[
                styles.bookItem, 
                expandedBook === book.id && styles.bookItemExpanded
              ]}
              onPress={() => handleBookTap(book.id)}
            >
              <Text style={[
                styles.bookName, 
                expandedBook === book.id && styles.bookNameExpanded
              ]}>
                {book.title || book.name}
              </Text>
            </TouchableOpacity>
            {expandedBook === book.id && renderChapters(book)}
          </View>
        ))}
      </ScrollView>

      {/* Segmented Control */}
      <View style={styles.bottomBar}>
        <View style={styles.segmentContainer}>
          <TouchableOpacity 
            style={[styles.segmentBtn, sortMode === 'Traditional' && styles.segmentBtnActive]}
            onPress={() => setSortMode('Traditional')}
          >
            <Text style={[styles.segmentText, sortMode === 'Traditional' && styles.segmentTextActive]}>
              Traditional
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentBtn, sortMode === 'Alphabetical' && styles.segmentBtnActive]}
            onPress={() => setSortMode('Alphabetical')}
          >
            <Text style={[styles.segmentText, sortMode === 'Alphabetical' && styles.segmentTextActive]}>
              Alphabetical
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, backgroundColor: '#fff' },
  bookItem: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
    backgroundColor: '#fff'
  },
  bookItemExpanded: {
    backgroundColor: '#fff', 
    borderBottomWidth: 0,
  },
  bookName: { fontSize: 16, color: '#1a1a1a', fontWeight: '600' },
  bookNameExpanded: { fontWeight: '700' },
  chapterGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
    justifyContent: 'flex-start',
  },
  chapterGridItem: {
    width: '18%',
    margin: '1%',
    height: 60, // Fixed height avoids the React Native aspectRatio+flexWrap bug
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  chapterGridText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a'
  },
  bottomBar: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#fff',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: 'transparent',
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  segmentTextActive: {
    color: '#1a1a1a',
  }
});
