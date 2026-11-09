import { useState } from 'react'
import { Icon } from '../components/common.jsx'

export default function AuthPage({ mode, navigate }) {
  const isSignup = mode === 'signup'
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const phone = String(data.get('phone') ?? '').trim()
    const password = String(data.get('password') ?? '')
    const digits = phone.replace(/\D/g, '')

    if (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 8 || digits.length > 15) {
      setError('Saisissez un numéro valide de 8 à 15 chiffres, avec son indicatif si nécessaire.')
      return
    }
    if (isSignup && password !== data.get('confirmPassword')) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    form.reset()
    setError('')
    setComplete(true)
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <a className="auth-brand" href="/" onClick={(event) => navigate(event, '/')} aria-label="V, retour à l’accueil">
          <span className="v-mark">V</span>
          <span><strong>V</strong><small>LE FIL QUI FAIT VIVRE LE COMMERCE</small></span>
        </a>
        <a className="auth-back" href="/" onClick={(event) => navigate(event, '/')}>← Retour au fil</a>
      </header>

      <main className="auth-layout">
        <section className="auth-intro" aria-label="Découvrir V">
          <span className="auth-eyebrow"><Icon name="sparkles" size={15} /> UN COMPTE, TOUTES LES POSSIBILITÉS</span>
          <h1>De belles découvertes commencent <em>par une rencontre.</em></h1>
          <p>Un espace pour découvrir des produits, échanger avec leurs vendeurs et partager vos propres créations.</p>
          <div className="auth-features">
            <div><span><Icon name="search" size={19} /></span><p><strong>Découvrez à votre rythme</strong><small>Des produits et des histoires dans votre fil.</small></p></div>
            <div><span><Icon name="message" size={19} /></span><p><strong>Échangez en direct</strong><small>Discutez avec les personnes derrière les articles.</small></p></div>
            <div><span><Icon name="bag" size={19} /></span><p><strong>Achetez et vendez</strong><small>Un seul compte pour toutes vos envies.</small></p></div>
          </div>
          <div className="auth-quote"><span>✦</span> Le commerce est plus beau quand il est humain.</div>
        </section>

        <section className="auth-card" aria-labelledby="auth-title">
          <span className="auth-card-eyebrow">{isSignup ? 'BIENVENUE SUR V' : 'HEUREUX DE VOUS REVOIR'}</span>
          <h2 id="auth-title">{isSignup ? 'Créez votre compte' : 'Connectez-vous'}</h2>
          <p className="auth-subtitle">
            {isSignup ? 'Rejoignez le fil qui rapproche acheteurs et vendeurs.' : 'Retrouvez votre espace et vos découvertes.'}
          </p>
          <div className="auth-demo-notice">
            <strong>Parcours de démonstration</strong>
            <span>Aucun compte n’est créé et aucune connexion réelle n’est effectuée. N’utilisez pas de vrai mot de passe.</span>
          </div>

          {complete ? (
            <div className="auth-success" role="status">
              <span className="auth-success-icon"><Icon name="check" size={22} /></span>
              <h3>{isSignup ? 'Inscription simulée' : 'Connexion simulée'}</h3>
              <p>Le formulaire est terminé, mais aucun compte ni session n’a été créé. Le fil reste une démonstration avec un profil fictif.</p>
              <a className="auth-submit" href="/" onClick={(event) => navigate(event, '/')}>Découvrir le fil <span>→</span></a>
              <button className="auth-retry" type="button" onClick={() => setComplete(false)}>Revenir au formulaire</button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} onChange={() => error && setError('')}>
              {isSignup && (
                <label className="auth-field">
                  <span>Votre nom</span>
                  <input name="name" type="text" autoComplete="name" placeholder="Ex. Mialy Rakoto" required />
                </label>
              )}
              <label className="auth-field">
                <span>Numéro de téléphone</span>
                <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ex. +261 34 00 000 00" required aria-describedby="phone-hint" />
                <small id="phone-hint">Avec indicatif international si nécessaire.</small>
              </label>
              <label className="auth-field">
                <span>Mot de passe de démonstration</span>
                <input name="password" type="password" autoComplete={isSignup ? 'new-password' : 'off'} placeholder="8 caractères minimum" minLength={8} required />
              </label>
              {isSignup && (
                <label className="auth-field">
                  <span>Confirmer le mot de passe</span>
                  <input name="confirmPassword" type="password" autoComplete="new-password" placeholder="Saisissez-le à nouveau" minLength={8} required />
                </label>
              )}
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="auth-submit" type="submit">{isSignup ? 'Simuler mon inscription' : 'Simuler ma connexion'} <span>→</span></button>
            </form>
          )}

          <p className="auth-switch">
            {isSignup ? 'Déjà sur V ?' : 'Vous découvrez V ?'}{' '}
            <a href={isSignup ? '/connexion' : '/inscription'} onClick={(event) => navigate(event, isSignup ? '/connexion' : '/inscription')}>
              {isSignup ? 'Se connecter' : 'Créer un compte'}
            </a>
          </p>
          <p className="auth-footnote">Le numéro et le mot de passe ne sont ni envoyés ni enregistrés. Aucun SMS n’est envoyé.</p>
        </section>
      </main>
      <footer className="auth-footer">© 2026 V · Le fil qui fait vivre le commerce</footer>
    </div>
  )
}
