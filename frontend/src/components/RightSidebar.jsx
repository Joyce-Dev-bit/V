import { Avatar, Icon } from './common.jsx'
import { suggestedSellers } from '../data/demoData.js'

export default function RightSidebar({ setQuery, focusSearch, followedSellers, toggleFollow, setFeedTab }) {
  return (
    <aside className="right-sidebar">
      <section className="sidebar-panel trend-panel">
        <div className="panel-title"><span><Icon name="sparkles" size={17} /> En ce moment</span><span className="panel-dot" /></div>
        <p className="trend-caption">LES UNIVERS QUI FONT PARLER</p>
        {[
          ['#Raphia', 'Des pièces uniques, créées près de chez vous'],
          ['#Vase', 'Des objets qui racontent une histoire'],
          ['#Baobab', 'Les essentiels fabriqués ici'],
        ].map(([tag, description], index) => (
          <button className="trend-item" type="button" key={tag} onClick={() => { setQuery(tag.slice(1)); focusSearch() }}>
            <span>0{index + 1} · TENDANCE</span><strong>{tag}</strong><small>{description}</small>
          </button>
        ))}
      </section>

      <section className="sidebar-panel seller-panel">
        <div className="panel-title"><span>À découvrir</span><Icon name="sparkles" size={16} /></div>
        <p className="trend-caption">DES VENDEURS À SUIVRE</p>
        {suggestedSellers.map((seller) => (
          <div className="suggested-seller" key={seller.id}>
            <Avatar src={seller.avatar} initials={seller.initials} size="small" />
            <div><strong>{seller.name} <span className="verified-mark"><Icon name="check" size={10} /></span></strong><small>{seller.specialty}</small></div>
            <button
              type="button"
              aria-label={followedSellers.includes(seller.id) ? `Ne plus suivre ${seller.shopName}` : `Suivre ${seller.shopName}`}
              aria-pressed={followedSellers.includes(seller.id)}
              onClick={() => toggleFollow(seller.id, seller.shopName)}
            >
              {followedSellers.includes(seller.id) ? '✓' : '+'}
            </button>
          </div>
        ))}
        <button className="all-sellers-link" type="button" onClick={() => { setFeedTab('for-you'); setQuery('') }}>Explorer les vendeurs <span>→</span></button>
      </section>

      <section className="demo-side-note">
        <span className="demo-note-icon"><Icon name="bag" size={17} /></span>
        <p><strong>Vous avez repéré un article ?</strong><span>Ouvrez sa fiche pour retrouver toutes ses photos et vidéos, puis échangez avec le vendeur.</span></p>
      </section>

      <footer className="mini-footer"><span>À propos</span><span>Confidentialité</span><span>© 2026 V</span></footer>
    </aside>
  )
}
