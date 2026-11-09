import { Avatar, Icon } from './common.jsx'
import PostCard from './PostCard.jsx'
import { currentUser } from '../data/demoData.js'

export default function Feed({ handleNavigation, feedTab, setFeedTab, filteredPosts, setQuery, setActiveCategory, productById, likedPosts, followedSellers, expandedComments, setExpandedComments, commentDrafts, setCommentDrafts, showToast, toggleLike, toggleFollow, sharePost, addComment, openProduct }) {
  return (
    <main className="feed-column" id="accueil">
      <section className="feed-intro">
        <div className="feed-heading">
          <span className="feed-sparkle"><Icon name="sparkles" size={17} /></span>
          <div><p>LE FIL DU COMMERCE VIVANT</p><h1>Découvrez. Échangez. Trouvez.</h1></div>
        </div>
        <p>Des produits présentés par celles et ceux qui les créent et les vendent.</p>
      </section>

      <section className="composer-card" aria-label="Créer une publication">
        <Avatar src={currentUser.avatar} initials={currentUser.initials} />
        <button className="composer-prompt" type="button" onClick={() => handleNavigation('create')}>Qu’avez-vous envie de partager aujourd’hui ?</button>
        <button className="composer-media" type="button" aria-label="Ajouter une photo ou une vidéo" onClick={() => handleNavigation('create')}><Icon name="image" size={19} /><span>Photo / vidéo</span></button>
        <button className="composer-publish" type="button" onClick={() => handleNavigation('create')}><Icon name="plus" size={18} /></button>
      </section>

      <div className="feed-controls">
        <div className="feed-tabs" role="tablist" aria-label="Publications du fil">
          <button className={feedTab === 'for-you' ? 'is-selected' : ''} role="tab" aria-selected={feedTab === 'for-you'} type="button" onClick={() => setFeedTab('for-you')}>Pour vous</button>
          <button className={feedTab === 'following' ? 'is-selected' : ''} role="tab" aria-selected={feedTab === 'following'} type="button" onClick={() => setFeedTab('following')}>Abonnements</button>
        </div>
        <span className="feed-live"><span /> Fil de démonstration</span>
      </div>

      {filteredPosts.length ? (
        <div className="post-list">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              productById={productById}
              likedPosts={likedPosts}
              followedSellers={followedSellers}
              expandedComments={expandedComments}
              setExpandedComments={setExpandedComments}
              commentDrafts={commentDrafts}
              setCommentDrafts={setCommentDrafts}
              showToast={showToast}
              toggleLike={toggleLike}
              toggleFollow={toggleFollow}
              sharePost={sharePost}
              addComment={addComment}
              openProduct={openProduct}
            />
          ))}
        </div>
      ) : (
        <div className="feed-empty">
          <Icon name="search" size={27} />
          <h2>Aucune publication trouvée</h2>
          <p>Essayez un autre produit, vendeur ou univers.</p>
          <button type="button" onClick={() => { setQuery(''); setActiveCategory('Tout'); setFeedTab('for-you') }}>Afficher tout le fil</button>
        </div>
      )}

      <div className="feed-footer"><Icon name="sparkles" size={16} /> Vous êtes à jour dans votre fil.</div>
    </main>
  )
}
