import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Calendar, Clock, MapPin, ChevronRight, Filter } from 'lucide-react-native';

const mockSchedules = [
  {
    id: '1',
    date: '2026-07-05',
    time: '09:00 AM - 12:00 PM',
    event: 'Sunday Morning Service',
    role: 'Usher Head',
    location: 'Main Sanctuary',
    status: 'confirmed',
    team: [
      { id: 't1', name: 'Mario', avatar: 'https://ui-avatars.com/api/?name=Mario&background=f0f0f0&color=999' },
      { id: 't2', name: 'Sarah', avatar: 'https://ui-avatars.com/api/?name=Sarah&background=f0f0f0&color=999' }
    ]
  },
  {
    id: '2',
    date: '2026-07-08',
    time: '06:30 PM - 08:30 PM',
    event: 'Midweek Prayer Meeting',
    role: 'Audio/Visual Tech',
    location: 'Chapel',
    status: 'pending',
    team: [
      { id: 't3', name: 'John', avatar: 'https://ui-avatars.com/api/?name=John&background=f0f0f0&color=999' }
    ]
  },
  {
    id: '3',
    date: '2026-07-12',
    time: '08:00 AM - 11:00 AM',
    event: 'Sunday Morning Service',
    role: 'Welcome Team',
    location: 'Lobby',
    status: 'confirmed',
    team: [
      { id: 't4', name: 'Emily', avatar: 'https://ui-avatars.com/api/?name=Emily&background=f0f0f0&color=999' },
      { id: 't5', name: 'David', avatar: 'https://ui-avatars.com/api/?name=David&background=f0f0f0&color=999' },
      { id: 't6', name: 'Anna', avatar: 'https://ui-avatars.com/api/?name=Anna&background=f0f0f0&color=999' }
    ]
  }
];

export default function ScheduleTab() {
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
      {/* Header / Filter Row */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Upcoming Duties</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter size={16} color="#666" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Schedule List */}
      <View style={styles.listContainer}>
        {mockSchedules.map((schedule) => {
          const { month, day, weekday } = formatDate(schedule.date);
          const isPending = schedule.status === 'pending';

          return (
            <TouchableOpacity key={schedule.id} style={styles.card} activeOpacity={0.7}>
              {/* Left Side: Date Block */}
              <View style={styles.dateBlock}>
                <Text style={styles.dateMonth}>{month}</Text>
                <Text style={styles.dateDay}>{day}</Text>
              </View>

              {/* Right Side: Details */}
              <View style={styles.detailsBlock}>
                <View style={styles.titleRow}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{schedule.event}</Text>
                  {isPending && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  )}
                </View>

                <View style={styles.roleRow}>
                  <Text style={styles.roleText}>{schedule.role}</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.weekdayText}>{weekday}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Clock size={14} color="#888" style={{ marginRight: 4 }} />
                  <Text style={styles.infoText}>{schedule.time}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <MapPin size={14} color="#888" style={{ marginRight: 4 }} />
                  <Text style={styles.infoText}>{schedule.location}</Text>
                </View>

                {/* Team Members */}
                <View style={styles.teamRow}>
                  <View style={styles.teamAvatars}>
                    {schedule.team.map((member, index) => (
                      <Image 
                        key={member.id} 
                        source={{ uri: member.avatar }} 
                        style={[styles.teamAvatar, { zIndex: 10 - index, marginLeft: index > 0 ? -10 : 0 }]} 
                      />
                    ))}
                  </View>
                  <View style={styles.actionArrow}>
                    <ChevronRight size={18} color="#ccc" />
                  </View>
                </View>

              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  listContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  dateBlock: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
    paddingRight: 16,
    marginRight: 16,
  },
  dateMonth: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF6596',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  dateDay: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1a1a1a',
    lineHeight: 32,
  },
  detailsBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
    marginRight: 8,
  },
  pendingBadge: {
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    textTransform: 'uppercase',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4D8BFF',
  },
  dotSeparator: {
    color: '#ccc',
    marginHorizontal: 6,
    fontSize: 14,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  teamAvatars: {
    flexDirection: 'row',
  },
  teamAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
  },
  actionArrow: {
    width: 28,
    height: 28,
    alignItems: 'flex-end',
    justifyContent: 'center',
  }
});
