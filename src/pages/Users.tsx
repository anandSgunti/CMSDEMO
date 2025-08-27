import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { User } from '@supabase/supabase-js'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X,
  Save,
  Users as UsersIcon,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Mail,
  Calendar
} from 'lucide-react'

interface UserWithProfile {
  id: string
  email: string
  name: string
  avatar_url: string | null
  global_role: 'admin' | 'super_admin' | 'user' | null
  created_at: string | null
  updated_at: string | null
  last_login: string | null
  auth_created_at: string
  email_confirmed_at: string | null
  has_profile: boolean
}

export function Users() {
  const [users, setUsers] = useState<UserWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'super_admin' | 'user'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithProfile | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    global_role: 'user' as 'admin' | 'super_admin' | 'user'
  })
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isSuperAdmin } = useAuth()

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers()
    }
  }, [isSuperAdmin])

  const fetchUsers = async () => {
    try {
      // Get all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (profileError) throw profileError

      // Convert profiles to UserWithProfile format and set directly
      if (profiles) {
        const mergedUsers: UserWithProfile[] = profiles.map(profile => ({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          avatar_url: profile.avatar_url,
          global_role: profile.global_role,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          last_login: profile.last_login,
          auth_created_at: profile.created_at || new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          has_profile: true
        }))
        
        setUsers(mergedUsers)
      } else {
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setError(null)

    try {
      if (editingUser) {
        if (editingUser.has_profile) {
          // Update existing user profile
          const { error } = await supabase
            .from('profiles')
            .update({
              name: formData.name,
              global_role: formData.global_role,
              updated_at: new Date().toISOString(),
            })
            .eq('id', editingUser.id)

          if (error) throw error
        } else {
          // Create profile for user who doesn't have one
          const { error } = await supabase
            .from('profiles')
            .insert([{
              id: editingUser.id,
              email: editingUser.email,
              name: formData.name,
              global_role: formData.global_role,
            }])

          if (error) throw error
        }
      } else {
        // Create new user via regular signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password
        })

        if (authError) throw authError

        // Create profile for the new user
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: authData.user.id,
              email: formData.email,
              name: formData.name,
              global_role: formData.global_role,
            }])

          if (profileError) throw profileError
        }
      }

      setShowModal(false)
      setEditingUser(null)
      setFormData({ email: '', password: '', name: '', global_role: 'user' })
      fetchUsers()
    } catch (error: any) {
      console.error('Error saving user:', error)
      setError(error.message || 'Failed to save user')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (user: UserWithProfile) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      global_role: user.global_role || 'user'
    })
    setShowModal(true)
    setError(null)
  }

  const handleDelete = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}?`)) return

    try {
      // Delete user profile (auth user will remain but won't be able to access the system)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      setError(error.message || 'Failed to delete user')
    }
  }

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'super_admin':
        return <ShieldCheck className="w-4 h-4 text-red-500" />
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return <UserIcon className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.global_role === roleFilter
    return matchesSearch && matchesRole
  })

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You need super admin privileges to access user management.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'super_admin' | 'user')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <button
          onClick={() => {
            setShowModal(true)
            setEditingUser(null)
            setFormData({ email: '', password: '', name: '', global_role: 'user' })
            setError(null)
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New User
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600 mb-4">
              {users.length === 0 ? 'No users have been created yet.' : 'No users match your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                            {!user.has_profile && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                No Profile
                              </span>
                            )}
                            {!user.email_confirmed_at && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Unconfirmed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRoleIcon(user.global_role)}
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.global_role)}`}>
                          {user.global_role || 'user'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(user.auth_created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.email)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingUser ? 'Edit User' : 'New User'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={!!editingUser}
                      />
                    </div>
                    
                    {!editingUser && (
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          id="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          minLength={6}
                        />
                      </div>
                    )}
                    
                    <div>
                      <label htmlFor="global_role" className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <select
                        id="global_role"
                        value={formData.global_role}
                        onChange={(e) => setFormData({ ...formData, global_role: e.target.value as 'admin' | 'super_admin' | 'user' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}