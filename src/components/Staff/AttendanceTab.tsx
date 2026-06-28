import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image, 
  Modal, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { 
  Search, CheckCircle, X, Users, CalendarDays, 
  UserPlus, Trash2, Clock, ShieldAlert 
} from 'lucide-react-native';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface AttendanceTabProps {
  members: any[];
  showStaffFeatures: boolean;
}

export default function AttendanceTab({ members, showStaffFeatures }: AttendanceTabProps) {
  const [filterDate, setFilterDate] = useState(getTodayStr());
  const [filteredScannerCheckins, setFilteredScannerCheckins] = useState<any[]>([]);
  const [searchCheckedInQuery, setSearchCheckedInQuery] = useState('');

  // Modals state
  const [isManualCheckinOpen, setIsManualCheckinOpen] = useState(false);
  const [manualCheckinQuery, setManualCheckinQuery] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const [selectedCheckinMember, setSelectedCheckinMember] = useState<any>(null);

  // Firestore sync listener for the selected date
  useEffect(() => {
    const q = query(
      collection(db, 'attendance'),
      where('date', '==', filterDate),
      where('type', '==', 'member')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort descending by timestamp
      data.sort((a: any, b: any) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp || 0).getTime();
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      setFilteredScannerCheckins(data);
    }, (error) => {
      console.error("Error fetching filtered scanner check-ins:", error);
    });

    return () => unsubscribe();
  }, [filterDate]);

  const handleManualCheckin = async (memberToScan: any) => {
    if (!memberToScan) return;
    setScanLoading(true);
    setScanMessage('');

    try {
      const alreadyChecked = filteredScannerCheckins.some(
        c => c.userId === memberToScan.id && c.type === 'member'
      );

      if (alreadyChecked) {
        setScanMessage(`⚠️ ${memberToScan.name} is already checked in for today.`);
        setScanLoading(false);
        return;
      }

      await addDoc(collection(db, 'attendance'), {
        userId: memberToScan.id,
        name: memberToScan.name,
        role: memberToScan.role || 'Member',
        status: memberToScan.status || 'active',
        date: filterDate,
        timestamp: serverTimestamp(),
        type: 'member'
      });

      setScanMessage(`🎉 Checked in ${memberToScan.name} successfully!`);
    } catch (err) {
      console.error("Error simulating checkin scan:", err);
      Alert.alert("Error", "Could not check in member.");
    } finally {
      setScanLoading(false);
      setManualCheckinQuery('');
      setTimeout(() => {
        setIsManualCheckinOpen(false);
        setScanMessage('');
      }, 1500);
    }
  };

  const handleDeleteCheckin = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'attendance', id));
      setSelectedCheckinMember(null);
    } catch (error) {
      console.error("Error deleting check-in:", error);
      Alert.alert("Error", "Could not undo check-in.");
    }
  };

  const formatCheckinTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const uncheckedMembers = members.filter(
    m => !filteredScannerCheckins.some(c => c.userId === m.id)
  );

  const matchingUncheckedMembers = uncheckedMembers.filter(m => 
    m.name?.toLowerCase().includes(manualCheckinQuery.toLowerCase())
  );

  const displayedCheckins = filteredScannerCheckins.filter(c => 
    c.name?.toLowerCase().includes(searchCheckedInQuery.toLowerCase())
  );

  const isToday = filterDate === getTodayStr();

  if (!showStaffFeatures) {
    return (
      <View style={styles.restrictedCard}>
        <ShieldAlert size={48} color="#FF6596" />
        <Text style={styles.restrictedTitle}>Staff Access Restricted</Text>
        <Text style={styles.restrictedText}>
          The Attendance system is a staff-facing utility. You do not have permission to view this.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Search size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search checked-in..."
          value={searchCheckedInQuery}
          onChangeText={setSearchCheckedInQuery}
          placeholderTextColor="#888"
        />
      </View>

      {/* Header Info */}
      <View style={styles.headerInfo}>
        <View>
          <Text style={styles.headerTitle}>Checked-in</Text>
          <Text style={styles.headerSubtitle}>{displayedCheckins.length} present</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => setFilterDate(isToday ? '2023-01-01' : getTodayStr())} // Simple toggle for now
          >
            <CalendarDays size={16} color="#FF6596" />
            <Text style={styles.actionBtnText}>
              {isToday ? 'Today' : filterDate}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { paddingHorizontal: 12 }]}
            onPress={() => setIsManualCheckinOpen(true)}
          >
            <UserPlus size={16} color="#FF6596" />
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <View style={styles.listContainer}>
        {displayedCheckins.length > 0 ? (
          displayedCheckins.map(c => {
            const memberInfo = members.find(m => m.id === c.userId) || {};
            const isNew = c.status === 'new' || c.role === 'First-time Visitor';
            return (
              <TouchableOpacity 
                key={c.id} 
                style={styles.card}
                onPress={() => setSelectedCheckinMember({ ...c, memberInfo })}
                activeOpacity={0.7}
              >
                <Image 
                  source={{ uri: memberInfo.avatar || 'https://i.pravatar.cc/150' }} 
                  style={styles.avatar} 
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardName} numberOfLines={1}>{c.name}</Text>
                  <View style={[styles.roleBadge, isNew ? styles.roleBadgeNew : null]}>
                    <Text style={[styles.roleText, isNew ? styles.roleTextNew : null]}>
                      {c.role || 'Member'}
                    </Text>
                  </View>
                </View>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeText}>{formatCheckinTime(c.timestamp)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Users size={32} color="#aaa" />
            </View>
            <Text style={styles.emptyTitle}>No check-ins found</Text>
            <Text style={styles.emptyText}>When members scan in or are marked present, they will appear here.</Text>
          </View>
        )}
      </View>

      {/* Manual Check-in Modal */}
      <Modal visible={isManualCheckinOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.dragHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manual Check-in</Text>
              <TouchableOpacity onPress={() => setIsManualCheckinOpen(false)} style={styles.closeBtn}>
                <X size={20} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrapper}>
              <Search size={20} color="#888" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search member to check in..."
                value={manualCheckinQuery}
                onChangeText={setManualCheckinQuery}
              />
              {scanLoading && <ActivityIndicator size="small" color="#FF6596" style={styles.loadingSpinner} />}
            </View>

            {scanMessage ? (
              <View style={[styles.toast, scanMessage.startsWith('⚠️') ? styles.toastWarn : styles.toastSuccess]}>
                <CheckCircle size={18} color={scanMessage.startsWith('⚠️') ? '#92400E' : '#03543F'} />
                <Text style={styles.toastText}>{scanMessage}</Text>
              </View>
            ) : null}

            <ScrollView style={styles.modalScroll}>
              {matchingUncheckedMembers.length > 0 ? (
                matchingUncheckedMembers.map(m => (
                  <View key={m.id} style={styles.modalListItem}>
                    <View style={styles.modalListItemLeft}>
                      <Image source={{ uri: m.avatar || 'https://i.pravatar.cc/150' }} style={styles.modalAvatar} />
                      <View>
                        <Text style={styles.modalMemberName}>{m.name}</Text>
                        <Text style={styles.modalMemberRole}>{m.role}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.addBtn}
                      onPress={() => handleManualCheckin(m)}
                      disabled={scanLoading}
                    >
                      <UserPlus size={14} color="#FF6596" />
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Users size={32} color="#ccc" style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyText}>No members found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal visible={!!selectedCheckinMember} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          {selectedCheckinMember && (
            <View style={[styles.modalSheet, { alignItems: 'center' }]}>
              <View style={styles.dragHandle} />
              
              <Image 
                source={{ uri: selectedCheckinMember.memberInfo?.avatar || 'https://i.pravatar.cc/150' }} 
                style={styles.detailsAvatar} 
              />
              <Text style={styles.detailsName}>{selectedCheckinMember.name}</Text>
              
              <View style={[styles.roleBadge, selectedCheckinMember.status === 'new' ? styles.roleBadgeNew : null, { marginBottom: 16 }]}>
                <Text style={[styles.roleText, selectedCheckinMember.status === 'new' ? styles.roleTextNew : null]}>
                  {selectedCheckinMember.role || 'Member'}
                </Text>
              </View>

              <View style={styles.timeInfoCard}>
                <Clock size={16} color="#666" />
                <Text style={styles.timeInfoText}>Checked in at</Text>
                <Text style={styles.timeInfoValue}>{formatCheckinTime(selectedCheckinMember.timestamp)}</Text>
              </View>

              <View style={{ width: '100%', gap: 12 }}>
                <TouchableOpacity 
                  style={styles.secondaryBtn}
                  onPress={() => setSelectedCheckinMember(null)}
                >
                  <Text style={styles.secondaryBtnText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.dangerBtn}
                  onPress={() => handleDeleteCheckin(selectedCheckinMember.id)}
                >
                  <Trash2 size={18} color="#EF4444" />
                  <Text style={styles.dangerBtnText}>Undo Check-in</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 24 },
  restrictedCard: { backgroundColor: '#fff', margin: 24, padding: 32, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FF6596', borderStyle: 'dashed' },
  restrictedTitle: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8, color: '#1a1a1a' },
  restrictedText: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 20 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, height: 48, marginBottom: 24, borderWidth: 1, borderColor: '#f0f0f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  loadingSpinner: { position: 'absolute', right: 16 },
  headerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 13, color: '#666', fontWeight: '500' },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  listContainer: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  avatar: { width: 48, height: 48, borderRadius: 14, marginRight: 16 },
  cardContent: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: '#E8F0FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleBadgeNew: { backgroundColor: '#FFE8F0' },
  roleText: { fontSize: 10, fontWeight: '700', color: '#4D8BFF', textTransform: 'uppercase' },
  roleTextNew: { color: '#FF6596' },
  timeBadge: { backgroundColor: '#f5f5f5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  timeText: { fontSize: 12, fontWeight: '700', color: '#666' },
  emptyContainer: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#e1e4e8', borderStyle: 'dashed' },
  emptyIconWrapper: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F8F9FB', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#888', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  dragHandle: { width: 40, height: 5, backgroundColor: '#e1e4e8', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  closeBtn: { padding: 4 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, marginBottom: 16 },
  toastWarn: { backgroundColor: '#FFF9E6', borderColor: 'rgba(245,158,11,0.3)', borderWidth: 1 },
  toastSuccess: { backgroundColor: '#DEF7EC', borderColor: 'rgba(49,196,141,0.3)', borderWidth: 1 },
  toastText: { fontSize: 13, fontWeight: '700', flex: 1 },
  modalScroll: { marginTop: 8 },
  modalListItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalListItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalAvatar: { width: 40, height: 40, borderRadius: 12 },
  modalMemberName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  modalMemberRole: { fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF0F5', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#FF6596' },
  detailsAvatar: { width: 80, height: 80, borderRadius: 24, marginBottom: 16 },
  detailsName: { fontSize: 22, fontWeight: '900', color: '#1a1a1a', letterSpacing: -0.5, marginBottom: 8 },
  timeInfoCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8f9fb', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e1e4e8', marginBottom: 32 },
  timeInfoText: { fontSize: 14, fontWeight: '600', color: '#666' },
  timeInfoValue: { fontSize: 14, fontWeight: '800', color: '#1a1a1a' },
  secondaryBtn: { width: '100%', padding: 16, borderRadius: 16, backgroundColor: '#f5f5f5', alignItems: 'center' },
  secondaryBtnText: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  dangerBtn: { width: '100%', padding: 16, borderRadius: 16, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dangerBtnText: { fontSize: 15, fontWeight: '800', color: '#EF4444' },
});
