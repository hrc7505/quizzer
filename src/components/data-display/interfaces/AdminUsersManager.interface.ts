/**
 * User data structure returned by the API.
 */
export interface UserData {
  /** The unique identifier of the user */
  id: string;
  /** The display name of the user */
  name: string | null;
  /** The email address of the user */
  email: string | null;
  /** The profile avatar image URL */
  image: string | null;
  /** The phone number used for OTP logins */
  phoneNumber: string | null;
  /** The role of the user (e.g. USER, ADMIN) */
  role: string;
  /** Related count statistics from database relationships */
  _count: {
    /** Total number of quiz attempts by this user */
    attempts: number;
  };
}

/**
 * Props for the AdminUsersManager component.
 */
export interface AdminUsersManagerProps {
  /** Initial array of users to render in the list */
  initialUsers: UserData[];
}
