import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      flowcharts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          nodes: any;
          connections: any;
          created_at: string;
          updated_at: string;
          is_public: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          description?: string | null;
          nodes?: any;
          connections?: any;
          created_at?: string;
          updated_at?: string;
          is_public?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          nodes?: any;
          connections?: any;
          created_at?: string;
          updated_at?: string;
          is_public?: boolean;
        };
      };
      flowchart_shares: {
        Row: {
          id: string;
          flowchart_id: string;
          shared_with_user_id: string;
          permission: 'view' | 'edit';
          created_at: string;
        };
        Insert: {
          id?: string;
          flowchart_id: string;
          shared_with_user_id: string;
          permission?: 'view' | 'edit';
          created_at?: string;
        };
        Update: {
          id?: string;
          flowchart_id?: string;
          shared_with_user_id?: string;
          permission?: 'view' | 'edit';
          created_at?: string;
        };
      };
    };
  };
};
