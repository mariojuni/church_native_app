import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Check, Trash2, Plus, Settings, CloudDownload } from 'lucide-react-native';
import { removeVersion, fetchOrganization } from '../../utils/bibleApi';
import AppModal from '../ui/AppModal';

interface VersionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  savedVersions: any[];
  activeTranslation: string | number;
  refreshSavedVersions: () => void;
  onSelectVersion: (id: string | number) => void;
  onAddVersionClick: () => void;
}

export default function VersionManager({
  isOpen,
  onClose,
  savedVersions,
  activeTranslation,
  refreshSavedVersions,
  onSelectVersion,
  onAddVersionClick
}: VersionManagerProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [publishers, setPublishers] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPublishers = async () => {
      const newPublishers = { ...publishers };
      const missingOrgs = savedVersions
        .map(v => v.organization_id)
        .filter(id => id && !newPublishers[id]);
      
      const uniqueOrgs = [...new Set(missingOrgs)];

      await Promise.all(uniqueOrgs.map(async (orgId) => {
        const data = await fetchOrganization(orgId);
        newPublishers[orgId] = data ? data.name : 'Public Domain';
      }));
      setPublishers(newPublishers);
    };

    if (isOpen) {
      fetchPublishers();
    }
  }, [isOpen, savedVersions]);

  const handleRemove = async (id: string | number) => {
    Alert.alert(
      "Remove Version",
      "Are you sure you want to remove this downloaded version?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            await removeVersion(id);
            refreshSavedVersions();
            if (String(activeTranslation) === String(id) && savedVersions.length > 1) {
               const remaining = savedVersions.filter(v => String(v.id) !== String(id));
               onSelectVersion(remaining[0].id);
            }
          }
        }
      ]
    );
  };

  const headerRight = (
    <>
      <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)} style={styles.headerBtn}>
        <Settings size={20} color={isEditMode ? "#FF6596" : "#1a1a1a"} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onAddVersionClick} style={styles.headerBtn}>
        <Plus size={20} color="#1a1a1a" />
      </TouchableOpacity>
    </>
  );

  return (
    <AppModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="My Versions" 
      headerTitleAlign="left"
      headerRight={headerRight}
    >
      <ScrollView style={styles.content}>
        <View style={styles.listContainer}>
          {savedVersions.length === 0 ? (
            <Text style={styles.emptyText}>No versions saved yet. Click the + icon to discover translations.</Text>
          ) : (
            savedVersions.map((version) => {
              const isActive = String(version.id) === String(activeTranslation);
              const abbr = String(version.local_abbreviation || version.abbreviation || version.id || '').replace(/(\d{2,})$/, '\n$1');
              
              return (
                <TouchableOpacity
                  key={version.id}
                  style={[styles.card, isActive && styles.cardActive]}
                  onPress={() => !isEditMode && onSelectVersion(version.id)}
                  disabled={isEditMode}
                >
                  {isEditMode && (
                    <TouchableOpacity onPress={() => handleRemove(version.id)} style={styles.deleteIcon}>
                      <Trash2 size={14} color="#fff" />
                    </TouchableOpacity>
                  )}
                  
                  {!isEditMode && (
                    <View style={styles.abbrBox}>
                      <Text style={styles.abbrText}>{abbr}</Text>
                    </View>
                  )}

                  <View style={styles.versionInfo}>
                    <Text style={styles.publisherText}>
                      {publishers[version.organization_id] || (version.organization_id ? 'Loading...' : 'Public Domain')}
                    </Text>
                    <Text style={[styles.versionName, isActive && styles.textActive]}>
                      {version.title || version.local_title}
                    </Text>
                  </View>
                  
                  {!isEditMode && (
                    <CloudDownload size={20} color="#999" style={{ marginLeft: 16 }} />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  content: { flexShrink: 1, backgroundColor: '#f9f9f9' },
  listContainer: { padding: 16, gap: 12 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 40 },
  headerBtn: { padding: 8, marginLeft: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  cardActive: {
    borderColor: '#FF6596',
    borderWidth: 2,
  },
  abbrBox: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    padding: 4,
  },
  abbrText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  versionInfo: { flex: 1 },
  publisherText: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  versionName: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#1a1a1a',
    lineHeight: 18,
  },
  textActive: { color: '#FF6596' },
  deleteIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  }
});
