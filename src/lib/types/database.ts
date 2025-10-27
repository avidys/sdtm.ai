export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          organization: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          display_name?: string | null;
          organization?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          organization?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      runs: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          standard_id: string;
          summary: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          standard_id: string;
          summary: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          standard_id?: string;
          summary?: Json;
        };
      };
    };
  };
}
