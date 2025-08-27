import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye,
  X,
  Save,
  FileText
} from 'lucide-react'

interface Content {
  id: string
  title: string
  body: string
  status: 'archived' | 'draft' | 'published' | 'review' | null
  project_id: string | null
  created_at: string
  updated_at: string
  author_id: string
  published_at: string | null
  tags: string[] | null
  content_type: string | null
  is_template: boolean | null
}

export function Content() {
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'archived' | 'draft' | 'published' | 'review'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    status: 'draft' as 'archived' | 'draft' | 'published' | 'review',
    project_id: null as string | null,
    tags: [] as string[],
    content_type: 'article'
  })
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowModal(true)
      setEditingContent(null)
      setFormData({ 
        title: '', 
        body: '', 
        status: 'draft', 
        project_id: null, 
        tags: [], 
        content_type: 'article' 
      })
    }
  }, [searchParams])

  useEffect(() => {
    fetchContent()
  }, [user])

  const fetchContent = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('author_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setContent(data || [])
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingContent) {
        const { error } = await supabase
          .from('content')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingContent.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('content')
          .insert([{
            ...formData,
            author_id: user.id,
          }])

        if (error) throw error
      }

      setShowModal(false)
      setEditingContent(null)
      setFormData({ 
        title: '', 
        body: '', 
        status: 'draft', 
        project_id: null, 
        tags: [], 
        content_type: 'article' 
      })
      fetchContent()
    } catch (error) {
      console.error('Error saving content:', error)
    }
  }

  const handleEdit = (item: Content) => {
    setEditingContent(item)
    setFormData({
      title: item.title,
      body: item.body,
      status: item.status,
      project_id: item.project_id,
      tags: item.tags || [],
      content_type: item.content_type || 'article'
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return

    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchContent()
    } catch (error) {
      console.error('Error deleting content:', error)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'archived' | 'draft' | 'published' | 'review')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="archived">Archived</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="review">Review</option>
          </select>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Content
        </button>
      </div>

      {/* Content list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredContent.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
            <p className="text-gray-600 mb-4">
              {content.length === 0 ? 'Get started by creating your first piece of content.' : 'No content matches your search criteria.'}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Content
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredContent.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h3>
                    <div className="text-gray-600 text-sm line-clamp-2 mb-3 prose prose-sm max-w-none prose-headings:text-gray-700 prose-headings:font-medium prose-p:text-gray-600 prose-strong:text-gray-700 prose-em:text-gray-500">
                      <ReactMarkdown>{item.body.substring(0, 150) + '...'}</ReactMarkdown>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'review' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status || 'draft'}
                      </span>
                      <span>Updated {new Date(item.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                      {editingContent ? 'Edit Content' : 'New Content'}
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
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                        Content
                      </label>
                      <textarea
                        id="body"
                        rows={6}
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'archived' | 'draft' | 'published' | 'review' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="archived">Archived</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="review">Review</option>
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
                    {editingContent ? 'Update' : 'Create'}
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