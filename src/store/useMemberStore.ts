import { create } from 'zustand';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface MemberStore {
  members: any[];
  services: any[];
  membersLoading: boolean;
  servicesLoading: boolean;
  initializeMembersListener: () => void;
  initializeServicesListener: () => void;
}

export const useMemberStore = create<MemberStore>((set) => ({
  members: [],
  services: [],
  membersLoading: true,
  servicesLoading: true,
  
  initializeMembersListener: () => {
    const q = query(collection(db, 'users'), orderBy('name', 'asc'));
    onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        set({ members: docs, membersLoading: false });
      } else {
        set({ members: [], membersLoading: false });
      }
    }, (error) => {
      console.error("Error fetching users: ", error);
      set({ membersLoading: false });
    });
  },

  initializeServicesListener: () => {
    const q = query(collection(db, 'services'), orderBy('date', 'asc'));
    onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        set({ services: docs, servicesLoading: false });
      } else {
        set({ services: [], servicesLoading: false });
      }
    }, (error) => {
      console.error("Error fetching services: ", error);
      set({ servicesLoading: false });
    });
  }
}));
