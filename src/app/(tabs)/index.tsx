import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Crown, Users, Calendar, HeartHandshake, HandHeart, Grid, BarChart3, BookOpen, ChevronRight, Quote, CheckCircle2, HelpCircle, XCircle } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useMemberStore } from '../../store/useMemberStore';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, runTransaction, where } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const { userProfile, currentUser } = useAuthStore();
  const { members } = useMemberStore();
  const isStaff = userProfile?.role?.toLowerCase() === 'staff';
  const router = useRouter();

  const [latestPrayer, setLatestPrayer] = useState<any>(null);
  const [upcomingEvent, setUpcomingEvent] = useState<any>(null);
  const [upcomingDuty, setUpcomingDuty] = useState<string | null>(null);
  const [dutyStatus, setDutyStatus] = useState<string | null>(null);

  const displayName = userProfile?.name 
    ? userProfile.name.split(' ')[0] 
    : (currentUser?.displayName ? currentUser.displayName.split(' ')[0] : 'User');

  useEffect(() => {
    const q = query(collection(db, 'prayers'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setLatestPrayer({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setLatestPrayer(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = collection(db, 'schedules');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const today = new Date().toISOString().split('T')[0];
      
      const allSchedules = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          date: data.date || docSnap.id // Fallback to doc ID for old format
        } as any;
      });

      const upcoming = allSchedules
        .filter(s => s.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (upcoming.length > 0) {
        const nextEvent = upcoming[0];
        setUpcomingEvent(nextEvent);

        // Check new format (duties array)
        if (nextEvent.duties && Array.isArray(nextEvent.duties)) {
          const myDuty = nextEvent.duties.find((d: any) => d.userId === currentUser.uid);
          setUpcomingDuty(myDuty ? myDuty.role : null);
          setDutyStatus(myDuty ? myDuty.status : null);
        } else {
          // Check old format
          let duties = [];
          if (nextEvent.openingPrayer === currentUser.uid) duties.push('Opening Prayer');
          if (nextEvent.tithesOfferingPrayer === currentUser.uid) duties.push('Tithes & Offering Prayer');
          if (nextEvent.scriptureReading === currentUser.uid) duties.push('Scripture Reading');
          if (nextEvent.praiseWorship === currentUser.uid) duties.push('Praise & Worship');
          if (nextEvent.ushers && nextEvent.ushers.includes(currentUser.uid)) duties.push('Usher');
          
          setUpcomingDuty(duties.length > 0 ? duties.join(', ') : null);
          setDutyStatus(null); // Old format doesn't have status
        }
      } else {
        setUpcomingEvent(null);
        setUpcomingDuty(null);
        setDutyStatus(null);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleRsvp = async (status: string) => {
    if (!upcomingEvent || !currentUser || !upcomingEvent.duties) {
      alert("RSVP is only available for newer schedules created via the Staff tab.");
      return;
    }
    
    const updatedDuties = upcomingEvent.duties.map((d: any) => {
      if (d.userId === currentUser.uid) {
        return { ...d, status };
      }
      return d;
    });

    try {
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'schedules', upcomingEvent.id);
        transaction.update(docRef, { duties: updatedDuties });
      });
    } catch (e) {
      console.error(e);
    }
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.title}>{displayName}!</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/my-qr')}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=11' }} style={styles.avatar} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Ministerial Duty */}
        {upcomingEvent && upcomingDuty && (
          <View style={styles.dutyCard}>
            <View style={styles.dutyHeader}>
              <View style={styles.dutyHeaderLeft}>
                <Crown size={16} color="#FF6596" />
                <Text style={styles.dutyTitle}>Ministerial Update</Text>
              </View>
              <View style={styles.dutyDateBadge}>
                <Text style={styles.dutyDateText}>
                  {new Date(`${upcomingEvent.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
            <Text style={styles.dutyText}>
              Thank you for your dedicated ministry, {displayName}. You are scheduled for 
              <Text style={styles.dutyHighlight}> {upcomingDuty} </Text>
              on {upcomingEvent.event || 'this Sunday'}.
            </Text>


          </View>
        )}

        {/* Hero Card */}
        {upcomingEvent ? (
          <TouchableOpacity activeOpacity={0.9}>
            <LinearGradient
              colors={['#FF6596', '#B66DFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.liveBadge}>
                <Text style={styles.liveText}>UPCOMING</Text>
                <Crown size={12} color="#fff" />
              </View>
              <Text style={styles.heroTitle}>
                {new Date(`${upcomingEvent.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.heroEventName}>{upcomingEvent.event || 'Sunday Worship Service'}</Text>
              <Text style={styles.heroEventDetails}>
                {upcomingEvent.time || '9:00 AM'} • {upcomingEvent.location || 'Main Sanctuary'}
              </Text>
              {upcomingDuty && (
                <View style={styles.heroRsvpRow}>
                  <TouchableOpacity style={[styles.heroRsvpBtn, dutyStatus === 'going' && styles.rsvpGoing]} onPress={() => handleRsvp('going')}>
                    <CheckCircle2 size={16} color="#fff" />
                    <Text style={styles.heroRsvpText}>Going</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.heroRsvpBtn, dutyStatus === 'maybe' && styles.rsvpMaybe]} onPress={() => handleRsvp('maybe')}>
                    <HelpCircle size={16} color="#fff" />
                    <Text style={styles.heroRsvpText}>Maybe</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.heroRsvpBtn, dutyStatus === 'not_going' && styles.rsvpNotGoing]} onPress={() => handleRsvp('not_going')}>
                    <XCircle size={16} color="#fff" />
                    <Text style={styles.heroRsvpText}>Not Going</Text>
                  </TouchableOpacity>
                </View>
              )}
              {!upcomingDuty && (
                <Text style={[styles.heroSub, { marginTop: 16 }]}>{isStaff ? 'Tap to view attendance and check-ins' : 'Join us for worship'}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.9}>
            <LinearGradient
              colors={['#FF6596', '#B66DFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.liveBadge}>
                <Text style={styles.liveText}>LIVE SERVICE</Text>
                <Crown size={12} color="#fff" />
              </View>
              <Text style={styles.heroTitle}>Sunday 9:00 AM{'\n'}Worship & Sermon</Text>
              <Text style={styles.heroSub}>{isStaff ? 'Tap to view live attendance and check-ins right now!' : 'Join us for worship'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Action Grid */}
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem}>
            <View style={styles.iconWrapper}>
              <Users color="#4D8BFF" size={24} />
            </View>
            <Text style={styles.gridLabel}>Members</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <View style={styles.iconWrapper}>
              <Calendar color="#8B6FE8" size={24} />
            </View>
            <Text style={styles.gridLabel}>Events</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/giving')}>
            <View style={styles.iconWrapper}>
              <HandHeart color="#4ADE80" size={24} />
            </View>
            <Text style={styles.gridLabel}>Giving</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/more')}>
            <View style={styles.iconWrapper}>
              <Grid color="#FF6596" size={24} />
            </View>
            <Text style={styles.gridLabel}>More</Text>
          </TouchableOpacity>
        </View>

        {/* Prayer Wall */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prayer Wall</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/prayer')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {latestPrayer ? (
          <View style={[styles.prayerCard, latestPrayer.answered && { borderLeftColor: '#4ADE80' }]}>
            <View style={styles.prayerTop}>
              <Text style={styles.prayerName}>{latestPrayer.name}</Text>
              <Text style={styles.prayerTime}>{formatTimeAgo(latestPrayer.createdAt)}</Text>
            </View>
            <Text style={styles.prayerText}>{latestPrayer.request}</Text>
            <TouchableOpacity 
              style={[styles.prayButton, latestPrayer.likedBy?.includes(currentUser?.uid) && styles.prayButtonActive]}
              onPress={() => handlePray(latestPrayer.id)}
            >
              <HeartHandshake size={14} color={latestPrayer.likedBy?.includes(currentUser?.uid) ? '#fff' : '#007AFF'} />
              <Text style={[styles.prayButtonText, latestPrayer.likedBy?.includes(currentUser?.uid) && styles.prayButtonTextActive]}>
                {latestPrayer.likedBy?.includes(currentUser?.uid) ? 'Prayed' : 'Pray'} ({latestPrayer.likes || 0})
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No prayer requests yet.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, paddingBottom: 12 },
  greeting: { fontSize: 16, color: '#666' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  scrollContent: { padding: 24, paddingTop: 12, paddingBottom: 100 },
  dutyCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FFE8F0', borderLeftWidth: 4, borderLeftColor: '#FF6596', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  dutyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  dutyHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dutyTitle: { fontSize: 14, fontWeight: '800', color: '#1a1a1a' },
  dutyDateBadge: { backgroundColor: '#FFE8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  dutyDateText: { fontSize: 11, fontWeight: '800', color: '#FF6596' },
  dutyText: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 12 },
  dutyHighlight: { color: '#FF6596', fontWeight: 'bold' },
  rsvpRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  rsvpBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  rsvpText: { fontSize: 12, fontWeight: '700', color: '#666' },
  rsvpGoing: { backgroundColor: '#4ADE80' },
  rsvpMaybe: { backgroundColor: '#F59E0B' },
  rsvpNotGoing: { backgroundColor: '#EF4444' },
  rsvpTextActive: { color: '#fff' },
  heroCard: { padding: 24, borderRadius: 24, marginBottom: 24, overflow: 'hidden' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginBottom: 16, gap: 4 },
  liveText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  heroTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 4 },
  heroEventName: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 4 },
  heroEventDetails: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  heroRsvpRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  heroRsvpBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  heroRsvpText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 32 },
  gridItem: { width: '22%', alignItems: 'center' },
  iconWrapper: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  gridLabel: { fontSize: 12, fontWeight: '500', color: '#1a1a1a' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  seeAll: { fontSize: 14, color: '#FF6596', fontWeight: '600' },
  prayerCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#FF6596', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  prayerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  prayerName: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a' },
  prayerTime: { fontSize: 12, color: '#888' },
  prayerText: { fontSize: 14, color: '#444', marginBottom: 12, lineHeight: 20 },
  prayButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#FFE8F0', gap: 6 },
  prayButtonActive: { backgroundColor: '#FF6596' },
  prayButtonText: { fontSize: 12, fontWeight: '600', color: '#FF6596' },
  prayButtonTextActive: { color: '#fff' },
  emptyCard: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 14 },
});
