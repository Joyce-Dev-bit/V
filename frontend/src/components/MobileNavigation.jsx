import { Avatar, Icon } from './common.jsx'
import { currentUser } from '../data/demoData.js'

export default function MobileNavigation({ handleNavigation }) {
  return (
    <nav className="mobile-nav" aria-label="Navigation mobile">
      <button className="is-current" type="button" onClick={() => handleNavigation('home')}><Icon name="home" size={20} /><span>Accueil</span></button>
      <button type="button" onClick={() => handleNavigation('search')}><Icon name="search" size={20} /><span>Recherche</span></button>
      <button className="mobile-create" type="button" onClick={() => handleNavigation('create')}><span><Icon name="plus" size={21} /></span><span>Publier</span></button>
      <button type="button" onClick={() => handleNavigation('messages')}><Icon name="message" size={20} /><span>Messages</span></button>
      <button type="button" onClick={() => handleNavigation('profile')}><Avatar src={currentUser.avatar} initials={currentUser.initials} size="nav" /><span>Profil</span></button>
    </nav>
  )
}
