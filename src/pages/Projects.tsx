import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X,
  Save,
  FolderOpen,
  Circle,
  CheckCircle,
  Pause,
  Users,
  User
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
  status: 'active' | 'archived' | 'draft' | null
  created_at: string
  updated_at: string
  created_by: string | null
  user_role?: 'contributor' | 'editor' | 'project_admin' | 'viewer'
  created_by_profile?: {
    name: string
    email: string
  }
}

interface Comment {
  id: string
  content: string
  author_name: string
  created_at: string
}

interface User {
  id: string
  name: string
  email: string
  global_role: string
}

interface ProjectMember {
  id: string
  user_id: string
  role: 'contributor' | 'editor' | 'project_admin' | 'viewer'
  assigned_at: string
  user_profile: {
    name: string
    email: string
  }
}

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'draft'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignProject, setAssignProject] = useState<Project | null>(null)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [assignFormData, setAssignFormData] = useState({
    user_id: '',
    role: 'viewer' as 'contributor' | 'editor' | 'project_admin' | 'viewer'
  })
  const [assignLoading, setAssignLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '' as string,
    status: 'active' as 'active' | 'archived' | 'draft'
  })
  const { user } = useAuth()
  const { isSuperAdmin, isAdmin } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Modular functions for fetching projects based on user role
  const fetchProjectsForSuperAdmin = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        created_by_profile:profiles!projects_created_by_fkey(name, email)
      `)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  const fetchProjectsForAdmin = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        created_by_profile:profiles!projects_created_by_fkey(name, email)
      `)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  const fetchProjectsForRegularUser = async () => {
    if (!user) return []

    const { data, error } = await supabase
      .from('project_members')
      .select(`
        role,
        projects!project_members_project_id_fkey(
          id,
          name,
          description,
          status,
          created_at,
          updated_at,
          created_by,
          created_by_profile:profiles!projects_created_by_fkey(name, email)
        )
      `)
      .eq('user_id', user.id)

    if (error) throw error
    
    // Transform the data to match the Project interface
    return data?.map(item => ({
      ...item.projects,
      user_role: item.role
    })) || []
  }

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowModal(true)
      setEditingProject(null)
      setFormData({ name: '', description: '', status: 'active' })
    }
  }, [searchParams])

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user, isSuperAdmin, isAdmin])

  const fetchProjects = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      let projectsData: Project[] = []

      if (isSuperAdmin) {
        projectsData = await fetchProjectsForSuperAdmin()
      } else if (isAdmin) {
        projectsData = await fetchProjectsForAdmin()
      } else {
        projectsData = await fetchProjectsForRegularUser()
      }

      setProjects(projectsData)
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const canEdit = (project: Project) => {
    if (isSuperAdmin || isAdmin) return true
    return project.user_role === 'project_admin' || 
           project.user_role === 'editor' || 
           project.user_role === 'contributor'
  }

  const canDelete = (project: Project) => {
    if (isSuperAdmin) return true
    return project.user_role === 'project_admin'
  }

  const canComment = (project: Project) => {
    return project.user_role === 'viewer' || 
           project.user_role === 'contributor' || 
           project.user_role === 'editor' || 
           project.user_role === 'project_admin' ||
           isSuperAdmin || isAdmin
  }

  const handleComment = async (project: Project) => {
    setSelectedProject(project)
    setShowCommentModal(true)
    // In a real app, you'd fetch comments from a comments table
    // For now, we'll simulate with empty array
    setComments([])
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedProject || !user) return
    
    setCommentLoading(true)
    try {
      // In a real implementation, you'd save to a comments table
      // For now, we'll just add to local state
      const comment: Comment = {
        id: Date.now().toString(),
        content: newComment,
        author_name: user.email?.split('@')[0] || 'User',
        created_at: new Date().toISOString()
      }
      
      setComments(prev => [comment, ...prev])
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setCommentLoading(false)
    }
  }

  const handleAssignUsers = async (project: Project) => {
    setAssignProject(project)
    setShowAssignModal(true)
    await fetchAvailableUsers()
    await fetchProjectMembers(project.id)
  }

  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, global_role')
        .order('name')

      if (error) throw error
      setAvailableUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchProjectMembers = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          id,
          user_id,
          role,
          assigned_at,
          user_profile:profiles!project_members_user_id_fkey(name, email)
        `)
        .eq('project_id', projectId)
        .order('assigned_at', { ascending: false })

      if (error) throw error
      setProjectMembers(data || [])
    } catch (error) {
      console.error('Error fetching project members:', error)
    }
  }

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignProject || !user) return

    // Check if user is already a member
    const existingMember = projectMembers.find(member => member.user_id === assignFormData.user_id)
    if (existingMember) {
      alert('This user is already a member of the project.')
      return
    }

    setAssignLoading(true)
    try {
      const { error } = await supabase
        .from('project_members')
        .insert([{
          project_id: assignProject.id,
          user_id: assignFormData.user_id,
          role: assignFormData.role,
          assigned_by: user.id
        }])

      if (error) throw error

      setAssignFormData({ user_id: '', role: 'viewer' })
      await fetchProjectMembers(assignProject.id)
    } catch (error) {
      console.error('Error assigning user:', error)
      alert('Error assigning user. They may already be a member.')
    } finally {
      setAssignLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
      
      if (assignProject) {
        await fetchProjectMembers(assignProject.id)
      }
    } catch (error) {
      console.error('Error removing member:', error)
    }
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error
      
      if (assignProject) {
        await fetchProjectMembers(assignProject.id)
      }
    } catch (error) {
      console.error('Error updating member role:', error)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'project_admin':
        return 'bg-purple-100 text-purple-800'
      case 'editor':
        return 'bg-blue-100 text-blue-800'
      case 'contributor':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingProject.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([{
            ...formData,
            created_by: user.id,
          }])

        if (error) throw error
      }

      setShowModal(false)
      setEditingProject(null)
      setFormData({ name: '', description: '', status: 'active' })
      fetchProjects()
    } catch (error) {
      console.error('Error saving project:', error)
    }
  }

  const handleEdit = (item: Project) => {
    if (!canEdit(item)) return
    
    setEditingProject(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      status: item.status || 'active',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    const project = projects.find(p => p.id === id)
    if (!project || !canDelete(project)) return
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Circle className="w-4 h-4 text-blue-500" />
      case 'archived':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'draft':
        return <Pause className="w-4 h-4 text-yellow-500" />
      default:
        return <Circle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'archived':
        return 'bg-emerald-100 text-emerald-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredProjects = projects.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Get available users for assignment (all users in dropdown, but show indication if already member)
  const getAvailableUsersForAssignment = () => {
    return availableUsers.map(user => ({
      ...user,
      isAlreadyMember: projectMembers.some(member => member.user_id === user.id)
    }))
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
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'archived' | 'draft')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${(isSuperAdmin || isAdmin) ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          disabled={!isSuperAdmin && !isAdmin}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </button>
      </div>

      {/* Projects grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-4">
              {projects.length === 0 ? 'Get started by creating your first project.' : 'No projects match your search criteria.'}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${(isSuperAdmin || isAdmin) ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              disabled={!isSuperAdmin && !isAdmin}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </button>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div 
              key={project.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(project.status || 'draft')}
                  <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                  {project.user_role && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      project.user_role === 'project_admin' ? 'bg-purple-100 text-purple-800' :
                      project.user_role === 'editor' ? 'bg-blue-100 text-blue-800' :
                      project.user_role === 'contributor' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.user_role}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {canEdit(project) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(project)
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {canComment(project) && project.user_role === 'viewer' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleComment(project)
                      }}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Add Comment"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete(project) && (
              
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(project.id)
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                  >
                  <Trash2 className="w-4 h-4" />
                  </button>
                  )}
                  {(isSuperAdmin || isAdmin) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAssignUsers(project)
                      }}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Manage Members"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description || 'No description provided'}</p>
              
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status || 'draft')}`}>
                  {project.status || 'draft'}
                </span>
                <div className="text-xs text-gray-500 text-right">
                  <div>Updated {new Date(project.updated_at).toLocaleDateString()}</div>
                  {isSuperAdmin && project.created_by_profile && (
                    <div className="text-xs text-gray-400 mt-1">
                      by {project.created_by_profile.name}
                    </div>
                  )}
                </div>
              </div>
              {project.user_role === 'viewer' && (
                <div className="mt-2 text-xs text-blue-600 font-medium">
                  View Only Access
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (isSuperAdmin || isAdmin) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingProject ? 'Edit Project' : 'New Project'}
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
                        Project Name
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
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        id="description"
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'archived' | 'draft' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                        <option value="draft">Draft</option>
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
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingProject ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCommentModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Comments for "{selectedProject.name}"
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCommentModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Add Comment */}
                <div className="mb-6">
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                    Add a comment
                  </label>
                  <div className="space-y-3">
                    <textarea
                      id="comment"
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Share your thoughts about this project..."
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || commentLoading}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {commentLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Add Comment
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Plus className="w-6 h-6 text-gray-400" />
                      </div>
                      <p>No comments yet. Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{comment.author_name}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-end">
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Assignment Modal */}
      {showAssignModal && assignProject && (isSuperAdmin || isAdmin) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAssignModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Manage Members - "{assignProject.name}"
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Add New Member */}
                <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Add New Member</h4>
                  <form onSubmit={handleAssignUser} className="flex items-end space-x-4">
                    <div className="flex-1">
                      <label htmlFor="user_select" className="block text-sm font-medium text-gray-700 mb-2">
                        Select User
                      </label>
                      <select
                        id="user_select"
                        value={assignFormData.user_id}
                        onChange={(e) => setAssignFormData({ ...assignFormData, user_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Choose a user...</option>
                        {getAvailableUsersForAssignment().map((user) => (
                          <option key={user.id} value={user.id} disabled={user.isAlreadyMember}>
                            {user.name} ({user.email}) {user.isAlreadyMember ? '- Already a member' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="role_select" className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <select
                        id="role_select"
                        value={assignFormData.role}
                        onChange={(e) => setAssignFormData({ ...assignFormData, role: e.target.value as 'contributor' | 'editor' | 'project_admin' | 'viewer' })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="contributor">Contributor</option>
                        <option value="editor">Editor</option>
                        <option value="project_admin">Project Admin</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={assignLoading || !assignFormData.user_id}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {assignLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Add Member
                    </button>
                  </form>
                </div>

                {/* Current Members */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Current Members ({projectMembers.length})
                  </h4>
                  {projectMembers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p>No members assigned to this project yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {projectMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{member.user_profile.name}</p>
                              <p className="text-sm text-gray-500">{member.user_profile.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${getRoleColor(member.role)}`}
                            >
                              <option value="viewer">Viewer</option>
                              <option value="contributor">Contributor</option>
                              <option value="editor">Editor</option>
                              <option value="project_admin">Project Admin</option>
                            </select>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove Member"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-end">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}