import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Crown, Users, Calendar, CalendarDays, HeartHandshake, HandHeart, Grid, BarChart3, BookOpen, ChevronRight, Quote, CheckCircle2, HelpCircle, XCircle } from 'lucide-react-native';
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
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth - 48;

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
      
      const allSchedules = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          date: data.date || docSnap.id // Fallback to doc ID for old format
        } as any;
      });

      const parseTime = (timeStr: string) => {
        if (!timeStr) return '09:00'; // Default legacy time
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return timeStr;
        let [_, hours, minutes, modifier] = match;
        let h = parseInt(hours, 10);
        if (modifier.toUpperCase() === 'PM' && h < 12) h += 12;
        if (modifier.toUpperCase() === 'AM' && h === 12) h = 0;
        return `${h.toString().padStart(2, '0')}:${minutes}`;
      };

      const upcoming = allSchedules
        .filter(s => {
          const now = new Date();
          // local date string in YYYY-MM-DD
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const todayStr = `${year}-${month}-${day}`;
          
          if (s.date > todayStr) return true;
          if (s.date < todayStr) return false;
          
          const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          let endTimeParsed = parseTime(s.endTime || s.time);
          
          if (!s.endTime) {
            // fallback: assume event lasts 2 hours
            let h = parseInt(endTimeParsed.split(':')[0], 10) + 2;
            if (h > 23) h = 23;
            endTimeParsed = `${String(h).padStart(2, '0')}:${endTimeParsed.split(':')[1]}`;
          }
          
          return endTimeParsed >= currentTimeStr;
        })
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return parseTime(a.time).localeCompare(parseTime(b.time));
        });

      if (upcoming.length > 0) {
        // Show up to 5 upcoming events in the carousel, closest first
        setUpcomingEvents(upcoming.slice(0, 5));
      } else {
        setUpcomingEvents([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleRsvp = async (eventId: string, status: string) => {
    const targetEvent = upcomingEvents.find(e => e.id === eventId);
    if (!targetEvent || !currentUser) return;
    
    let updatedDuties = targetEvent.duties ? [...targetEvent.duties] : [];
    const existingIndex = updatedDuties.findIndex((d: any) => d.userId === currentUser.uid);
    
    if (existingIndex >= 0) {
      updatedDuties[existingIndex] = { ...updatedDuties[existingIndex], status };
    } else {
      updatedDuties.push({
        userId: currentUser.uid,
        role: 'Attendee',
        status
      });
    }

    try {
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'schedules', eventId);
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
        {/* Ministerial Duty */
        upcomingEvents.map((event) => {
          let dutyRole = null;
          if (event.duties && Array.isArray(event.duties)) {
            const myDuty = event.duties.find((d: any) => d.userId === currentUser?.uid);
            if (myDuty) dutyRole = myDuty.role;
          } else {
            let duties = [];
            if (event.openingPrayer === currentUser?.uid) duties.push('Opening Prayer');
            if (event.tithesOfferingPrayer === currentUser?.uid) duties.push('Tithes & Offering Prayer');
            if (event.scriptureReading === currentUser?.uid) duties.push('Scripture Reading');
            if (event.praiseWorship === currentUser?.uid) duties.push('Praise & Worship');
            if (event.ushers && event.ushers.includes(currentUser?.uid)) duties.push('Usher');
            if (duties.length > 0) dutyRole = duties.join(', ');
          }

          if (!dutyRole) return null;

          return (
            <View key={`duty-${event.id}`} style={styles.dutyCard}>
              <View style={styles.dutyHeader}>
                <View style={styles.dutyHeaderLeft}>
                  <Crown size={16} color="#FF6596" />
                  <Text style={styles.dutyTitle}>Ministerial Update</Text>
                </View>
                <View style={styles.dutyDateBadge}>
                  <Text style={styles.dutyDateText}>
                    {new Date(`${event.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
              <Text style={styles.dutyText}>
                Thank you for your dedicated ministry, {displayName}. You are scheduled for 
                <Text style={styles.dutyHighlight}> {dutyRole} </Text>
                on {event.event || 'this Sunday'}.
              </Text>
            </View>
          );
        })}

        {/* Hero Card */}
        {upcomingEvents.length > 0 ? (
          <View>
            <ScrollView 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const slide = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
                setActiveSlide(slide);
              }}
              style={styles.heroScroll}
            >
              {upcomingEvents.map((event) => {
                let dutyRole = null;
                let dutyStatus = null;
                if (event.duties && Array.isArray(event.duties)) {
                  const myDuty = event.duties.find((d: any) => d.userId === currentUser?.uid);
                  if (myDuty) {
                    dutyRole = myDuty.role;
                    dutyStatus = myDuty.status;
                  }
                } else {
                  let duties = [];
                  if (event.openingPrayer === currentUser?.uid) duties.push('Opening Prayer');
                  if (event.tithesOfferingPrayer === currentUser?.uid) duties.push('Tithes & Offering Prayer');
                  if (event.scriptureReading === currentUser?.uid) duties.push('Scripture Reading');
                  if (event.praiseWorship === currentUser?.uid) duties.push('Praise & Worship');
                  if (event.ushers && event.ushers.includes(currentUser?.uid)) duties.push('Usher');
                  if (duties.length > 0) dutyRole = duties.join(', ');
                }

                return (
                  <View key={`hero-${event.id}`} style={{ width: cardWidth }}>
                    <TouchableOpacity activeOpacity={0.9}>
                      <LinearGradient
                        colors={['#FF6596', '#B66DFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                      >
                        <View style={styles.liveBadge}>
                          <Text style={styles.liveText}>UPCOMING</Text>
                          <CalendarDays size={12} color="#fff" />
                        </View>
                        <Text style={styles.heroTitle}>
                          {new Date(`${event.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </Text>
                        <Text style={styles.heroEventName}>{event.event || 'Sunday Worship Service'}</Text>
                        <Text style={styles.heroEventDetails}>
                          {event.time || '9:00 AM'} • {event.location || 'Main Sanctuary'}
                        </Text>
                        <View style={styles.heroRsvpRow}>
                          <TouchableOpacity style={[styles.heroRsvpBtn, dutyStatus === 'going' && styles.rsvpActiveBtn]} onPress={() => handleRsvp(event.id, 'going')}>
                            <CheckCircle2 size={16} color={dutyStatus === 'going' ? '#FF6596' : '#fff'} />
                            <Text style={[styles.heroRsvpText, dutyStatus === 'going' && styles.rsvpActiveText]}>Going</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.heroRsvpBtn, dutyStatus === 'maybe' && styles.rsvpActiveBtn]} onPress={() => handleRsvp(event.id, 'maybe')}>
                            <HelpCircle size={16} color={dutyStatus === 'maybe' ? '#F59E0B' : '#fff'} />
                            <Text style={[styles.heroRsvpText, dutyStatus === 'maybe' && { color: '#F59E0B' }]}>Maybe</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.heroRsvpBtn, dutyStatus === 'not_going' && styles.rsvpActiveBtn]} onPress={() => handleRsvp(event.id, 'not_going')}>
                            <XCircle size={16} color={dutyStatus === 'not_going' ? '#EF4444' : '#fff'} />
                            <Text style={[styles.heroRsvpText, dutyStatus === 'not_going' && { color: '#EF4444' }]}>Not Going</Text>
                          </TouchableOpacity>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
            
            {upcomingEvents.length > 1 && (
              <View style={styles.paginationRow}>
                {upcomingEvents.map((_, index) => (
                  <View 
                    key={`dot-${index}`} 
                    style={[styles.paginationDot, activeSlide === index && styles.paginationDotActive]} 
                  />
                ))}
              </View>
            )}
          </View>
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
  rsvpActiveBtn: { backgroundColor: '#fff' },
  rsvpActiveText: { color: '#FF6596' },
  heroCard: { padding: 24, borderRadius: 24, marginBottom: 0, overflow: 'hidden' },
  heroScroll: { marginBottom: 16 },
  paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 24 },
  paginationDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB' },
  paginationDotActive: { width: 20, backgroundColor: '#FF6596' },
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
