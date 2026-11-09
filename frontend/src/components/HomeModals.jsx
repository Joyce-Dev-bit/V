import { Avatar, Icon } from './common.jsx'
import { currentUser } from '../data/demoData.js'
import { formatPrice } from '../utils/formatPrice.js'

export default function HomeModals({ modal, setModal, productById, posts, followedSellers, toggleFollow, openMessages, startDemoPurchase, fileInputRef, updateDraftMedia, draftMedia, publishPost, publishProductId, setPublishProductId, setDraftError, products, draftError, profileTab, setProfileTab, demoPurchases, handleNavigation }) {
  function renderProfileContent() {
    if (profileTab === 'achats') {
      return demoPurchases.length ? (
        <div className="profile-purchases">
          {demoPurchases.map((purchase) => (
            <div className="purchase-row" key={purchase.productId}>
              <span className="purchase-icon"><Icon name="bag" /></span>
              <span><strong>{purchase.productName}</strong><small>{purchase.sellerName}</small></span>
              <span><strong>{formatPrice(purchase.price)}</strong><small>{purchase.status}</small></span>
            </div>
          ))}
          <p className="demo-notice">Historique de démonstration : aucun paiement ni envoi n’a eu lieu.</p>
        </div>
      ) : (
        <div className="profile-empty">
          <Icon name="bag" size={25} />
          <strong>Vos achats apparaîtront ici</strong>
          <span>Pour l’instant, vous n’avez aucun achat de démonstration.</span>
        </div>
      )
    }

    const profilePosts = posts.filter((post) =>
      profileTab === 'produits'
        ? productById.get(post.productId)?.sellerId === currentUser.id
        : post.sellerId === currentUser.id,
    )
    return profilePosts.length ? (
      <div className="profile-post-grid">
        {profilePosts.map((post) => (
          <button
            className="profile-post-tile"
            type="button"
            key={post.id}
            onClick={() => setModal({ type: 'product', productId: post.productId })}
          >
            {post.mediaType === 'video' ? (
              <video src={post.media} poster={post.poster} muted playsInline preload="none" />
            ) : (
              <img src={post.media} alt={post.alt} />
            )}
            <span className="tile-product-name">{productById.get(post.productId)?.name}</span>
          </button>
        ))}
      </div>
    ) : (
      <div className="profile-empty">
        <Icon name={profileTab === 'produits' ? 'bag' : 'image'} size={25} />
        <strong>Aucune publication pour le moment</strong>
        <span>Vous pourrez publier ici et proposer un article avec le même compte.</span>
        <button
          className="button-primary"
          type="button"
          onClick={() => handleNavigation('create')}
        >
          Publier / Vendre
        </button>
      </div>
    )
  }

  if (!modal) return null

  if (modal.type === 'product') {
    const product = productById.get(modal.productId)
    if (!product) return null
    const productPosts = posts.filter((post) => post.productId === product.id)
    const sellerPost = productPosts[0]
    return (
      <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
        <section className="modal-card product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
          <button className="modal-close" type="button" aria-label="Fermer" onClick={() => setModal(null)}><Icon name="close" /></button>
          <div className="product-modal-media">
            {productPosts.map((post) => (
              <div className="product-gallery-item" key={post.id}>
                {post.mediaType === 'video' ? (
                  <video src={post.media} poster={post.poster} controls playsInline preload="metadata" />
                ) : (
                  <img src={post.media} alt={post.alt} />
                )}
                <span>{post.mediaType === 'video' ? 'Vidéo' : 'Photo'} · publication de {post.sellerName}</span>
              </div>
            ))}
          </div>
          <div className="product-modal-info">
            <span className="modal-eyebrow">FICHE PRODUIT · UNE SEULE OFFRE</span>
            <h2 id="product-modal-title">{product.name}</h2>
            <div className="modal-seller">
              <Avatar src={sellerPost?.avatar} initials={sellerPost?.initials ?? 'V'} size="small" />
              <span><strong>{product.sellerName}</strong><small>{product.sellerHandle} · vendeur sur V</small></span>
              <button
                type="button"
                className={`follow-button${followedSellers.includes(product.sellerId) ? ' is-following' : ''}`}
                aria-pressed={followedSellers.includes(product.sellerId)}
                onClick={() => toggleFollow(product.sellerId, product.sellerName)}
              >
                {followedSellers.includes(product.sellerId) ? 'Abonné·e' : 'Suivre'}
              </button>
            </div>
            <p className="product-modal-price">{formatPrice(product.price)}</p>
            <p className="product-availability">
              <span className={product.stock > 0 ? 'stock-dot' : 'stock-dot is-out'} />
              {product.stock > 0
                ? `${product.stock} article${product.stock > 1 ? 's' : ''} disponible${product.stock > 1 ? 's' : ''}`
                : 'Actuellement indisponible'}
            </p>
            <p className="shared-listing-note">
              Toutes les photos et vidéos de cet article renvoient à cette même fiche et partagent le même prix et le même stock.
            </p>
            {product.sellerId !== currentUser.id && (
              <button
                className="contact-seller-button"
                type="button"
                onClick={() => openMessages(product)}
              >
                <Icon name="message" size={18} /> Échanger avec le vendeur
              </button>
            )}
            <button
              className="buy-demo-button"
              type="button"
              disabled={product.stock === 0}
              onClick={() => startDemoPurchase(product)}
            >
              <Icon name="bag" size={18} /> Simuler un achat
            </button>
            <p className="payment-disclaimer">Démo uniquement · aucun paiement ni livraison n’est effectué.</p>
          </div>
        </section>
      </div>
    )
  }

  if (modal.type === 'create') {
    return (
      <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
        <section className="modal-card create-modal" role="dialog" aria-modal="true" aria-labelledby="create-modal-title">
          <div className="modal-heading">
            <div><span className="modal-eyebrow">ACHETEZ ET VENDEZ AVEC LE MÊME COMPTE</span><h2 id="create-modal-title">Créer une publication</h2></div>
            <button className="modal-close" type="button" aria-label="Fermer" onClick={() => setModal(null)}><Icon name="close" /></button>
          </div>
          <form onSubmit={publishPost}>
            <input
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              accept="image/*,video/*"
              onChange={(event) => updateDraftMedia(event.target.files?.[0])}
            />
            <button className={`upload-zone${draftMedia ? ' has-media' : ''}`} type="button" onClick={() => fileInputRef.current?.click()}>
              {draftMedia?.type === 'video' ? (
                <video src={draftMedia.preview} muted playsInline />
              ) : draftMedia?.type === 'image' ? (
                <img src={draftMedia.preview} alt="Aperçu de la publication" />
              ) : (
                <><span className="upload-icon"><Icon name="image" size={25} /></span><strong>Ajouter une photo ou une courte vidéo</strong><small>Choisissez un média pour présenter votre article.</small></>
              )}
              {draftMedia && <span className="change-media">Changer le média</span>}
            </button>
            <label className="form-field">
              <span>Votre description</span>
              <textarea name="description" rows="3" placeholder="Racontez ce qui rend votre article unique…" required />
            </label>
            <label className="form-field">
              <span>Article associé</span>
              <select
                name="existingProductId"
                value={publishProductId}
                onChange={(event) => {
                  setPublishProductId(event.target.value)
                  setDraftError('')
                }}
              >
                <option value="">Créer une nouvelle fiche produit</option>
                {products
                  .filter((product) => product.sellerId === currentUser.id)
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} · {formatPrice(product.price)}
                    </option>
                  ))}
              </select>
            </label>
            {publishProductId ? (
              <p className="reused-product-note">
                Cette publication sera reliée à la fiche produit existante. Son prix et sa disponibilité resteront identiques sur toutes ses photos et vidéos.
              </p>
            ) : (
              <div className="form-row">
                <label className="form-field">
                  <span>Nom du produit</span>
                  <input name="productName" placeholder="Ex. Panier tressé" required />
                </label>
                <label className="form-field">
                  <span>Prix (Ar)</span>
                  <input name="price" type="number" min="1" step="1" inputMode="numeric" placeholder="Ex. 25000" required />
                </label>
              </div>
            )}
            {draftError && <p className="form-error" role="alert">{draftError}</p>}
            <div className="create-disclaimer"><Icon name="sparkles" size={17} /> Publication de démonstration visible pendant cette session uniquement.</div>
            <button className="button-primary submit-publication" type="submit">Publier sur V <span aria-hidden="true">→</span></button>
          </form>
        </section>
      </div>
    )
  }

  if (modal.type === 'profile') {
    return (
      <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
        <section className="modal-card profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
          <div className="modal-heading">
            <div><span className="modal-eyebrow">UN COMPTE, TOUTES VOS ACTIVITÉS</span><h2 id="profile-modal-title">Mon profil</h2></div>
            <button className="modal-close" type="button" aria-label="Fermer" onClick={() => setModal(null)}><Icon name="close" /></button>
          </div>
          <div className="profile-summary">
            <Avatar src={currentUser.avatar} initials={currentUser.initials} size="large" />
            <span><strong>{currentUser.name}</strong><small>{currentUser.handle} · acheteuse & vendeuse</small><small><Icon name="location" size={13} /> {currentUser.location}</small></span>
            <button className="button-primary profile-publish" type="button" onClick={() => handleNavigation('create')}><Icon name="plus" size={17} /> Publier / Vendre</button>
          </div>
          <div className="profile-tabs" role="tablist" aria-label="Activités du profil">
            {[['publications', 'Publications'], ['produits', 'En vente'], ['achats', 'Achats']].map(([value, label]) => (
              <button
                key={value}
                id={`profile-tab-${value}`}
                type="button"
                role="tab"
                aria-selected={profileTab === value}
                aria-controls="profile-tab-panel"
                onClick={() => setProfileTab(value)}
              >
                {label}
                {value === 'achats' && demoPurchases.length > 0 && <span className="profile-tab-count">{demoPurchases.length}</span>}
              </button>
            ))}
          </div>
          <div className="profile-tab-panel" id="profile-tab-panel" role="tabpanel" aria-labelledby={`profile-tab-${profileTab}`}>
            {renderProfileContent()}
          </div>
        </section>
      </div>
    )
  }

  if (modal.type === 'purchase') {
    const product = productById.get(modal.productId)
    return (
      <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
        <section className="modal-card purchase-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-modal-title">
          <button className="modal-close" type="button" aria-label="Fermer" onClick={() => setModal(null)}><Icon name="close" /></button>
          <span className="purchase-demo-icon"><Icon name="bag" size={27} /></span>
          <span className="modal-eyebrow">PARCOURS D’ACHAT DE DÉMONSTRATION</span>
          <h2 id="purchase-modal-title">Votre intérêt est noté !</h2>
          <p>{product?.name} · {product ? formatPrice(product.price) : ''}</p>
          <div className="demo-warning"><strong>Aucun paiement ni livraison n’a été effectué.</strong><span>Le paiement et la livraison ne sont pas encore configurés. Cette simulation apparaît dans l’onglet « Achats » de votre profil.</span></div>
          <button className="button-primary" type="button" onClick={() => { setProfileTab('achats'); setModal({ type: 'profile' }) }}>Voir mes achats de démonstration</button>
        </section>
      </div>
    )
  }

  return null
}
