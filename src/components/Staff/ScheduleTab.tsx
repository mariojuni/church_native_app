import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Calendar, Clock, MapPin, CalendarPlus } from 'lucide-react-native';
import { useScheduleStore, getMinisterialTeam } from '../../store/useScheduleStore';
import { useMemberStore } from '../../store/useMemberStore';
import AddScheduleModal from './AddScheduleModal';

export default function ScheduleTab() {
  const { schedules, initializeSchedulesListener } = useScheduleStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);
  const { members } = useMemberStore();

  useEffect(() => {
    const unsubscribe = initializeSchedulesListener();
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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Event Schedules</Text>
        <TouchableOpacity 
          style={styles.addIconBtn} 
          onPress={() => {
            setEventToEdit(null);
            setIsAddModalOpen(true);
          }}
        >
          <CalendarPlus size={24} color="#FF6596" />
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
            
            // Get deduplicated ministerial team (excludes Attendee entries)
            const ministerialDuties = getMinisterialTeam(schedule);
            const team = ministerialDuties
              .map((duty) => {
                const member = members.find(m => m.id === duty.userId);
                if (!member) return null;
                return {
                  id: duty.userId,
                  role: duty.role,
                  avatar: member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=f0f0f0&color=999`
                };
              })
              .filter(Boolean);

            return (
              <TouchableOpacity 
                key={schedule.id} 
                style={[styles.card, team.length === 0 && { paddingBottom: 12 }]} 
                activeOpacity={0.7}
                onPress={() => {
                  setEventToEdit(schedule);
                  setIsAddModalOpen(true);
                }}
              >
                <View style={styles.cardContent}>
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateMonth}>{month}</Text>
                    <Text style={styles.dateDay}>{day}</Text>
                  </View>

                  <View style={styles.detailsBlock}>
                    <View style={styles.titleRow}>
                      <Text style={styles.eventTitle} numberOfLines={1}>{schedule.event}</Text>
                    </View>

                    <View style={[styles.roleRow, team.length === 0 && { marginBottom: 2 }]}>
                      <Text style={styles.weekdayText}>{weekday}</Text>
                      <Text style={styles.dotSeparator}>•</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Clock size={12} color="#888" style={{ marginRight: 4 }} />
                        <Text style={styles.infoText}>{schedule.time}{schedule.endTime ? ` - ${schedule.endTime}` : ''}</Text>
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
                            <View key={`${member.id}-${index}`} style={[styles.avatarWrapper, { zIndex: 10 - index, marginLeft: index > 0 ? -12 : 0 }]}>
                              <Image source={{ uri: member.avatar }} style={styles.teamAvatar} />
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <AddScheduleModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setEventToEdit(null);
        }} 
        eventToEdit={eventToEdit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  title: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  addIconBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 15 },
  listContainer: { gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  cardContent: { flexDirection: 'row' },
  dateBlock: { width: 60, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#f0f0f0', paddingRight: 16, marginRight: 16 },
  dateMonth: { fontSize: 13, fontWeight: '800', color: '#FF6596', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  dateDay: { fontSize: 28, fontWeight: '900', color: '#1a1a1a', lineHeight: 32 },
  detailsBlock: { flex: 1, paddingLeft: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  eventTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginRight: 8 },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dotSeparator: { color: '#ccc', marginHorizontal: 6, fontSize: 14 },
  weekdayText: { fontSize: 13, fontWeight: '600', color: '#888' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  infoText: { fontSize: 13, color: '#666', fontWeight: '500' },
  teamRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  teamAvatars: { flexDirection: 'row', paddingRight: 10, minHeight: 32 },
  avatarWrapper: { position: 'relative' },
  teamAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#fff' }
});
