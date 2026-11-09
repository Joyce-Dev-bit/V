import { Avatar, Icon } from './common.jsx'
import { categories, currentUser } from '../data/demoData.js'

export default function LeftSidebar({ posts, followedSellers, handleNavigation, feedTab, setFeedTab, activeCategory, setActiveCategory }) {
  return (
    <aside className="left-sidebar">
      <section className="sidebar-profile">
        <div className="sidebar-cover" />
        <Avatar src={currentUser.avatar} initials={currentUser.initials} size="large" className="sidebar-avatar" />
        <strong>{currentUser.name}</strong>
        <span>{currentUser.handle}</span>
        <div className="sidebar-stats"><span><strong>{posts.filter((post) => post.sellerId === currentUser.id).length}</strong> publications</span><span><strong>{followedSellers.length}</strong> abonnements</span></div>
        <button type="button" onClick={() => handleNavigation('profile')}>Voir mon profil <span aria-hidden="true">→</span></button>
      </section>

      <nav className="sidebar-nav" aria-label="Navigation du fil">
        <p className="sidebar-label">VOTRE ESPACE</p>
        <button className={feedTab === 'for-you' ? 'is-selected' : ''} type="button" onClick={() => setFeedTab('for-you')}><Icon name="sparkles" size={18} /> Pour vous</button>
        <button className={feedTab === 'following' ? 'is-selected' : ''} type="button" onClick={() => setFeedTab('following')}><Icon name="heart" size={18} /> Abonnements</button>
        <button type="button" onClick={() => handleNavigation('messages')}><Icon name="message" size={18} /> Messages</button>
        <button type="button" onClick={() => handleNavigation('purchases')}><Icon name="bag" size={18} /> Mes achats</button>
      </nav>

      <section className="category-sidebar">
        <p className="sidebar-label">EXPLORER LES UNIVERS</p>
        {categories.map((category, index) => (
          <button
            className={activeCategory === category ? 'is-selected' : ''}
            type="button"
            key={category}
            onClick={() => {
              setActiveCategory(category)
              setFeedTab('for-you')
            }}
          >
            <span className={`category-dot category-dot-${index}`} />
            {category === 'Tout' ? 'Tout explorer' : category}
          </button>
        ))}
      </section>

      <div className="sidebar-note">
        <Icon name="sparkles" size={18} />
        <p><strong>Un compte, deux possibilités.</strong><span>Achetez ce qui vous plaît, vendez ce que vous créez.</span></p>
        <button type="button" onClick={() => handleNavigation('create')}>Créer une publication →</button>
      </div>
    </aside>
  )
}
