import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView, StyleProp, ViewStyle, TouchableWithoutFeedback } from 'react-native';
import { X } from 'lucide-react-native';

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  headerTitleAlign?: 'left' | 'center';
}

export default function AppModal({ isOpen, onClose, title, children, containerStyle, headerLeft, headerRight, headerTitleAlign = 'center' }: AppModalProps) {
  return (
    <Modal visible={isOpen} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.headerSide, { alignItems: 'flex-start' }]}>
              {headerLeft ? headerLeft : (headerTitleAlign === 'center' ? <View style={styles.iconBtnPlaceholder} /> : null)}
            </View>
            
            <View style={styles.headerCenter}>
              <Text style={[styles.title, { textAlign: headerTitleAlign }]}>{title}</Text>
            </View>
            
            <View style={[styles.headerSide, { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end', gap: 16 }]}>
              {headerRight}
              <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                <X size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <SafeAreaView style={[styles.contentContainer, containerStyle]}>
            {children}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#e1e4e8',
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  contentContainer: {
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
    backgroundColor: '#fff',
  },
  headerSide: {
    flex: 1,
  },
  headerCenter: {
    flex: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  iconBtnPlaceholder: {
    width: 40, 
  },
  iconBtn: {
    padding: 8,
    marginRight: -8, 
  },
});
