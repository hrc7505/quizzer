"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Text, Button, Badge, Input, Card, Spinner, Avatar,
  Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions,
  DataGrid, DataGridHeader, DataGridRow, DataGridHeaderCell,
  DataGridBody, DataGridCell, TableCellLayout, TableColumnDefinition,
  createTableColumn,
} from "@fluentui/react-components";
import { Delete20Regular, Search24Regular, Warning48Regular } from "@fluentui/react-icons";
import { AdminUsersManagerProps, UserData } from "./interfaces/AdminUsersManager.interface";
import { useAdminUsersManagerStyles } from "./styles/useAdminUsersManagerStyles";
import { UserService } from "@/lib/services/user.service";

/**
 * AdminUsersManager Component. Provides the user interface for listing and deleting users.
 * Accessible to admins only. Uses Fluent UI DataGrid for proper column alignment.
 *
 * @param props - The properties for the component containing the initial list of users.
 */
export function AdminUsersManager({ initialUsers }: AdminUsersManagerProps) {
  const styles = useAdminUsersManagerStyles();
  const { data: session } = useSession();

  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Delete Confirmation Dialog State */
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  const currentUserId = (session?.user as any)?.id;

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
    setDeleteConfirmOpen(true);
  };

  /** Confirms and executes the user deletion via UserService */
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setLoading(true);
    setError(null);
    setDeleteConfirmOpen(false);

    try {
      await UserService.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    } finally {
      setLoading(false);
      setUserToDelete(null);
    }
  };

  /** DataGrid column definitions using Fluent UI createTableColumn */
  const columns: TableColumnDefinition<UserData>[] = [
    createTableColumn<UserData>({
      columnId: "user",
      renderHeaderCell: () => "User Details",
      renderCell: (user) => (
        <TableCellLayout
          media={
            <Avatar
              name={user.name || user.email || "Anonymous"}
              image={{ src: user.image || undefined }}
              size={28}
            />
          }
        >
          <Text weight="semibold">{user.name || "Anonymous User"}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<UserData>({
      columnId: "email",
      renderHeaderCell: () => "Email",
      renderCell: (user) => (
        <TableCellLayout>
          <Text>{user.email || "N/A"}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<UserData>({
      columnId: "phone",
      renderHeaderCell: () => "Phone Number",
      renderCell: (user) => (
        <TableCellLayout>
          <Text>{(user as any).phoneNumber || "N/A"}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<UserData>({
      columnId: "role",
      renderHeaderCell: () => "Role",
      renderCell: (user) => (
        <TableCellLayout>
          <Badge
            appearance="filled"
            color={user.role === "ADMIN" ? "brand" : "subtle"}
            className={styles.roleBadge}
          >
            {user.role}
          </Badge>
        </TableCellLayout>
      ),
    }),
    createTableColumn<UserData>({
      columnId: "attempts",
      renderHeaderCell: () => "Quiz Attempts",
      renderCell: (user) => (
        <TableCellLayout>
          <Text>{user._count.attempts}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<UserData>({
      columnId: "actions",
      renderHeaderCell: () => "Actions",
      renderCell: (user) => {
        const isSelf = user.id === currentUserId;
        return (
          <TableCellLayout>
            <Button
              icon={loading ? <Spinner size="tiny" /> : <Delete20Regular />}
              appearance="subtle"
              disabled={isSelf || loading}
              onClick={() => handleDeleteClick(user)}
              aria-label={`Delete ${user.name || "user"}`}
            />
          </TableCellLayout>
        );
      },
    }),
  ];

  /** Column width sizing options for DataGrid */
  const columnSizingOptions = {
    user:     { minWidth: 180, defaultWidth: 220 },
    email:    { minWidth: 160, defaultWidth: 210 },
    phone:    { minWidth: 120, defaultWidth: 150 },
    role:     { minWidth:  80, defaultWidth: 110 },
    attempts: { minWidth:  80, defaultWidth: 130 },
    actions:  { minWidth:  60, defaultWidth:  80 },
  };

  return (
    <div className={styles.container}>
      {/* Controls Row: Title + Search */}
      <div className={styles.controlsRow}>
        <Text size={700} weight="bold">User Management</Text>
        <Input
          contentBefore={<Search24Regular />}
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchBar}
          aria-label="Search users"
        />
      </div>

      {error && <Text className={styles.errorText}>{error}</Text>}

      <Card className={styles.tableCard}>
        {loading ? (
          <div className={styles.spinnerContainer}>
            <Spinner label="Updating..." />
          </div>
        ) : (
          <DataGrid
            items={filteredUsers}
            columns={columns}
            getRowId={(user) => user.id}
            resizableColumns
            columnSizingOptions={columnSizingOptions}
            focusMode="composite"
            aria-label="Users list"
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<UserData>>
              {({ item, rowId }) => (
                <DataGridRow<UserData> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        )}

        {!loading && filteredUsers.length === 0 && (
          <Text className={styles.emptyRowCell} italic>
            No users found matching search criteria.
          </Text>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={(_, data) => setDeleteConfirmOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete User</DialogTitle>
            <DialogContent>
              <div className={styles.dialogBodyRow}>
                <Warning48Regular className={styles.warningIcon} />
                <Text>
                  Are you sure you want to delete{" "}
                  <strong>{userToDelete?.name || userToDelete?.email}</strong>?{" "}
                  This will permanently erase their profile, all their quiz attempts, and answers. This action cannot be undone.
                </Text>
              </div>
            </DialogContent>
            <DialogActions className={styles.dialogActionsRow}>
              <Button appearance="secondary" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
              <Button appearance="primary" onClick={handleConfirmDelete} className={styles.btnConfirmDelete}>
                Delete User
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
