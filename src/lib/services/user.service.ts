import { api } from "@/lib/api";

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
};