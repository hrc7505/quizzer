"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Trash2, Search, AlertTriangle, Loader2 } from "lucide-react";
import { AdminUsersManagerProps, UserData } from "./interfaces/AdminUsersManager.interface";
import { UserService } from "@/lib/services/user.service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { useDialog } from "@/components/providers/OverlayProvider";

/**
 * AdminUsersManager Component. Provides the user interface for listing and deleting users.
 * Accessible to admins only.
 */
export function AdminUsersManager({ initialUsers }: AdminUsersManagerProps) {
  const { data: session } = useSession();

  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Delete Confirmation Dialog State */
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const dialog = useDialog();

  const currentUserId = (session?.user as { id?: string | null } | null)?.id;

  /** Filter users based on search query */
  const filteredUsers = users.filter((user) => {
    const term = searchQuery.toLowerCase();
    return (
      (user.name?.toLowerCase().includes(term) ?? false) ||
      (user.email?.toLowerCase().includes(term) ?? false)
    );
  });

  const handleDeleteClick = (user: UserData) => {
    setUserToDelete(user);
    dialog.open({
      title: "Delete User",
      okText: "Delete User",
      okVariant: "danger",
      onOk: handleConfirmDelete,
      body: (
        <div className="flex gap-3.5 items-start mt-2">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <span className="text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to delete{" "}
            <strong className="text-foreground font-semibold">{user.name || user.email}</strong>?{" "}
            This will permanently erase their profile, all their quiz attempts, and answers. This action cannot be undone.
          </span>
        </div>
      ),
    });
  };

  /** Confirms and executes the user deletion via UserService */
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setLoading(true);
    setError(null);

    try {
      await UserService.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      setError(message || "Failed to delete user");
    } finally {
      setLoading(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Controls Row: Title + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 w-full"
            aria-label="Search users"
          />
        </div>
      </div>

        {error && (
          <Alert variant="danger" title="Error">
            {error}
          </Alert>
        )}

      <Card className="border-border/80 shadow-xs overflow-hidden p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-xs text-muted-foreground select-none">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Updating user records…</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center select-none">
            <p className="text-sm font-semibold text-foreground">No users found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground font-bold bg-secondary/10">
                  <th scope="col" className="py-3.5 px-4 font-bold">User Details</th>
                  <th scope="col" className="py-3.5 px-4 font-bold">Email</th>
                  <th scope="col" className="py-3.5 px-4 font-bold">Phone Number</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center">Role</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center">Quiz Attempts</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const phoneNumber = ("phoneNumber" in user && typeof (user as { phoneNumber?: string }).phoneNumber === "string")
                    ? (user as { phoneNumber?: string }).phoneNumber
                    : "N/A";

                  return (
                    <tr key={user.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.image} alt={user.name || "User"} className="h-7 w-7 rounded-full object-cover border border-border/40 shrink-0" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {(user.name || user.email || "U").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold text-foreground truncate">
                            {user.name || "Anonymous User"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground/80 font-medium">{user.email || "N/A"}</td>
                      <td className="py-3 px-4 text-foreground/85 font-medium">{phoneNumber}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="capitalize font-bold text-[9px] px-2 py-0.5">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-foreground/90">{user._count.attempts}</td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isSelf || loading}
                          onClick={() => handleDeleteClick(user)}
                          className="h-8 w-8 text-muted-foreground hover:bg-danger/10 hover:text-danger hover:border-danger/20 rounded-lg"
                          aria-label={`Delete ${user.name || "user"}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
export default AdminUsersManager;
