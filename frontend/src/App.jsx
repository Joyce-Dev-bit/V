import { useEffect, useState } from 'react'
import HomePage from './pages/HomePage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import VideosPage from './pages/VideosPage.jsx'
import './App.css'
import './orders.css'
import './reels.css'
import './pages/AuthPage.css'

export default function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    function syncPath() {
      setPath(window.location.pathname)
    }

    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  function navigate(event, destination) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (window.location.pathname !== destination) {
      window.history.pushState(null, '', destination)
      setPath(destination)
      window.scrollTo(0, 0)
    }
  }

  const authMode = path === '/connexion' ? 'login' : path === '/inscription' ? 'signup' : null
  const isVideosPage = path === '/videos'

  return (
    <>
      <div hidden={Boolean(authMode) || isVideosPage}><HomePage navigate={navigate} path={path} /></div>
      {isVideosPage && <VideosPage navigate={navigate} path={path} />}
      {authMode && <AuthPage key={authMode} mode={authMode} navigate={navigate} />}
    </>
  )
}
