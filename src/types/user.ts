export interface UserProfile {
  uid: string;
  email: string;
  display_name: string;
  profile_picture_url: string | null;
  role: 'user' | 'admin' | 'owner';
  created_at: string;
  settings: {
    show_name_publicly: boolean;
    theme: 'light' | 'dark';
  };
  /** Whether this user has requested admin privileges (for approval flow) */
  admin_requested?: boolean;
}

/** Site-wide settings managed by the owner */
export interface AdminSettings {
  id: string;
  logo_url: string | null;
  site_name: string;
  updated_at: string | null;
  updated_by: string | null;
}
