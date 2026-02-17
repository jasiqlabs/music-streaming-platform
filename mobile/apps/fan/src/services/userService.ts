export type AudioQualityPref = 'HIGH' | 'DATA SAVER';

export type UserProfile = {
  name: string;
  isPremium: boolean;
  subscriptionCount: number;
  profileImageUrl?: string;
  pushNotifications: boolean;
  audioQuality: AudioQualityPref;
};

export type Transaction = {
  id: string;
  amount: number;
  artistName: string;
  date: string;
  status?: string;
};

export type ListenTime = {
  totalMinutes: number;
  formattedTime: string;
};

export type UpdateProfileInput = {
  name?: string;
  profileImageUrl?: string;
  password?: string;
};

export type UpdateSettingsInput = {
  pushNotifications?: boolean;
  audioQuality?: AudioQualityPref;
};

export interface UserService {
  getUserProfile(): Promise<Pick<UserProfile, 'name' | 'isPremium' | 'subscriptionCount'>>;
  getTransactions(): Promise<Transaction[]>;
  getListenTime(): Promise<ListenTime>;
  updateProfile(input: UpdateProfileInput): Promise<UserProfile>;
  updateSettings(input: UpdateSettingsInput): Promise<UserProfile>;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

let mockState: {
  profile: UserProfile;
  transactions: Transaction[];
  listenTime: ListenTime;
} = {
  profile: {
    name: 'User',
    isPremium: true,
    subscriptionCount: 3,
    pushNotifications: true,
    audioQuality: 'HIGH',
    profileImageUrl: '',
  },
  transactions: [
    {
      id: 'tx_123',
      amount: 4.99,
      artistName: 'Luna Ray',
      date: '2026-02-17',
      status: 'SUCCESS',
    },
  ],
  listenTime: {
    totalMinutes: 1240,
    formattedTime: '20.6 Hours',
  },
};

export const userService: UserService = {
  async getUserProfile() {
    await delay(500);
    const { name, isPremium, subscriptionCount } = mockState.profile;
    return { name, isPremium, subscriptionCount };
  },

  async getTransactions() {
    await delay(500);
    return [...mockState.transactions];
  },

  async getListenTime() {
    await delay(500);
    return { ...mockState.listenTime };
  },

  async updateProfile(input: UpdateProfileInput) {
    await delay(500);

    mockState = {
      ...mockState,
      profile: {
        ...mockState.profile,
        name: input.name ?? mockState.profile.name,
        profileImageUrl: input.profileImageUrl ?? mockState.profile.profileImageUrl,
      },
    };

    return { ...mockState.profile };
  },

  async updateSettings(input: UpdateSettingsInput) {
    await delay(500);

    mockState = {
      ...mockState,
      profile: {
        ...mockState.profile,
        pushNotifications: input.pushNotifications ?? mockState.profile.pushNotifications,
        audioQuality: input.audioQuality ?? mockState.profile.audioQuality,
      },
    };

    return { ...mockState.profile };
  },
};
