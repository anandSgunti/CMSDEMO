import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from './components/AuthGuard'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Content } from './pages/Content'
import { Projects } from './pages/Projects'
import { ProjectDetails } from './pages/ProjectDetails'
import { Users } from './pages/Users'

function App() {
  return (
    <Router>
      <AuthGuard>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="content" element={<Content />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:projectId" element={<ProjectDetails />} />
            <Route path="users" element={<Users />} />
          </Route>
        </Routes>
      </AuthGuard>
    </Router>
  )
}

export default App