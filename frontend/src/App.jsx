import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState('Vérification...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setApiStatus(data.status === 'ok' ? 'Backend prêt' : 'Backend indisponible')
      })
      .catch(() => {
        setApiStatus('Backend indisponible')
      })
  }, [])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand" aria-label="E-Hetsena logo and name">
          <div className="brand-mark">e.</div>
          <span className="brand-name">E-Hetsena</span>
        </div>

        <div className="construction">EN CONSTRUCTION</div>
      </header>

      <main className="hero">
        <div className="hero-logo">
          <div className="mini-logo">e.</div>
        </div>

        <p className="eyebrow">BIENVENUE SUR E-HETSENA</p>

        <h1>
          Votre marché, à <span className="soft-break">portée de</span>
          <span className="accent">main.</span>
        </h1>

        <p className="subtitle">
          Découvrez un espace pour trouver de belles choses et<br />
          échanger avec leurs vendeurs.
        </p>

        <div className="actions" aria-label="Actions principales">
          <button type="button" className="btn btn-primary">Se connecter</button>
          <button type="button" className="btn btn-secondary">Créer un compte</button>
        </div>

        <p className="note">Connection et inscription disponibles.</p>
        <div className="api-status">{apiStatus}</div>
      </main>

      <footer className="footer">
        <span>Un projet en cours de construction.</span>
        <span className="feed-link">Voir la démonstration du feed <span aria-hidden="true">↗</span></span>
      </footer>
    </div>
  )
}

export default App
