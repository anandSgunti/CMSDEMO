import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { 
  LayoutDashboard, 
  FileText, 
  FolderOpen, 
  LogOut, 
  Menu, 
  X,
  User,
  Users
} from 'lucide-react'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, profile, signOut, isSuperAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Content', href: '/content', icon: FileText },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
    ...(isSuperAdmin ? [{ name: 'Users', href: '/users', icon: Users }] : []),
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/dashboard')
  }

  const currentPage = navigation.find(item => location.pathname.startsWith(item.href))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">CMS</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="mt-6 px-3">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.href)
            return (
              <a
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-lg mb-1 transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(item.href)
                  setSidebarOpen(false)
                }}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {item.name}
              </a>
            )
          })}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">CMS</h1>
          </div>
          <nav className="mt-6 flex-1 px-3">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.href)
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg mb-1 transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(item.href)
                  }}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  {item.name}
                </a>
              )
            })}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.name || user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {profile?.global_role || 'user'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {currentPage?.name || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {currentPage?.name === 'Dashboard' && 'Overview of your content and projects'}
                  {currentPage?.name === 'Content' && 'Manage your content and articles'}
                  {currentPage?.name === 'Projects' && 'Manage your projects and workflows'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="hidden lg:flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}