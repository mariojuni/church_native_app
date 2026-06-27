import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Download, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function GivingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
          <Text style={styles.title}>Giving</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <Download size={20} color="#1a1a1a" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroSub}>Total This Month</Text>
          <Text style={styles.heroTitle}>$42,180.50</Text>
          <View style={styles.goalBarContainer}>
            <View style={[styles.goalBarFill, { width: '84%' }]} />
          </View>
          <Text style={styles.goalText}>84% of $50,000 goal</Text>
        </View>
        
        <View style={styles.bentoGrid}>
          <View style={[styles.card, styles.fundCard]}>
            <Text style={styles.cardTitle}>Funds</Text>
            <View style={styles.fundList}>
              <View style={styles.fundItem}>
                <View style={[styles.dot, { backgroundColor: '#FF5FA0' }]} />
                <Text style={styles.fundLabel}>General</Text>
                <Text style={styles.fundValue}>75%</Text>
              </View>
              <View style={styles.fundItem}>
                <View style={[styles.dot, { backgroundColor: '#8B6FE8' }]} />
                <Text style={styles.fundLabel}>Missions</Text>
                <Text style={styles.fundValue}>15%</Text>
              </View>
              <View style={styles.fundItem}>
                <View style={[styles.dot, { backgroundColor: '#4D7FFF' }]} />
                <Text style={styles.fundLabel}>Building</Text>
                <Text style={styles.fundValue}>10%</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderTitle}>Giving Trend Chart</Text>
          <Text style={styles.placeholderSub}>Native charts coming soon.</Text>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F8' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 16,
    backgroundColor: '#FFF5F8'
  },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginLeft: 8 },
  iconBtn: { padding: 8 },
  content: { flex: 1, paddingHorizontal: 24 },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
    alignItems: 'center'
  },
  heroSub: { fontSize: 16, color: '#666', marginBottom: 8 },
  heroTitle: { fontSize: 36, fontWeight: '900', color: '#1a1a1a', marginBottom: 24 },
  goalBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12
  },
  goalBarFill: {
    height: '100%',
    backgroundColor: '#8B6FE8',
    borderRadius: 6
  },
  goalText: { fontSize: 14, color: '#666', fontWeight: '500' },
  bentoGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  fundCard: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  fundList: { gap: 12 },
  fundItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  fundLabel: { flex: 1, fontSize: 16, color: '#1a1a1a' },
  fundValue: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  placeholderCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  placeholderTitle: { fontSize: 18, fontWeight: 'bold', color: '#007AFF', marginBottom: 8 },
  placeholderSub: { fontSize: 14, color: '#666' }
});
