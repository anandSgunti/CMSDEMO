import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Plus,
  FileText,
  Calendar,
  User,
  Circle,
  CheckCircle,
  Pause,
  Search,
  Filter,
  Save,
  X,
  Eye,
  EyeOff,
  Clock,
  Tag
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
  status: 'active' | 'archived' | 'draft' | null
  created_at: string
  updated_at: string
  created_by: string | null
  created_by_profile?: {
    name: string
    email: string
  }
}

interface Content {
  id: string
  title: string
  body: string
  status: 'archived' | 'draft' | 'published' | 'review' | null
  created_at: string
  updated_at: string
  published_at: string | null
  author_id: string
  author_profile?: {
    name: string
    email: string
  }
  tags: string[] | null
  content_type: string | null
}

export function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user, isSuperAdmin } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'archived' | 'draft' | 'published' | 'review'>('all')
  const [editingContent, setEditingContent] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ title: string; body: string; status: string }>({ title: '', body: '', status: '' })
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedContent, setExpandedContent] = useState<Set<string>>(new Set())

  // Get user's role in this project
  const [userRole, setUserRole] = useState<'contributor' | 'editor' | 'project_admin' | 'viewer' | null>(null)

  useEffect(() => {
    if (projectId) {
      fetchProject()
      fetchProjectContent()
      fetchUserRole()
    }
  }, [projectId, user])

  const fetchUserRole = async () => {
    if (!projectId || !user || isSuperAdmin) return

    try {
      const { data, error } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setUserRole(data?.role || null)
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const fetchProject = async () => {
    if (!projectId || !user) return

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          created_by_profile:profiles!projects_created_by_fkey(name, email)
        `)
        .eq('id', projectId)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectContent = async () => {
    if (!projectId || !user) return

    try {
      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          author_profile:profiles!content_author_id_fkey(name, email)
        `)
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setContent(data || [])
    } catch (error) {
      console.error('Error fetching project content:', error)
    } finally {
      setContentLoading(false)
    }
  }

  const canEditContent = () => {
    if (isSuperAdmin) return true
    return userRole === 'project_admin' || userRole === 'editor' || userRole === 'contributor'
  }

  const canViewOnly = () => {
    return userRole === 'viewer' && !isSuperAdmin
  }

  const handleEditContent = (contentItem: Content) => {
    if (!canEditContent()) return
    setEditingContent(contentItem.id)
    setEditData({
      title: contentItem.title,
      body: contentItem.body,
      status: contentItem.status || 'draft'
    })
  }

  const handleEditTitle = (contentItem: Content) => {
    if (!canEditContent()) return
    setEditingTitle(contentItem.id)
    setEditData({
      title: contentItem.title,
      body: contentItem.body,
      status: contentItem.status || 'draft'
    })
  }

  const handleSaveContent = async (contentId: string) => {
    setSaving(contentId)
    try {
      const { error } = await supabase
        .from('content')
        .update({
          title: editData.title,
          body: editData.body,
          status: editData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId)

      if (error) throw error

      // Update local state
      setContent(prev => prev.map(item => 
        item.id === contentId 
          ? { ...item, title: editData.title, body: editData.body, status: editData.status as any, updated_at: new Date().toISOString() }
          : item
      ))

      setEditingContent(null)
      setEditingTitle(null)
    } catch (error) {
      console.error('Error saving content:', error)
    } finally {
      setSaving(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingContent(null)
    setEditingTitle(null)
    setEditData({ title: '', body: '', status: '' })
  }

  const handleDeleteContent = async (contentId: string) => {
    if (!canEditContent()) return
    if (!confirm('Are you sure you want to delete this content?')) return

    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', contentId)

      if (error) throw error
      setContent(prev => prev.filter(item => item.id !== contentId))
    } catch (error) {
      console.error('Error deleting content:', error)
    }
  }

  const toggleExpanded = (contentId: string) => {
    setExpandedContent(prev => {
      const newSet = new Set(prev)
      if (newSet.has(contentId)) {
        newSet.delete(contentId)
      } else {
        newSet.add(contentId)
      }
      return newSet
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Circle className="w-5 h-5 text-blue-500" />
      case 'archived':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case 'draft':
        return <Pause className="w-5 h-5 text-yellow-500" />
      default:
        return <Circle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'archived':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getContentStatusColor = (status: string | null) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'review':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.body.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
        <button
          onClick={() => navigate('/projects')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Projects
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Projects
          </button>
        </div>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              {getStatusIcon(project.status || 'draft')}
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status || 'draft')}`}>
                {project.status || 'draft'}
              </span>
            </div>
            <p className="text-lg text-gray-600 mb-6">{project.description || 'No description provided'}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-sm text-gray-600">{new Date(project.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Last Updated</p>
                  <p className="text-sm text-gray-600">{new Date(project.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
              {project.created_by_profile && (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created By</p>
                    <p className="text-sm text-gray-600">{project.created_by_profile.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="p-8 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Project Content</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {filteredContent.length} items
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'archived' | 'draft' | 'published' | 'review')}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <button
                onClick={() => navigate(`/content?action=new&project=${projectId}`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Content
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {contentLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="mx-auto h-16 w-16 text-gray-300 mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {content.length === 0 ? 'This project doesn\'t have any content yet. Create your first piece of content to get started.' : 'No content matches your search criteria. Try adjusting your filters.'}
              </p>
              <button
                onClick={() => navigate(`/content?action=new&project=${projectId}`)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Content
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredContent.map((item) => {
                const isExpanded = expandedContent.has(item.id)
                const isEditingBody = editingContent === item.id
                const isEditingTitleField = editingTitle === item.id
                const isSaving = saving === item.id

                return (
                  <div key={item.id} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {isEditingTitleField ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editData.title}
                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                className="w-full text-xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 pb-2"
                                autoFocus
                              />
                              <div className="flex items-center space-x-2">
                                <select
                                  value={editData.status}
                                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="draft">Draft</option>
                                  <option value="review">Review</option>
                                  <option value="published">Published</option>
                                  <option value="archived">Archived</option>
                                </select>
                                <button
                                  onClick={() => handleSaveContent(item.id)}
                                  disabled={isSaving}
                                  className="flex items-center px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
                                >
                                  {isSaving ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  ) : (
                                    <Save className="w-3 h-3 mr-1" />
                                  )}
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex items-center px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 
                                  className={`text-xl font-bold text-gray-900 mb-2 ${canEditContent() ? 'cursor-pointer hover:text-blue-600 transition-colors' : 'cursor-default'}`}
                                  onClick={() => canEditContent() && handleEditTitle(item)}
                                >
                                  {item.title}
                                  {canViewOnly() && (
                                    <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                      View Only
                                    </span>
                                  )}
                                </h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getContentStatusColor(item.status)}`}>
                                    {item.status || 'draft'}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Updated {new Date(item.updated_at).toLocaleDateString()}
                                  </span>
                                  {item.author_profile && (
                                    <span className="flex items-center">
                                      <User className="w-3 h-3 mr-1" />
                                      {item.author_profile.name}
                                    </span>
                                  )}
                                  {item.published_at && (
                                    <span className="flex items-center">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Published {new Date(item.published_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {!isEditingTitleField && (
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => toggleExpanded(item.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={isExpanded ? "Collapse" : "Expand"}
                            >
                              {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            {canEditContent() && (
                              <>
                                <button
                                  onClick={() => handleEditContent(item)}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit Content"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteContent(item.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {(isExpanded || isEditingBody) && (
                        <div className="border-t border-gray-100 pt-4 mt-4">
                          {isEditingBody ? (
                            <div className="space-y-4">
                              <textarea
                                value={editData.body}
                                onChange={(e) => setEditData({ ...editData, body: e.target.value })}
                                className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Write your content here..."
                              />
                              <div className="flex items-center justify-between">
                                <select
                                  value={editData.status}
                                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="draft">Draft</option>
                                  <option value="review">Review</option>
                                  <option value="published">Published</option>
                                  <option value="archived">Archived</option>
                                </select>
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={handleCancelEdit}
                                    className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveContent(item.id)}
                                    disabled={isSaving}
                                    className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                  >
                                    {isSaving ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    ) : (
                                      <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                              {canViewOnly() && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-sm text-blue-700 flex items-center">
                                    <Eye className="w-4 h-4 mr-2" />
                                    You have view-only access to this content
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div 
                              className={`prose prose-sm max-w-none text-gray-700 leading-relaxed p-4 rounded-xl transition-colors prose-headings:text-gray-900 prose-headings:font-semibold prose-p:text-gray-700 prose-strong:text-gray-900 prose-em:text-gray-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-blockquote:border-l-4 prose-blockquote:border-blue-200 prose-blockquote:pl-4 prose-blockquote:italic prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700 ${canEditContent() ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}`}
                              onClick={() => canEditContent() && handleEditContent(item)}
                            >
                              <div className="cursor-pointer hover:text-gray-800 transition-colors" onClick={() => toggleExpanded(item.id)}>
                                <ReactMarkdown>{item.body}</ReactMarkdown>
                              </div>
                              {canViewOnly() && (
                                <div className="mt-2 text-xs text-blue-600 flex items-center">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View Only Access
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}