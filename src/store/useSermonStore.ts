import { create } from 'zustand';
import { sermonRepository } from '../features/sermons/data/sermon.repository';
import type {
  Sermon,
  SermonFilters,
  SermonNote,
  SermonDownload,
} from '../features/sermons/domain/sermon.types';

interface DownloadProgress {
  progress: number;
  isDownloading: boolean;
}

interface SermonState {
  // Sermons list
  sermons: Sermon[];
  loading: boolean;
  hasMore: boolean;
  lastDoc: any;
  filters: SermonFilters;
  searchQuery: string;

  // Current sermon
  currentSermon: Sermon | null;
  currentPosition: number;
  isPlaying: boolean;

  // Favorites
  favorites: Set<string>;
  favoritesLoading: boolean;

  // Notes
  notes: SermonNote[];
  notesLoading: boolean;

  // Downloads
  downloads: Map<string, DownloadProgress>;
  downloadedSermons: Set<string>;
  downloadsList: SermonDownload[];

  // Actions
  fetchSermons: (reset?: boolean) => Promise<void>;
  searchSermons: (query: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  fetchSermonById: (id: string) => Promise<void>;
  setFilters: (filters: Partial<SermonFilters>) => void;
  toggleFavorite: (userId: string, sermonId: string) => Promise<void>;
  loadFavorites: (userId: string) => Promise<void>;
  saveProgress: (userId: string, sermonId: string, position: number) => Promise<void>;
  setCurrentPosition: (position: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  fetchNotes: (userId: string, sermonId: string) => Promise<void>;
  addNote: (note: Omit<SermonNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (noteId: string, content: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  downloadSermon: (userId: string, sermon: Sermon) => Promise<void>;
  deleteDownload: (userId: string, sermonId: string) => Promise<void>;
  loadDownloadedSermons: (userId: string) => Promise<void>;
  checkIfDownloaded: (userId: string, sermonId: string) => Promise<boolean>;
  clearCurrentSermon: () => void;
}

export const useSermonStore = create<SermonState>((set, get) => ({
  sermons: [],
  loading: false,
  hasMore: true,
  lastDoc: null,
  filters: {
    filter: 'all',
    sort: 'newest',
  },
  searchQuery: '',
  currentSermon: null,
  currentPosition: 0,
  isPlaying: false,
  favorites: new Set(),
  favoritesLoading: false,
  notes: [],
  notesLoading: false,
  downloads: new Map(),
  downloadedSermons: new Set(),
  downloadsList: [],

  fetchSermons: async (reset = false) => {
    const { filters, lastDoc, loading, searchQuery } = get();
    if (loading) return;

    // If there's a search query, use search instead
    if (searchQuery.trim()) {
      return get().searchSermons(searchQuery);
    }

    set({ loading: true });

    try {
      const result = await sermonRepository.fetchSermons(
        filters,
        20,
        reset ? undefined : lastDoc
      );

      set((state) => ({
        sermons: reset ? result.sermons : [...state.sermons, ...result.sermons],
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching sermons:', error);
      set({ loading: false });
    }
  },

  searchSermons: async (query: string) => {
    const { filters, loading } = get();
    if (loading) return;

    set({ loading: true, searchQuery: query });

    if (!query.trim()) {
      // If query is empty, fetch normal sermons
      return get().fetchSermons(true);
    }

    try {
      const result = await sermonRepository.searchSermons(query, filters, 20);

      set({
        sermons: result.sermons,
        lastDoc: null,
        hasMore: result.hasMore,
        loading: false,
      });
    } catch (error) {
      console.error('Error searching sermons:', error);
      set({ loading: false });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  fetchSermonById: async (id: string) => {
    set({ loading: true });
    try {
      const sermon = await sermonRepository.fetchSermonById(id);
      set({ currentSermon: sermon, loading: false });
      
      // Increment view count
      if (sermon) {
        sermonRepository.incrementViewCount(id);
      }
    } catch (error) {
      console.error('Error fetching sermon:', error);
      set({ loading: false });
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      sermons: [],
      lastDoc: null,
      hasMore: true,
    }));
    get().fetchSermons(true);
  },

  toggleFavorite: async (userId, sermonId) => {
    try {
      const isFavorited = await sermonRepository.toggleFavorite(userId, sermonId);
      set((state) => {
        const newFavorites = new Set(state.favorites);
        if (isFavorited) {
          newFavorites.add(sermonId);
        } else {
          newFavorites.delete(sermonId);
        }
        return { favorites: newFavorites };
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  },

  loadFavorites: async (userId) => {
    set({ favoritesLoading: true });
    try {
      const favoriteSermons = await sermonRepository.fetchFavorites(userId);
      const favoriteIds = new Set(favoriteSermons.map(s => s.id));
      set({ favorites: favoriteIds, favoritesLoading: false });
    } catch (error) {
      console.error('Error loading favorites:', error);
      set({ favoritesLoading: false });
    }
  },

  saveProgress: async (userId, sermonId, position) => {
    try {
      await sermonRepository.saveProgress(userId, sermonId, position);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  },

  setCurrentPosition: (position) => set({ currentPosition: position }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  fetchNotes: async (userId, sermonId) => {
    set({ notesLoading: true });
    try {
      const notes = await sermonRepository.fetchNotes(userId, sermonId);
      set({ notes, notesLoading: false });
    } catch (error) {
      console.error('Error fetching notes:', error);
      set({ notesLoading: false });
    }
  },

  addNote: async (note) => {
    try {
      await sermonRepository.saveNote(note);
      get().fetchNotes(note.userId, note.sermonId);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  },

  updateNote: async (noteId, content) => {
    try {
      await sermonRepository.updateNote(noteId, content);
      // Refresh notes list
      const { currentSermon, notes } = get();
      if (currentSermon && notes.length > 0) {
        const firstNote = notes[0];
        get().fetchNotes(firstNote.userId, currentSermon.id);
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  },

  deleteNote: async (noteId) => {
    try {
      await sermonRepository.deleteNote(noteId);
      // Remove from local state
      set((state) => ({
        notes: state.notes.filter(note => note.id !== noteId),
      }));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  },

  downloadSermon: async (userId: string, sermon: Sermon) => {
    const { downloads } = get();
    
    // Set downloading state
    const newDownloads = new Map(downloads);
    newDownloads.set(sermon.id, { progress: 0, isDownloading: true });
    set({ downloads: newDownloads });

    try {
      await sermonRepository.downloadSermon(userId, sermon, (progress) => {
        const updatedDownloads = new Map(get().downloads);
        updatedDownloads.set(sermon.id, { progress, isDownloading: true });
        set({ downloads: updatedDownloads });
      });

      // Mark as downloaded
      const finalDownloads = new Map(get().downloads);
      finalDownloads.delete(sermon.id);
      set({ 
        downloads: finalDownloads,
        downloadedSermons: new Set([...get().downloadedSermons, sermon.id])
      });

      // Refresh downloads list
      await get().loadDownloadedSermons(userId);
    } catch (error) {
      console.error('Error downloading sermon:', error);
      const errorDownloads = new Map(get().downloads);
      errorDownloads.delete(sermon.id);
      set({ downloads: errorDownloads });
      throw error;
    }
  },

  deleteDownload: async (userId: string, sermonId: string) => {
    try {
      await sermonRepository.deleteDownload(userId, sermonId);
      
      const newDownloaded = new Set(get().downloadedSermons);
      newDownloaded.delete(sermonId);
      set({ downloadedSermons: newDownloaded });

      // Refresh downloads list
      await get().loadDownloadedSermons(userId);
    } catch (error) {
      console.error('Error deleting download:', error);
    }
  },

  loadDownloadedSermons: async (userId: string) => {
    try {
      const downloads = await sermonRepository.getDownloadedSermons(userId);
      set({
        downloadsList: downloads,
        downloadedSermons: new Set(downloads.map(d => d.sermonId))
      });
    } catch (error) {
      console.error('Error loading downloaded sermons:', error);
    }
  },

  checkIfDownloaded: async (userId: string, sermonId: string): Promise<boolean> => {
    try {
      return await sermonRepository.checkIfDownloaded(userId, sermonId);
    } catch (error) {
      console.error('Error checking download status:', error);
      return false;
    }
  },

  clearCurrentSermon: () => {
    set({
      currentSermon: null,
      currentPosition: 0,
      isPlaying: false,
      notes: [],
    });
  },
}));
