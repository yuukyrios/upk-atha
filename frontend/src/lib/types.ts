export interface User {
  userId: number;
  user_id?: number;
  nickname: string;
  email?: string;
  userType: string;
  user_type?: string;
  profilePicture?: string;
  profile_picture_url?: string;
  created_at?: string;
  last_login?: string;
  comment_count?: number;
  is_active?: boolean;
}

export interface Series {
  series_id: number;
  series_name: string;
  description: string;
  release_year: number;
  cover_image_url: string | null;
  created_at: string;
  created_by_name: string;
  mech_count: number;
}

export interface MechSummary {
  mech_id: number;
  mech_name: string;
  model_number: string;
  classification: string;
  height: number;
  image_url: string | null;
  series_name?: string;
  series_id?: number;
}

export interface MechDetail extends MechSummary {
  weight: number;
  armament: string;
  armor_material: string;
  power_source: string;
  max_speed: string;
  manufacturer: string;
  pilot: string;
  lore_description: string;
  design_features: string;
  created_by_name: string;
  created_at: string;
}

export interface Comment {
  comment_id: number;
  content: string;
  is_admin_comment: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  user_id: number;
  nickname: string;
  profile_picture_url: string | null;
  user_type: string;
  reply_count: number;
  userVote: "upvote" | "downvote" | null;
}

export interface Reply {
  reply_id: number;
  content: string;
  is_admin_reply: boolean;
  created_at: string;
  user_id: number;
  nickname: string;
  profile_picture_url: string | null;
  user_type: string;
}

export interface AdminStats {
  users: { total_users: number; admin_count: number; new_users_today: number };
  content: { total_series: number; total_mechs: number; total_comments: number };
  activity: { comments_today: number; mechs_added_today: number };
}

export interface DeletedComment {
  comment_id: number;
  content: string;
  deleted_reason: string;
  deleted_at: string;
  author: string;
  deleted_by_name: string;
}
