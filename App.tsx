import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { AuthGateProvider } from './hooks/useAuthGate'
import { LoopPlayerProvider } from './hooks/useLoopPlayer'
import { I18nProvider } from './i18n/I18nContext'
import { SeoHead } from './i18n/SeoHead'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import AdminRoute from './components/AdminRoute'
import './App.css'
import './styles/ios.css'
import './styles/design.css'

const Auth = lazy(() => import('./pages/Auth'))
const Home = lazy(() => import('./pages/Home'))
const Loops = lazy(() => import('./pages/Loops'))
const Liked = lazy(() => import('./pages/Liked'))
const Following = lazy(() => import('./pages/Following'))
const Profile = lazy(() => import('./pages/Profile'))
const ProfileRedirect = lazy(() => import('./components/ProfileRedirect'))
const NicknameProfile = lazy(() => import('./components/NicknameProfile'))
const Chats = lazy(() => import('./pages/Chats'))
const LoopUpload = lazy(() => import('./pages/LoopUpload'))
const Search = lazy(() => import('./pages/Search'))
const Admin = lazy(() => import('./pages/Admin'))
const Shop = lazy(() => import('./pages/Shop'))
const Pack = lazy(() => import('./pages/Pack'))
const CreatePack = lazy(() => import('./pages/CreatePack'))
const PurchaseSuccess = lazy(() => import('./pages/PurchaseSuccess'))
const AdminShop = lazy(() => import('./pages/AdminShop'))
const ForgotPassword = lazy(() => import('./components/ForgotPasswordForm'))
const AuthOAuth = lazy(() =>
  import('./components/GoogleSignInButton').then((m) => ({ default: m.AuthOAuth })),
)
const Statistics = lazy(() => import('./pages/Statistics'))
const Offer = lazy(() => import('./pages/Offer'))
const Contacts = lazy(() => import('./pages/Contacts'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Refunds = lazy(() => import('./pages/Refunds'))
const Delivery = lazy(() => import('./pages/Delivery'))
const GenerateMelody = lazy(() => import('./pages/GenerateMelody'))
const LoopTok = lazy(() => import('./pages/LoopTok'))
const LoopDetail = lazy(() => import('./pages/LoopDetail'))
const Pricing = lazy(() => import('./pages/Pricing'))

const PageFallback = () => (
  <div
    style={{
      minHeight: '40vh',
      display: 'grid',
      placeItems: 'center',
      color: 'rgba(255,255,255,0.45)',
      fontSize: 14,
    }}
  >
    Загрузка…
  </div>
)

function App() {
  return (
    <I18nProvider>
    <BrowserRouter>
      <SeoHead />
      <AuthProvider>
        <AuthGateProvider>
        <LoopPlayerProvider>
        <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/auth/oauth" element={<AuthOAuth />} />
          <Route path="/auth" element={
            <GuestRoute>
              <Auth />
            </GuestRoute>
          } />
          <Route path="/forgot-password" element={<ForgotPassword onBack={() => window.history.back()} />} />
          <Route path="/" element={
            <Layout>
              <Home />
            </Layout>
          } />
          <Route path="/loops" element={
            <Layout>
              <Loops />
            </Layout>
          } />
          <Route path="/liked" element={
            <ProtectedRoute feature="like">
              <Layout>
                <Liked />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/following" element={
            <ProtectedRoute feature="profile">
              <Layout>
                <Following />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/loops/:loopId" element={
            <Layout>
              <LoopDetail />
            </Layout>
          } />
          <Route path="/profile" element={
            <ProtectedRoute feature="profile">
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId" element={<ProfileRedirect />} />
          <Route path="/user/:userId" element={<ProfileRedirect />} />
          <Route path="/chats/:chatId" element={
            <ProtectedRoute feature="chats">
              <Layout>
                <Chats />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/chats" element={
            <ProtectedRoute feature="chats">
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
          <Route path="/generate-melody" element={
            <Layout>
              <GenerateMelody />
            </Layout>
          } />
          <Route path="/looptok" element={
            <Layout>
              <LoopTok />
            </Layout>
          } />
          <Route path="/search" element={
            <Layout>
              <Search />
            </Layout>
          } />
          <Route path="/pricing" element={
            <Layout>
              <Pricing />
            </Layout>
          } />
          <Route path="/shop" element={
            <Layout>
              <Shop />
            </Layout>
          } />
          <Route path="/shop/purchase/:packId" element={
            <ProtectedRoute feature="buy">
              <Layout>
                <PurchaseSuccess />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/shop/pack/:packId" element={
            <Layout>
              <Pack />
            </Layout>
          } />
          <Route path="/create-pack" element={
            <Layout>
              <CreatePack />
            </Layout>
          } />
          <Route path="/statistics" element={
            <ProtectedRoute feature="profile">
              <Layout>
                <Statistics />
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
          <Route path="/admin/shop" element={
            <AdminRoute>
              <Layout>
                <AdminShop />
              </Layout>
            </AdminRoute>
          } />
          <Route path="/offer" element={<Offer />} />
          <Route path="/terms" element={<Offer />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refunds" element={<Refunds />} />
          <Route path="/returns" element={<Refunds />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/service" element={<Delivery />} />
          <Route path="/:nickname" element={
            <Layout>
              <NicknameProfile />
            </Layout>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </LoopPlayerProvider>
        </AuthGateProvider>
      </AuthProvider>
    </BrowserRouter>
    </I18nProvider>
  )
}

export default App
