import { Avatar, Icon } from './common.jsx'
import { currentUser } from '../data/demoData.js'

export default function SiteHeader({ handleNavigation, searchRef, query, setQuery, navigate, activePath = '/' }) {
  const isVideosPage = activePath === '/videos'

  return (
    <header className="top-header">
      <div className="top-header-main">
        <button className="v-brand" type="button" aria-label="V, accueil" onClick={() => handleNavigation('home')}>
          <span className="v-mark">V</span>
          <span className="v-brand-copy"><strong>V</strong><small>LE FIL QUI FAIT VIVRE LE COMMERCE</small></span>
        </button>
        <label className="global-search" role="search">
          <Icon name="search" size={19} />
          <input
            ref={searchRef}
            aria-label="Rechercher un produit ou un vendeur"
            placeholder="Rechercher un produit, un vendeur…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && <button type="button" aria-label="Effacer la recherche" onClick={() => setQuery('')}><Icon name="close" size={16} /></button>}
          <kbd>⌘ K</kbd>
        </label>
        <div className="header-account">
          <a className="header-login" href="/connexion" onClick={(event) => navigate(event, '/connexion')}>Connexion</a>
          <button className="header-publish" type="button" onClick={() => handleNavigation('create')}><Icon name="plus" size={17} /> Publier / Vendre</button>
          <button className="header-profile" type="button" aria-label="Ouvrir mon profil" onClick={() => handleNavigation('profile')}>
            <Avatar src={currentUser.avatar} initials={currentUser.initials} size="small" />
          </button>
        </div>
      </div>
      <nav className="desktop-nav" aria-label="Navigation principale">
        <button className={isVideosPage ? '' : 'is-current'} type="button" onClick={(event) => (isVideosPage ? navigate(event, '/') : handleNavigation('home'))}><Icon name="home" size={18} /> Accueil</button>
        <button className={isVideosPage ? 'is-current' : ''} type="button" onClick={(event) => navigate(event, '/videos')}><Icon name="play" size={18} /> Vidéos</button>
        <button type="button" onClick={() => handleNavigation('search')}><Icon name="search" size={18} /> Recherche</button>
        <button type="button" onClick={() => handleNavigation('create')}><Icon name="plus" size={18} /> Publier</button>
        <button type="button" onClick={() => handleNavigation('messages')}><Icon name="message" size={18} /> Messages</button>
        <button type="button" onClick={() => handleNavigation('profile')}><Icon name="user" size={18} /> Profil</button>
        <span className="nav-account-note">Achetez et vendez avec le même compte</span>
      </nav>
    </header>
  )
}
