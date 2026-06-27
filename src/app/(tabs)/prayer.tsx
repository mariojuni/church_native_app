import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Search, CheckCircle, X } from 'lucide-react-native';
import { usePrayers } from '../../hooks/usePrayers';
import { db } from '../../firebase';
import { doc, runTransaction, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';

export default function PrayerScreen() {
  const { currentUser } = useAuthStore();
  const { prayers, loading } = usePrayers();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Recent');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handlePray = async (id: string) => {
    if (!currentUser) return;
    const docRef = doc(db, 'prayers', id);
    const userId = currentUser.uid;

    try {
      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(docRef);
        if (!sfDoc.exists()) return;

        const currentLikedBy = sfDoc.data().likedBy || [];
        const currentLikes = sfDoc.data().likes || 0;
        let newLikedBy, newLikes;

        if (currentLikedBy.includes(userId)) {
          newLikedBy = currentLikedBy.filter((uid: string) => uid !== userId);
          newLikes = Math.max(0, currentLikes - 1);
        } else {
          newLikedBy = [...currentLikedBy, userId];
          newLikes = currentLikes + 1;
        }

        transaction.update(docRef, { likedBy: newLikedBy, likes: newLikes });
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAnswered = async (id: string, currentVal: boolean) => {
    const docRef = doc(db, 'prayers', id);
    try {
      await updateDoc(docRef, { answered: !currentVal });
    } catch (e) {
      console.error(e);
    }
  };

  const filteredRequests = prayers.filter((req: any) => {
    const matchesSearch = req.request?.toLowerCase().includes(search.toLowerCase()) ||
                          req.name?.toLowerCase().includes(search.toLowerCase());
                          
    if (filter === 'My Requests') {
      return matchesSearch && req.userId === currentUser?.uid;
    }
    if (filter === 'Answered') {
      return matchesSearch && req.answered === true;
    }
    return matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {isSearchOpen ? (
          <View style={styles.searchBar}>
            <Search size={18} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search requests..."
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>
        ) : (
          <Text style={styles.title}>Prayers</Text>
        )}

        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => setIsSearchOpen(!isSearchOpen)}
        >
          {isSearchOpen ? <X size={20} color="#1a1a1a" /> : <Search size={20} color="#1a1a1a" />}
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['Recent', 'My Requests', 'Answered'].map((f) => (
            <TouchableOpacity 
              key={f} 
              style={[styles.pill, filter === f && styles.pillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No prayer requests found.</Text>
          </View>
        ) : (
          filteredRequests.map((req: any) => {
            const isLiked = req.likedBy?.includes(currentUser?.uid);
            return (
              <View key={req.id} style={[styles.card, req.answered && styles.cardAnswered]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.cardName}>{req.name}</Text>
                    {req.answered && (
                      <View style={styles.answeredBadge}>
                        <CheckCircle size={10} color="#4ADE80" />
                        <Text style={styles.answeredText}>Answered</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardTime}>{formatTimeAgo(req.createdAt)}</Text>
                </View>

                <Text style={styles.cardRequest}>{req.request}</Text>

                <View style={styles.cardFooter}>
                  <TouchableOpacity 
                    style={[styles.prayButton, isLiked && styles.prayButtonActive]}
                    onPress={() => handlePray(req.id)}
                  >
                    <Heart size={14} color={isLiked ? '#fff' : '#007AFF'} fill={isLiked ? '#fff' : 'transparent'} />
                    <Text style={[styles.prayButtonText, isLiked && styles.prayButtonTextActive]}>
                      {isLiked ? 'Prayed' : 'Pray'} ({req.likes || 0})
                    </Text>
                  </TouchableOpacity>

                  {req.userId === currentUser?.uid && (
                    <TouchableOpacity onPress={() => handleToggleAnswered(req.id, req.answered)}>
                      <Text style={[styles.toggleText, req.answered && styles.toggleTextActive]}>
                        {req.answered ? 'Mark Active' : 'Mark Answered'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 34, fontWeight: '900', color: '#1a1a1a' },
  searchButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, height: 40, marginRight: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  filterContainer: { paddingBottom: 12 },
  filterScroll: { paddingHorizontal: 24, gap: 12 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1e4e8' },
  pillActive: { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
  pillText: { fontSize: 14, fontWeight: '600', color: '#666' },
  pillTextActive: { color: '#fff' },
  listContent: { padding: 24, paddingTop: 12, paddingBottom: 100, gap: 16 },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#888', fontSize: 14 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  cardAnswered: { borderLeftWidth: 4, borderLeftColor: '#4ADE80' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  answeredBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(74, 222, 128, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 4 },
  answeredText: { fontSize: 10, fontWeight: 'bold', color: '#4ADE80' },
  cardTime: { fontSize: 12, color: '#888' },
  cardRequest: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prayButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
  prayButtonActive: { backgroundColor: '#007AFF' },
  prayButtonText: { fontSize: 12, fontWeight: 'bold', color: '#007AFF' },
  prayButtonTextActive: { color: '#fff' },
  toggleText: { fontSize: 12, fontWeight: 'bold', color: '#4ADE80' },
  toggleTextActive: { color: '#888' },
});
