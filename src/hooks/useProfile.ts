import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Profile {
  id: string
  email: string
  name: string
  avatar_url: string | null
  global_role: 'admin' | 'super_admin' | 'user' | null
  created_at: string | null
  updated_at: string | null
  last_login: string | null
}

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          // If profile doesn't exist, create one
          if (error.code === 'PGRST116') {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([{
                id: user.id,
                email: user.email || '',
                name: user.email?.split('@')[0] || 'User',
                global_role: 'user'
              }])
              .select()
              .single()

            if (createError) throw createError
            setProfile(newProfile)
          } else {
            throw error
          }
        } else {
          setProfile(data)
        }
      } catch (error) {
        console.error('Error fetching/creating profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return { error: new Error('No user or profile') }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      setProfile(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  return {
    profile,
    loading,
    updateProfile,
    isSuperAdmin: profile?.global_role === 'super_admin',
    isAdmin: profile?.global_role === 'admin' || profile?.global_role === 'super_admin'
  }
}