import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

interface CustomTimePickerProps {
  visible: boolean;
  time: Date;
  onConfirm: (time: Date) => void;
  onCancel: () => void;
}

export default function CustomTimePicker({ visible, time, onConfirm, onCancel }: CustomTimePickerProps) {
  const [selectedHour, setSelectedHour] = useState(time.getHours() % 12 || 12);
  // Round minute to nearest 5
  const roundedMin = Math.round(time.getMinutes() / 5) * 5;
  const [selectedMinute, setSelectedMinute] = useState(roundedMin === 60 ? 55 : roundedMin);
  const [isPM, setIsPM] = useState(time.getHours() >= 12);

  useEffect(() => {
    if (visible) {
      setSelectedHour(time.getHours() % 12 || 12);
      const m = Math.round(time.getMinutes() / 5) * 5;
      setSelectedMinute(m === 60 ? 55 : m);
      setIsPM(time.getHours() >= 12);
    }
  }, [visible, time]);

  const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const handleConfirm = () => {
    const newTime = new Date(time);
    let h = selectedHour;
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    newTime.setHours(h);
    newTime.setMinutes(selectedMinute);
    onConfirm(newTime);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Select Time</Text>
          
          {/* AM / PM Toggle */}
          <View style={styles.ampmContainer}>
            <TouchableOpacity 
              style={[styles.ampmBtn, !isPM && styles.ampmActive]} 
              onPress={() => setIsPM(false)}
            >
              <Text style={[styles.ampmText, !isPM && styles.ampmTextActive]}>AM</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.ampmBtn, isPM && styles.ampmActive]} 
              onPress={() => setIsPM(true)}
            >
              <Text style={[styles.ampmText, isPM && styles.ampmTextActive]}>PM</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            {/* Hours Column */}
            <View style={styles.column}>
              <Text style={styles.colTitle}>Hour</Text>
              <View style={styles.grid}>
                {HOURS.map(h => (
                  <TouchableOpacity 
                    key={h} 
                    style={[styles.cell, selectedHour === h && styles.selectedCell]}
                    onPress={() => setSelectedHour(h)}
                  >
                    <Text style={[styles.cellText, selectedHour === h && styles.selectedCellText]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Minutes Column */}
            <View style={styles.column}>
              <Text style={styles.colTitle}>Minute</Text>
              <View style={styles.grid}>
                {MINUTES.map(m => (
                  <TouchableOpacity 
                    key={m} 
                    style={[styles.cell, selectedMinute === m && styles.selectedCell]}
                    onPress={() => setSelectedMinute(m)}
                  >
                    <Text style={[styles.cellText, selectedMinute === m && styles.selectedCellText]}>
                      {String(m).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 20, textAlign: 'center' },
  ampmContainer: { flexDirection: 'row', backgroundColor: '#f8f9fb', borderRadius: 12, padding: 4, marginBottom: 24 },
  ampmBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  ampmActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  ampmText: { fontSize: 15, fontWeight: '600', color: '#666' },
  ampmTextActive: { color: '#1a1a1a', fontWeight: '700' },
  pickerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  column: { flex: 1 },
  colTitle: { textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#999', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  cell: { width: '30%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 100, marginBottom: 8 },
  selectedCell: { backgroundColor: '#FF6596' },
  cellText: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  selectedCellText: { color: '#fff' },
  divider: { width: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#666' },
  confirmBtn: { backgroundColor: '#FF6596', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' }
});
