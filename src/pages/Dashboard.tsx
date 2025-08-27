import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { 
  FileText, 
  FolderOpen, 
  TrendingUp, 
  Users,
  Plus,
  ArrowRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Stats {
  totalContent: number
  totalProjects: number
  publishedContent: number
  activeProjects: number
  reviewContent: number
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalContent: 0,
    totalProjects: 0,
    publishedContent: 0,
    activeProjects: 0,
    reviewContent: 0,
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

      try {
        const [contentResult, projectsResult, publishedResult, activeResult, reviewResult] = await Promise.all([
          supabase.from('content').select('id', { count: 'exact' }).eq('author_id', user.id),
          supabase.from('projects').select('id', { count: 'exact' }).eq('created_by', user.id),
          supabase.from('content').select('id', { count: 'exact' }).eq('author_id', user.id).eq('status', 'published'),
          supabase.from('projects').select('id', { count: 'exact' }).eq('created_by', user.id).eq('status', 'active'),
          supabase.from('content').select('id', { count: 'exact' }).eq('author_id', user.id).eq('status', 'review'),
        ])

        setStats({
          totalContent: contentResult.count || 0,
          totalProjects: projectsResult.count || 0,
          publishedContent: publishedResult.count || 0,
          activeProjects: activeResult.count || 0,
          reviewContent: reviewResult.count || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  const statCards = [
    {
      name: 'Total Content',
      value: stats.totalContent,
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      name: 'Published Content',
      value: stats.publishedContent,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      name: 'Total Projects',
      value: stats.totalProjects,
      icon: FolderOpen,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      name: 'Content in Review',
      value: stats.reviewContent,
      icon: TrendingUp,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      name: 'Active Projects',
      value: stats.activeProjects,
      icon: Users,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
  ]

  const quickActions = [
    {
      name: 'New Content',
      description: 'Create a new article or page',
      icon: FileText,
      action: () => navigate('/content?action=new'),
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'New Project',
      description: 'Start a new project',
      icon: FolderOpen,
      action: () => navigate('/projects?action=new'),
      color: 'bg-emerald-600 hover:bg-emerald-700'
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Welcome back, {user?.email?.split('@')[0]}
        </h2>
        <p className="text-gray-600">
          Here's what's happening with your content and projects today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.name}
                  onClick={action.action}
                  className={`w-full flex items-center justify-between p-4 rounded-lg ${action.color} text-white hover:shadow-md transition-all`}
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <p className="font-medium">{action.name}</p>
                      <p className="text-sm opacity-90">{action.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">System initialized</p>
                <p className="text-xs text-gray-500">Ready to start creating content</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Authentication configured</p>
                <p className="text-xs text-gray-500">Secure login system active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}