import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Calendar, Clock, MapPin, ChevronRight, Plus, CheckCircle2, XCircle, HelpCircle } from 'lucide-react-native';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useMemberStore } from '../../store/useMemberStore';
import AddScheduleModal from './AddScheduleModal';

export default function ScheduleTab() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { members } = useMemberStore();

  useEffect(() => {
    const q = query(collection(db, 'schedules'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsed = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchedules(parsed);
    });
    return () => unsubscribe();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: d.getDate(),
      weekday: d.toLocaleDateString('en-US', { weekday: 'long' })
    };
  };

  const renderStatusIcon = (status: string) => {
    if (status === 'going') return <CheckCircle2 size={12} color="#4ADE80" style={styles.statusIcon} />;
    if (status === 'not_going') return <XCircle size={12} color="#EF4444" style={styles.statusIcon} />;
    return <HelpCircle size={12} color="#F59E0B" style={styles.statusIcon} />; // maybe or pending
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Service Schedules</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalOpen(true)}>
          <Plus size={16} color="#fff" />
          <Text style={styles.addText}>Add Event</Text>
        </TouchableOpacity>
      </View>

      {schedules.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No upcoming schedules found.</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {schedules.map((schedule) => {
            const { month, day, weekday } = formatDate(schedule.date);
            
            // Map duties to user avatars
            const team = (schedule.duties || []).map((duty: any) => {
              const member = members.find(m => m.id === duty.userId);
              return {
                id: duty.userId,
                role: duty.role,
                status: duty.status,
                avatar: member?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member?.name || 'User')}&background=f0f0f0&color=999`
              };
            });

            return (
              <TouchableOpacity key={schedule.id} style={styles.card} activeOpacity={0.7}>
                <View style={styles.dateBlock}>
                  <Text style={styles.dateMonth}>{month}</Text>
                  <Text style={styles.dateDay}>{day}</Text>
                </View>

                <View style={styles.detailsBlock}>
                  <View style={styles.titleRow}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{schedule.event}</Text>
                  </View>

                  <View style={styles.roleRow}>
                    <Text style={styles.weekdayText}>{weekday}</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Clock size={12} color="#888" style={{ marginRight: 4 }} />
                      <Text style={styles.infoText}>{schedule.time}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <MapPin size={14} color="#888" style={{ marginRight: 4 }} />
                    <Text style={styles.infoText}>{schedule.location}</Text>
                  </View>

                  {team.length > 0 && (
                    <View style={styles.teamRow}>
                      <View style={styles.teamAvatars}>
                        {team.map((member: any, index: number) => (
                          <View key={member.id} style={[styles.avatarWrapper, { zIndex: 10 - index, marginLeft: index > 0 ? -12 : 0 }]}>
                            <Image source={{ uri: member.avatar }} style={styles.teamAvatar} />
                            {renderStatusIcon(member.status)}
                          </View>
                        ))}
                      </View>
                      <View style={styles.actionArrow}>
                        <ChevronRight size={18} color="#ccc" />
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <AddScheduleModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  title: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FF6596', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, shadowColor: '#FF6596', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  addText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 15 },
  listContainer: { gap: 16 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  dateBlock: { width: 60, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#f0f0f0', paddingRight: 16, marginRight: 16 },
  dateMonth: { fontSize: 13, fontWeight: '800', color: '#FF6596', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  dateDay: { fontSize: 28, fontWeight: '900', color: '#1a1a1a', lineHeight: 32 },
  detailsBlock: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  eventTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginRight: 8 },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dotSeparator: { color: '#ccc', marginHorizontal: 6, fontSize: 14 },
  weekdayText: { fontSize: 13, fontWeight: '600', color: '#888' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { fontSize: 13, color: '#666', fontWeight: '500' },
  teamRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  teamAvatars: { flexDirection: 'row', paddingRight: 10 },
  avatarWrapper: { position: 'relative' },
  teamAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#fff' },
  statusIcon: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#fff', borderRadius: 6, overflow: 'hidden' },
  actionArrow: { width: 28, height: 28, alignItems: 'flex-end', justifyContent: 'center' }
});
