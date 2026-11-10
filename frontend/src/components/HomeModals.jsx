import { Avatar, Icon, StarRating } from './common.jsx'
import { useState } from 'react'
import { currentUser } from '../data/demoData.js'
import { formatPrice } from '../utils/formatPrice.js'

const ORDER_STATUS = { pending: 'En cours', completed: 'Réalisée', cancelled: 'Annulée' }
const formatDate = (iso) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(iso))

function RatingForm({ order, submitRating }) {
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')

  return (
    <form
      className="rating-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (stars) submitRating(order.id, stars, comment)
      }}
    >
      <div className="rating-input" role="radiogroup" aria-label={`Noter ${order.sellerName}`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={stars === value}
            aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
            className={value <= stars ? 'is-on' : ''}
            onClick={() => setStars(value)}
          >
            <Icon name="star" size={22} filled={value <= stars} />
          </button>
        ))}
      </div>
      <input
        value={comment}
        maxLength={160}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Un mot sur ce vendeur (facultatif)"
        aria-label="Commentaire sur le vendeur"
      />
      <button className="button-primary" type="submit" disabled={!stars}>Noter le vendeur</button>
    </form>
  )
}

export default function HomeModals({ modal, setModal, productById, posts, followedSellers, toggleFollow, openMessages, startDemoPurchase, fileInputRef, updateDraftMedia, draftMedia, publishPost, publishProductId, setPublishProductId, setDraftError, products, draftError, profileTab, setProfileTab, demoPurchases, handleNavigation, orders = [], updateOrder, submitRating, getSellerRating }) {
  const [dashboardTab, setDashboardTab] = useState('pending')
  const myPurchases = orders.filter((order) => order.buyerId === currentUser.id)

  function renderProfileContent() {
    if (profileTab === 'achats') {
      return demoPurchases.length || myPurchases.length ? (
        <div className="profile-purchases">
          {myPurchases.map((order) => (
            <div className="order-row" key={order.id}>
              <div className="order-row-main">
                <span className="purchase-icon"><Icon name="bag" /></span>
                <span><strong>{order.productName}</strong><small>{order.sellerName} · {formatDate(order.createdAt)}</small></span>
                <span><strong>{formatPrice(order.price)}</strong><small className={`order-status is-${order.status}`}>{ORDER_STATUS[order.status]}</small></span>
              </div>
              {order.status === 'pending' && (
                <div className="order-actions">
                  <button className="button-primary" type="button" onClick={() => updateOrder(order.id, 'completed')}>Confirmer la réception</button>
                  <button className="order-secondary" type="button" onClick={() => updateOrder(order.id, 'cancelled')}>Annuler</button>
                </div>
              )}
              {order.status === 'completed' && (order.rating
                ? <div className="order-rated"><StarRating value={order.rating.stars} /><span>Merci pour votre avis.</span></div>
                : <RatingForm order={order} submitRating={submitRating} />)}
            </div>
          ))}
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
              <span><strong>{product.sellerName}</strong><small>{product.sellerHandle} · vendeur sur V</small>
                {getSellerRating?.(product.sellerId).count > 0 && <StarRating value={getSellerRating(product.sellerId).average} count={getSellerRating(product.sellerId).count} size={12} />}
              </span>
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

  if (modal.type === 'dashboard') {
    const sales = orders.filter((order) => order.sellerId === currentUser.id)
    const pending = sales.filter((order) => order.status === 'pending')
    const completed = sales.filter((order) => order.status === 'completed')
    const revenue = completed.reduce((sum, order) => sum + order.price, 0)
    const rating = getSellerRating(currentUser.id)
    const visible = dashboardTab === 'pending' ? pending : dashboardTab === 'completed' ? completed : sales.filter((order) => order.rating)
    const tabs = [['pending', 'En cours', pending.length], ['completed', 'Réalisées', completed.length], ['reviews', 'Avis', rating.count]]

    return (
      <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
        <section className="modal-card dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="dashboard-modal-title">
          <div className="modal-heading">
            <div><span className="modal-eyebrow">ESPACE VENDEUR</span><h2 id="dashboard-modal-title">Tableau de bord des ventes</h2></div>
            <button className="modal-close" type="button" aria-label="Fermer" onClick={() => setModal(null)}><Icon name="close" /></button>
          </div>
          <div className="dashboard-stats">
            <div><small>Commandes en cours</small><strong>{pending.length}</strong></div>
            <div><small>Commandes réalisées</small><strong>{completed.length}</strong></div>
            <div><small>Ventes réalisées</small><strong>{formatPrice(revenue)}</strong></div>
            <div><small>Ma note</small>{rating.count ? <strong><Icon name="star" size={16} filled /> {rating.average.toFixed(1)}<em> ({rating.count})</em></strong> : <strong>—</strong>}</div>
          </div>
          <div className="profile-tabs" role="tablist" aria-label="Commandes">
            {tabs.map(([value, label, count]) => (
              <button key={value} type="button" role="tab" aria-selected={dashboardTab === value} onClick={() => setDashboardTab(value)}>
                {label}<span className="profile-tab-count">{count}</span>
              </button>
            ))}
          </div>
          <div className="dashboard-list" role="tabpanel">
            {visible.length ? visible.map((order) => (
              <div className="order-row" key={order.id}>
                <div className="order-row-main">
                  <span className="purchase-icon"><Icon name={dashboardTab === 'reviews' ? 'star' : 'bag'} /></span>
                  <span><strong>{order.productName}</strong><small>Acheteur·se : {order.buyerName} · {formatDate(order.createdAt)}</small></span>
                  <span><strong>{formatPrice(order.price)}</strong><small className={`order-status is-${order.status}`}>{ORDER_STATUS[order.status]}</small></span>
                </div>
                {order.status === 'pending' && (
                  <div className="order-actions">
                    <button className="button-primary" type="button" onClick={() => updateOrder(order.id, 'completed')}>Marquer comme réalisée</button>
                    <button className="order-secondary" type="button" onClick={() => updateOrder(order.id, 'cancelled')}>Annuler</button>
                  </div>
                )}
                {order.rating && (
                  <div className="order-rated">
                    <StarRating value={order.rating.stars} />
                    {order.rating.comment && <span>« {order.rating.comment} »</span>}
                  </div>
                )}
              </div>
            )) : (
              <div className="profile-empty">
                <Icon name={dashboardTab === 'reviews' ? 'star' : 'bag'} size={25} />
                <strong>{dashboardTab === 'pending' ? 'Aucune commande en cours' : dashboardTab === 'completed' ? 'Aucune commande réalisée' : 'Aucun avis pour le moment'}</strong>
                <span>Les commandes confirmées dans les messages apparaissent ici.</span>
              </div>
            )}
          </div>
          <p className="demo-notice">Données de démonstration : aucun paiement ni livraison n’est géré.</p>
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
            <button className="profile-dashboard-link" type="button" onClick={() => handleNavigation('dashboard')}><Icon name="chart" size={16} /> Tableau de bord des ventes</button>
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
                {value === 'achats' && demoPurchases.length + myPurchases.length > 0 && <span className="profile-tab-count">{demoPurchases.length + myPurchases.length}</span>}
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
