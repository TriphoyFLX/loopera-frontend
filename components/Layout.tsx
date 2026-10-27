import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { artistTypesApi } from '../utils/artistTypesApi'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileAppBar from './MobileAppBar'
import ArtistOnboarding from './ArtistOnboarding'
import LegalFooter from './LegalFooter'
import LoopPlayerBar from './LoopPlayerBar'
import ChatToast from './ChatToast'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const { user, token, isAuthenticated, isLoading, updateUser } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const checkOnboarding = async () => {
      if (isLoading || !isAuthenticated || !token) {
        setShowOnboarding(false)
        return
      }

      try {
        const status = await artistTypesApi.getOnboardingStatus()
        setShowOnboarding(status.should_prompt)
      } catch {
        setShowOnboarding(false)
      }
    }

    checkOnboarding()
  }, [isLoading, isAuthenticated, token, user?.onboarding_completed])

  const handleOnboardingComplete = (completed = false) => {
    setShowOnboarding(false)
    if (completed && user) {
      updateUser({ ...user, onboarding_completed: true })
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content with-sidebar">
        <div className="content-wrapper">
          {children}
          <LegalFooter />
        </div>
      </main>
      <LoopPlayerBar />
      <MobileAppBar />
      <ChatToast />
      <ArtistOnboarding open={showOnboarding} onComplete={handleOnboardingComplete} />
    </div>
  )
}

export default Layout
