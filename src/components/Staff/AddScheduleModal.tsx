import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { X, Calendar as CalendarIcon, Clock, Users, ChevronDown, ChevronRight, User } from 'lucide-react-native';
import CustomDatePicker from '../CustomDatePicker';
import CustomTimePicker from '../CustomTimePicker';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useMemberStore } from '../../store/useMemberStore';

const ROLES = [
  { id: 'presider', label: 'Presider' },
  { id: 'openingPrayer', label: 'Opening Prayer' },
  { id: 'usher1', label: 'Usher 1' },
  { id: 'usher2', label: 'Usher 2' },
  { id: 'tithesOffering', label: 'Tithes & Offering Prayer' },
  { id: 'preacher', label: 'Preacher' },
  { id: 'scriptureReading', label: 'Scripture Reading' },
  { id: 'audioVisual', label: 'Audio/Visual Tech' },
  { id: 'praiseWorship', label: 'Praise & Worship Leader' }
];

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: any;
}

export default function AddScheduleModal({ isOpen, onClose, eventToEdit }: AddScheduleModalProps) {
  const { members } = useMemberStore();
  const [event, setEvent] = useState('Sunday Worship Service');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(11, 0, 0, 0)));
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [location, setLocation] = useState('Main Sanctuary');
  
  // Store assigned member IDs by role ID
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [selectingRole, setSelectingRole] = useState<string | null>(null);
  
  const [showDuties, setShowDuties] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setEvent(eventToEdit.event || '');
        setLocation(eventToEdit.location || '');
        if (eventToEdit.date) {
          const [y, m, d] = eventToEdit.date.split('-');
          setDate(new Date(Number(y), Number(m) - 1, Number(d)));
        }
        
        const parseTime = (timeStr: string) => {
          if (!timeStr) return new Date();
          const [t, ampm] = timeStr.split(' ');
          const [hStr, mStr] = t.split(':');
          let h = parseInt(hStr, 10);
          if (ampm === 'PM' && h !== 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          const d = new Date();
          d.setHours(h, parseInt(mStr || '0', 10), 0, 0);
          return d;
        };

        if (eventToEdit.time) setStartTime(parseTime(eventToEdit.time));
        if (eventToEdit.endTime) setEndTime(parseTime(eventToEdit.endTime));

        // parse duties
        if (eventToEdit && eventToEdit.duties) {
          const initialAssignments: Record<string, string> = {};
          eventToEdit.duties.forEach((duty: any) => {
            if (
              duty.role.toLowerCase() !== 'attendee' && 
              duty.status !== 'declined' && 
              duty.status !== 'declined_dismissed'
            ) {
              const roleDef = ROLES.find(r => r.label === duty.role);
              if (roleDef) initialAssignments[roleDef.id] = duty.userId;
            }
          });
          setAssignments(initialAssignments);
        } else {
          setAssignments({});
        }
        setShowDuties(true); // Default open if editing
      } else {
        // Reset
        setEvent('Sunday Worship Service');
        setDate(new Date());
        setStartTime(new Date(new Date().setHours(9, 0, 0, 0)));
        setEndTime(new Date(new Date().setHours(11, 0, 0, 0)));
        setLocation('Main Sanctuary');
        setAssignments({});
        setShowDuties(false);
      }
    }
  }, [isOpen, eventToEdit]);

  const formatDateForUI = (d: Date) => {
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  const formatDateForDB = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatTime = (d: Date) => {
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  };



  const handleSave = async () => {
    if (!event) {
      Alert.alert('Missing Info', 'Please provide event title.');
      return;
    }

    // Format duties array
    const duties = Object.keys(assignments).map(roleId => {
      const roleDef = ROLES.find(r => r.id === roleId);
      return {
        role: roleDef?.label || roleId,
        userId: assignments[roleId],
        status: 'pending'
      };
    }).filter(d => d.userId); // Only include filled roles

    try {
      if (eventToEdit) {
        await updateDoc(doc(db, 'schedules', eventToEdit.id), {
          event,
          date: formatDateForDB(date),
          time: formatTime(startTime),
          endTime: formatTime(endTime),
          location,
          duties
        });
      } else {
        await addDoc(collection(db, 'schedules'), {
          event,
          date: formatDateForDB(date),
          time: formatTime(startTime),
          endTime: formatTime(endTime),
          location,
          duties,
          createdAt: serverTimestamp()
        });
      }
      onClose();
    } catch (e) {
      console.error('Error saving schedule:', e);
      Alert.alert('Error', 'Could not save the schedule.');
    }
  };

  const assignMember = (userId: string | null) => {
    if (selectingRole) {
      if (userId === null) {
        const newAssignments = { ...assignments };
        delete newAssignments[selectingRole];
        setAssignments(newAssignments);
      } else {
        setAssignments(prev => ({ ...prev, [selectingRole]: userId }));
      }
      setSelectingRole(null);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{eventToEdit ? 'Update Event' : 'New Schedule'}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Title</Text>
              <TextInput style={styles.input} value={event} onChangeText={setEvent} placeholder="e.g. Sunday Worship Service" placeholderTextColor="#999" />
            </View>

            <View style={styles.row}>
              <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.label}>Date</Text>
                <View style={styles.inputIconWrapper}>
                  <CalendarIcon size={16} color="#666" style={styles.inputIcon} />
                  <Text style={styles.inputWithIcon}>{formatDateForUI(date)}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <TouchableOpacity style={[styles.inputGroup, { flex: 1, marginRight: 12 }]} onPress={() => setShowStartTimePicker(true)}>
                <Text style={styles.label}>Start Time</Text>
                <View style={styles.inputIconWrapper}>
                  <Clock size={16} color="#666" style={styles.inputIcon} />
                  <Text style={styles.inputWithIcon}>{formatTime(startTime)}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setShowEndTimePicker(true)}>
                <Text style={styles.label}>End Time</Text>
                <View style={styles.inputIconWrapper}>
                  <Clock size={16} color="#666" style={styles.inputIcon} />
                  <Text style={styles.inputWithIcon}>{formatTime(endTime)}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <CustomDatePicker
              visible={showDatePicker}
              date={date}
              onConfirm={(selectedDate) => {
                setDate(selectedDate);
                setShowDatePicker(false);
              }}
              onCancel={() => setShowDatePicker(false)}
            />
            
            <CustomTimePicker
              visible={showStartTimePicker}
              time={startTime}
              onConfirm={(selectedTime) => {
                setStartTime(selectedTime);
                setShowStartTimePicker(false);
              }}
              onCancel={() => setShowStartTimePicker(false)}
            />

            <CustomTimePicker
              visible={showEndTimePicker}
              time={endTime}
              onConfirm={(selectedTime) => {
                setEndTime(selectedTime);
                setShowEndTimePicker(false);
              }}
              onCancel={() => setShowEndTimePicker(false)}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Main Sanctuary" placeholderTextColor="#999" />
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.collapsibleHeader} 
              onPress={() => setShowDuties(!showDuties)}
            >
              <Text style={styles.sectionTitle}>Ministerial Duties</Text>
              {showDuties ? <ChevronDown size={20} color="#666" /> : <ChevronRight size={20} color="#666" />}
            </TouchableOpacity>
            
            {showDuties && ROLES.map(role => {
              const assignedUserId = assignments[role.id];
              const assignedMember = assignedUserId ? members.find(m => m.id === assignedUserId) : null;

              return (
                <View key={role.id} style={styles.roleRow}>
                  <Text style={styles.roleLabel}>{role.label}</Text>
                  <TouchableOpacity 
                    style={styles.assignBtn} 
                    onPress={() => setSelectingRole(role.id)}
                  >
                    {assignedMember ? (
                      <Text style={styles.assignedName}>{assignedMember.name}</Text>
                    ) : (
                      <>
                        <Users size={14} color="#666" />
                        <Text style={styles.assignBtnText}>Assign</Text>
                      </>
                    )}
                    <ChevronDown size={14} color="#ccc" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Member Selection Overlay */}
      {selectingRole && (
        <View style={styles.selectionOverlay}>
          <View style={styles.selectionSheet}>
            <View style={styles.selectionHeader}>
              <Text style={styles.selectionTitle}>Select Member</Text>
              <TouchableOpacity onPress={() => setSelectingRole(null)}>
                <X size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectionList}>
              <TouchableOpacity style={styles.memberItem} onPress={() => assignMember(null)}>
                <View style={styles.memberItemLeft}>
                  <View style={[styles.modalAvatar, { backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }]}>
                    <X size={20} color="#EF4444" />
                  </View>
                  <View>
                    <Text style={[styles.memberName, { color: '#EF4444' }]}>Unassign / Clear Role</Text>
                    <Text style={styles.memberRole}>Remove assigned member</Text>
                  </View>
                </View>
              </TouchableOpacity>
              {members.map(m => (
                <TouchableOpacity key={m.id} style={styles.memberItem} onPress={() => assignMember(m.id)}>
                  <View style={styles.memberItemLeft}>
                    {m.avatar ? (
                      <Image source={{ uri: m.avatar }} style={styles.modalAvatar} />
                    ) : (
                      <View style={[styles.modalAvatar, { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
                        <User size={20} color="#999" />
                      </View>
                    )}
                    <View>
                      <Text style={styles.memberName}>{m.name}</Text>
                      <Text style={styles.memberRole}>{m.role || 'Member'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff'
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  closeBtn: { padding: 8 },
  cancelText: { fontSize: 16, color: '#666' },
  saveBtn: { backgroundColor: '#FF6596', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  content: { flex: 1, backgroundColor: '#FAFAFA' },
  section: { backgroundColor: '#fff', padding: 24, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#f8f9fb', borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 15, color: '#1a1a1a' },
  row: { flexDirection: 'row' },
  inputIconWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fb', borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 12, paddingHorizontal: 16, height: 48 },
  inputIcon: { marginRight: 8 },
  inputWithIcon: { flex: 1, fontSize: 15, color: '#1a1a1a' },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  roleLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  assignBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#f0f0f0' },
  assignBtnText: { fontSize: 13, fontWeight: '600', color: '#666', marginLeft: 6 },
  assignedName: { fontSize: 13, fontWeight: '700', color: '#4D8BFF' },
  selectionOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  selectionSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  selectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  selectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  selectionList: { padding: 24 },
  memberItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  memberItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalAvatar: { width: 40, height: 40, borderRadius: 12 },
  memberName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  memberRole: { fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: '600' },
  collapsibleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
});
