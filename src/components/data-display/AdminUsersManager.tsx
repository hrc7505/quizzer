"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Trash2, Search, AlertTriangle, Loader2, Download } from "lucide-react";

import { downloadCSV } from "@/lib/csv-export";
import { AdminUsersManagerProps, UserData } from "@/components/data-display/interfaces/AdminUsersManager.interface";
import { UserService } from "@/lib/services/user.service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useDialog } from "@/components/providers/OverlayProvider";
import { useToast } from "@/components/providers/ToastProvider";

export function AdminUsersManager({ initialUsers }: AdminUsersManagerProps) {
  const { data: session } = useSession();
  const toast = useToast();

  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const dialog = useDialog();

  const currentUserId = (session?.user as { id?: string | null } | null)?.id;

  const filteredUsers = users.filter((user) => {
    const term = searchQuery.toLowerCase();
    return (
      (user.name?.toLowerCase().includes(term) ?? false) ||
      (user.email?.toLowerCase().includes(term) ?? false)
    );
  });

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Role", "Quiz Attempts"];
    const rows = filteredUsers.map(u => [
      u.name || "Anonymous",
      u.email || "N/A",
      ("phoneNumber" in u && typeof (u as { phoneNumber?: string }).phoneNumber === "string")
        ? (u as { phoneNumber?: string }).phoneNumber || "N/A"
        : "N/A",
      u.role,
      String(u._count.attempts),
    ]);
    downloadCSV("users.csv", headers, rows);
    toast.addToast({ type: "success", message: `Exported ${filteredUsers.length} users` });
  };

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

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setLoading(true);
    setError(null);

    try {
      await UserService.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      toast.addToast({
        type: "success",
        title: "User deleted",
        message: `${userToDelete.name || userToDelete.email} has been removed.`,
      });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
        <div className="flex items-center gap-3">
          {users.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 font-semibold text-xs h-9">
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          )}
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
            <span>Updating user records...</span>
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
                <tr className="border-b border-border/40 text-muted-foreground font-bold bg-secondary/10 sticky top-0 z-10">
                  <th scope="col" className="py-3.5 px-4 font-bold">User Details</th>
                  <th scope="col" className="py-3.5 px-4 font-bold">Email</th>
                  <th scope="col" className="py-3.5 px-4 font-bold">Phone Number</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center">Role</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center">Quiz Attempts</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const phoneNumber = ("phoneNumber" in user && typeof (user as { phoneNumber?: string }).phoneNumber === "string")
                    ? (user as { phoneNumber?: string }).phoneNumber
                    : "N/A";

                  return (
                    <tr key={user.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {user.image ? (
                            <Image src={user.image} alt={user.name || "User"} width={28} height={28} className="h-7 w-7 rounded-full object-cover border border-border/40 shrink-0" unoptimized />
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
                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="capitalize font-bold text-[10px] px-2 py-0.5 animate-none">
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

      {filteredUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/40 gap-4 bg-secondary/5 text-xs select-none">
          <div className="flex items-center gap-2 text-muted-foreground/80 font-medium">
            <span>Show</span>
            <Select
              value={pageSize.toString()}
              onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }}
              className="h-8 w-16"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </Select>
            <span>entries</span>
          </div>

          <span className="text-muted-foreground/80 font-medium">
            Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="h-8 font-semibold text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="h-8 font-semibold text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminUsersManager;
