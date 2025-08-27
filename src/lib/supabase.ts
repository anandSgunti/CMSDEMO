import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          global_role: 'admin' | 'super_admin' | 'user' | null
          created_at: string | null
          updated_at: string | null
          last_login: string | null
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string | null
          global_role?: 'admin' | 'super_admin' | 'user' | null
          created_at?: string | null
          updated_at?: string | null
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          global_role?: 'admin' | 'super_admin' | 'user' | null
          created_at?: string | null
          updated_at?: string | null
          last_login?: string | null
        }
      }
      content: {
        Row: {
          id: string
          title: string
          body: string
          status: 'archived' | 'draft' | 'published' | 'review' | null
          project_id: string | null
          author_id: string | null
          created_at: string | null
          updated_at: string | null
          published_at: string | null
          tags: string[] | null
          file_url: string | null
          file_name: string | null
          file_size: number | null
          content_type: string | null
          template_id: string | null
          is_template: boolean | null
          template_data: any | null
        }
        Insert: {
          id?: string
          title: string
          body?: string
          status?: 'archived' | 'draft' | 'published' | 'review' | null
          project_id?: string | null
          author_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          published_at?: string | null
          tags?: string[] | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          content_type?: string | null
          template_id?: string | null
          is_template?: boolean | null
          template_data?: any | null
        }
        Update: {
          id?: string
          title?: string
          body?: string
          status?: 'archived' | 'draft' | 'published' | 'review' | null
          project_id?: string | null
          author_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          published_at?: string | null
          tags?: string[] | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          content_type?: string | null
          template_id?: string | null
          is_template?: boolean | null
          template_data?: any | null
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'active' | 'archived' | 'draft' | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: 'active' | 'archived' | 'draft' | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: 'active' | 'archived' | 'draft' | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string | null
          user_id: string | null
          role: 'contributor' | 'editor' | 'project_admin' | 'viewer'
          assigned_at: string | null
          assigned_by: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          user_id?: string | null
          role: 'contributor' | 'editor' | 'project_admin' | 'viewer'
          assigned_at?: string | null
          assigned_by?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          user_id?: string | null
          role?: 'contributor' | 'editor' | 'project_admin' | 'viewer'
          assigned_at?: string | null
          assigned_by?: string | null
        }
      }
    }
  }
}