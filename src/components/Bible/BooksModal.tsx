import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppModal from '../ui/AppModal';
import { useBooksModal } from '@/features/bible/presentation/hooks/useBooksModal';

interface BooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: any[];
  onSelectChapter: (bookId: string, chapterNum: string) => void;
}

export default function BooksModal({ isOpen, onClose, books, onSelectChapter }: BooksModalProps) {
  const { collapseBook, expandedBook, setSortMode, sortMode, sortedBooks, toggleBook } = useBooksModal(books);

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
                collapseBook();
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
        {sortedBooks.map((book) => {
          const isExpanded = expandedBook === String(book.id);
          return (
            <View key={book.id}>
              <TouchableOpacity
                style={[styles.bookItem, isExpanded && styles.bookItemExpanded]}
                onPress={() => toggleBook(book.id)}
              >
                <Text style={[styles.bookName, isExpanded && styles.bookNameExpanded]}>
                  {book.title || book.name}
                </Text>
              </TouchableOpacity>
              {isExpanded && renderChapters(book)}
            </View>
          );
        })}
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
  content: { flexShrink: 1, backgroundColor: '#fff' },
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
