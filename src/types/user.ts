export interface UserProfile {
  uid: string;
  email: string;
  display_name: string;
  profile_picture_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  settings: {
    show_name_publicly: boolean;
    theme: 'light' | 'dark';
  };
}
