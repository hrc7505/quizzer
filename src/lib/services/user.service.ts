import { api } from "@/lib/api";

import type { UserProfileResponse } from "@/features/profile/interfaces/Profile.interface";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
  createdAt: string;
  _count?: { attempts: number };
}

export const UserService = {
  getAllUsers: async (): Promise<AdminUser[]> => {
    const res = await api.get<AdminUser[]>("/api/admin/users");
    if (res.success && res.data) return res.data;
    return [];
  },

  deleteUser: async (userId: string): Promise<{ success: boolean }> => {
    const res = await api.delete<{ success: boolean }>(`/api/admin/users/${userId}`);
    if (res.success && res.data) return res.data;
    return { success: false };
  },

  getProfile: async (): Promise<UserProfileResponse | null> => {
    const res = await api.get<UserProfileResponse>("/api/user/profile");
    if (res.success && res.data) return res.data;
    return null;
  },

  updateName: async (name: string): Promise<boolean> => {
    const res = await api.patch("/api/user/profile", { name });
    return res.success;
  },

  clearAttempts: async (): Promise<boolean> => {
    const res = await api.post("/api/user/attempts/clear");
    return res.success;
  },
};