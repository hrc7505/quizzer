/**
 * Service to handle user-related API requests for admin panel.
 */
import { Prisma } from "@prisma/client";

export type AdminUser = Prisma.UserGetPayload<{
  include: {
    _count: {
      select: {
        attempts: true;
      };
    };
  };
}>;

export const UserService = {
  /**
   * Fetches all users from the admin API.
   * 
   * @returns A promise resolving to a list of users.
   */
  getAllUsers: async (): Promise<AdminUser[]> => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch users");
    }
    return data;
  },

  /**
   * Deletes a user by their ID.
   * 
   * @param userId - The ID of the user to delete.
   * @returns A promise resolving to a success confirmation.
   */
  deleteUser: async (userId: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to delete user");
    }
    return data;
  },
};
