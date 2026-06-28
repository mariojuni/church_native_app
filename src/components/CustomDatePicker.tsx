import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CustomDatePickerProps {
  visible: boolean;
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

export default function CustomDatePicker({ visible, date, onConfirm, onCancel }: CustomDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(date.getFullYear(), date.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(date);

  // Sync state if modal opens with a new date
  useEffect(() => {
    if (visible) {
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      setSelectedDate(date);
    }
  }, [visible, date]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const changeMonth = (diff: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + diff, 1));
  };

  const selectDay = (day: number) => {
    setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  };

  const grid = [];
  // Fill empty spaces before the 1st
  for (let i = 0; i < firstDay; i++) {
    grid.push(null);
  }
  // Fill days
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push(i);
  }

  // Calculate rows
  const rows = [];
  for (let i = 0; i < grid.length; i += 7) {
    const row = grid.slice(i, i + 7);
    // Pad the last row with nulls to always have 7 columns for layout consistency
    while (row.length < 7) row.push(null);
    rows.push(row);
  }

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
              <ChevronLeft size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
              <ChevronRight size={24} color="#1a1a1a" />
            </TouchableOpacity>
          </View>

          {/* Days of Week */}
          <View style={styles.daysHeader}>
            {DAYS.map((d, i) => (
              <Text key={i} style={styles.dayLabel}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((day, colIndex) => {
                  if (!day) return <View key={colIndex} style={styles.cell} />;
                  const isSelected = 
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === currentMonth.getMonth() &&
                    selectedDate.getFullYear() === currentMonth.getFullYear();

                  return (
                    <TouchableOpacity 
                      key={colIndex} 
                      style={[styles.cell, isSelected && styles.selectedCell]}
                      onPress={() => selectDay(day)}
                    >
                      <Text style={[styles.cellText, isSelected && styles.selectedCellText]}>{day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onConfirm(selectedDate)} style={styles.confirmBtn}>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  navBtn: { padding: 8, backgroundColor: '#f8f9fb', borderRadius: 12 },
  monthText: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  daysHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#999' },
  grid: { marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cell: { flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 100 },
  selectedCell: { backgroundColor: '#FF6596' },
  cellText: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  selectedCellText: { color: '#fff' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#666' },
  confirmBtn: { backgroundColor: '#FF6596', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' }
});
