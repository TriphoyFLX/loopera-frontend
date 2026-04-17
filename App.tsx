import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Loops from './pages/Loops'
import UserProfile from './pages/UserProfile'
import Chats from './pages/Chats'
import LoopUpload from './pages/LoopUpload'
import Search from './pages/Search'
import Admin from './pages/Admin'
import AdminRoute from './components/AdminRoute'
import ForgotPassword from './components/ForgotPasswordForm'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword onBack={() => window.history.back()} />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/loops" element={
            <ProtectedRoute>
              <Layout>
                <Loops />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <UserProfile />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId" element={
            <Layout>
              <UserProfile />
            </Layout>
          } />
          <Route path="/chats" element={
            <ProtectedRoute>
              <Layout>
                <Chats />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/loop-upload" element={
            <Layout>
              <LoopUpload />
            </Layout>
          } />
          <Route path="/search" element={
            <ProtectedRoute>
              <Layout>
                <Search />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <Layout>
                <Admin />
              </Layout>
            </AdminRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
