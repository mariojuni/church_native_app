import { create } from 'zustand';
import { memberRepository } from '../features/member/data/member.repository';
import type { Member, Service } from '../features/member/domain/member.types';

interface MemberStore {
  members: Member[];
  services: Service[];
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
    memberRepository.subscribeToMembers(
      (members) => {
        set({ members, membersLoading: false });
      },
      (error) => {
        console.error('Error fetching users:', error);
        set({ membersLoading: false });
      }
    );
  },

  initializeServicesListener: () => {
    memberRepository.subscribeToServices(
      (services) => {
        set({ services, servicesLoading: false });
      },
      (error) => {
        console.error('Error fetching services:', error);
        set({ servicesLoading: false });
      }
    );
  }
}));
