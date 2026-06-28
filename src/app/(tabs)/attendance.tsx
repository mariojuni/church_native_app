import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Award, Calendar, QrCode } from 'lucide-react-native';
import { useMemberStore } from '../../store/useMemberStore';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import AttendanceTab from '../../components/Staff/AttendanceTab';

export default function AttendanceScreen() {
  const { members } = useMemberStore();
  const { userProfile } = useAuthStore();
  const isStaff = userProfile?.role?.toLowerCase() === 'staff';
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('reports');
  const [todayCheckins, setTodayCheckins] = useState<any[]>([]);

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    const todayStr = getTodayStr();
    const q = query(collection(db, 'attendance'), where('date', '==', todayStr));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTodayCheckins(data);
    });
    return () => unsubscribe();
  }, []);

  const checkedInMembers = todayCheckins.filter(c => c.type === 'member');
  const firstTimeVisitors = todayCheckins.filter(c => c.role === 'First-time Visitor' || c.status === 'new');
  const totalRegisteredMembers = members.length || 1;
  const checkedInRatio = Math.round((checkedInMembers.length / totalRegisteredMembers) * 100);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Staff</Text>
        </View>
        <TouchableOpacity style={styles.qrButton} onPress={() => router.push('/scanner')}>
          <QrCode size={20} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['Attendance', 'Schedule', 'Reports'].map((f) => (
            <TouchableOpacity 
              key={f} 
              style={[
                styles.pill, 
                activeTab === f.toLowerCase() && styles.pillActive,
                activeTab === f.toLowerCase() && styles.pillShadow
              ]}
              onPress={() => setActiveTab(f.toLowerCase())}
            >
              <Text style={[styles.pillText, activeTab === f.toLowerCase() && styles.pillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'reports' && (
          <View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#FFE8F0' }]}>
                  <Users size={20} color="#FF6596" />
                </View>
                <View>
                  <Text style={styles.statLabel}>Members</Text>
                  <Text style={styles.statValue}>{checkedInMembers.length}</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#E8F0FF' }]}>
                  <Award size={20} color="#4D8BFF" />
                </View>
                <View>
                  <Text style={styles.statLabel}>First-time Visitors</Text>
                  <Text style={styles.statValue}>{firstTimeVisitors.length}</Text>
                </View>
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Check-in Ratio</Text>
              <View style={styles.ratioCircle}>
                <Text style={styles.ratioValue}>{checkedInRatio}%</Text>
                <Text style={styles.ratioLabel}>checked in</Text>
              </View>
              <View style={styles.ratioFooter}>
                <Text style={styles.ratioFooterText}>Present: {checkedInMembers.length}</Text>
                <Text style={styles.ratioFooterText}>Total: {totalRegisteredMembers}</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'attendance' && (
          <AttendanceTab 
            members={members} 
            showStaffFeatures={isStaff} 
          />
        )}

        {activeTab === 'schedule' && (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>Service Schedule</Text>
            <Text style={styles.placeholderText}>Upcoming duty schedules will be listed here.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  title: { fontSize: 34, fontWeight: '900', color: '#1a1a1a', letterSpacing: -0.5 },
  qrButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  filterContainer: { paddingBottom: 16 },
  filterScroll: { paddingHorizontal: 24, gap: 16 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1e4e8' },
  pillActive: { backgroundColor: '#FF6596', borderColor: '#FF6596' },
  pillShadow: { shadowColor: '#FF6596', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
  pillText: { fontSize: 13, fontWeight: '600', color: '#666' },
  pillTextActive: { color: '#fff' },
  content: { paddingHorizontal: 24, paddingBottom: 100, gap: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12, color: '#666', fontWeight: '600' },
  statValue: { fontSize: 20, color: '#1a1a1a', fontWeight: '800' },
  chartCard: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16, alignSelf: 'flex-start' },
  ratioCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 8, borderColor: '#4ADE80', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  ratioValue: { fontSize: 24, fontWeight: '900', color: '#4ADE80' },
  ratioLabel: { fontSize: 10, color: '#666' },
  ratioFooter: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 16 },
  ratioFooterText: { fontSize: 12, color: '#888' },
  placeholderCard: { backgroundColor: '#E3F2FD', padding: 24, borderRadius: 16, alignItems: 'center' },
  placeholderTitle: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginBottom: 8 },
  placeholderText: { fontSize: 14, color: '#007AFF', textAlign: 'center', opacity: 0.8 },
});
