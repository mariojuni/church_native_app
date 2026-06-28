
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#e0e0e0',
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderLeftAligned: {
    justifyContent: 'flex-start',
    paddingBottom: 16,
  },
  headerLeftContainer: {
    minWidth: 60,
    alignItems: 'flex-start'
  },
  headerRightContainer: {
    minWidth: 60,
    alignItems: 'flex-end'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center'
  },
  modalTitleLeft: {
    textAlign: 'left',
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  content: { flexShrink: 1, backgroundColor: '#fff' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 40 },
  discoverListContainer: {
    paddingBottom: 24,
  },
  discoverListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  myVersionsListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  myVersionsAbbrBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  discoverAbbrBox: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  abbrBoxActive: {
    backgroundColor: 'rgba(255, 101, 150, 0.1)',
  },
  discoverAbbrText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  textActive: { color: '#FF6596' },
  versionInfo: { flex: 1 },
  publisherText: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  versionName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#1a1a1a',
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1a1a1a' },
});
