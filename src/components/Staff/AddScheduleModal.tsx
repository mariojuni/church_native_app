import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Calendar as CalendarIcon, Clock, Users, ChevronDown } from 'lucide-react-native';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
}

export default function AddScheduleModal({ isOpen, onClose }: AddScheduleModalProps) {
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

  const renderPicker = (
    show: boolean,
    value: Date,
    mode: 'date' | 'time',
    onValueChange: (e: any, selected?: Date) => void,
    onClose: () => void
  ) => {
    if (!show) return null;
    return (
      <View style={{ backgroundColor: '#fff', borderRadius: 12, marginTop: 8, padding: 8, borderWidth: 1, borderColor: '#f0f0f0' }}>
        {Platform.OS === 'ios' && (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Text style={{ color: '#FF6596', fontWeight: 'bold', fontSize: 16 }}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
        <DateTimePicker
          value={value}
          mode={mode}
          display={Platform.OS === 'ios' ? (mode === 'date' ? 'inline' : 'spinner') : 'default'}
          onChange={(e, date) => {
            if (Platform.OS === 'android') onClose();
            if (date) onValueChange(e, date);
          }}
          style={Platform.OS === 'ios' ? { width: '100%', height: mode === 'date' ? 320 : 200 } : {}}
        />
      </View>
    );
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
      await addDoc(collection(db, 'schedules'), {
        event,
        date: formatDateForDB(date),
        time: formatTime(startTime),
        endTime: formatTime(endTime),
        location,
        duties,
        createdAt: serverTimestamp()
      });
      onClose();
      // Reset form
      setEvent('Sunday Worship Service');
      setDate(new Date());
      setStartTime(new Date(new Date().setHours(9, 0, 0, 0)));
      setEndTime(new Date(new Date().setHours(11, 0, 0, 0)));
      setLocation('Main Sanctuary');
      setAssignments({});
    } catch (e) {
      console.error('Error adding schedule:', e);
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
          <Text style={styles.title}>New Schedule</Text>
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

            {renderPicker(
              showDatePicker, 
              date, 
              'date', 
              (e, selectedDate) => { if (selectedDate) setDate(selectedDate); },
              () => setShowDatePicker(false)
            )}
            
            {renderPicker(
              showStartTimePicker, 
              startTime, 
              'time', 
              (e, selectedTime) => { if (selectedTime) setStartTime(selectedTime); },
              () => setShowStartTimePicker(false)
            )}

            {renderPicker(
              showEndTimePicker, 
              endTime, 
              'time', 
              (e, selectedTime) => { if (selectedTime) setEndTime(selectedTime); },
              () => setShowEndTimePicker(false)
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Main Sanctuary" placeholderTextColor="#999" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ministerial Duties</Text>
            
            {ROLES.map(role => {
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
                <Text style={[styles.memberName, { color: '#EF4444' }]}>Unassign / Clear Role</Text>
                <Text style={styles.memberRole}>Remove assigned member</Text>
              </TouchableOpacity>
              {members.map(m => (
                <TouchableOpacity key={m.id} style={styles.memberItem} onPress={() => assignMember(m.id)}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberRole}>{m.role || 'Member'}</Text>
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
  memberItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  memberName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  memberRole: { fontSize: 13, color: '#666' }
});
