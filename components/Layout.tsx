import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileAppBar from './MobileAppBar'
import LogoButton from './LogoButton'
import DebugPanel from './DebugPanel'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="app-layout">
      <LogoButton />
      <Sidebar />
      <Header />
      <main className="main-content with-sidebar">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
      <MobileAppBar />
      <DebugPanel />
    </div>
  )
}

export default Layout
