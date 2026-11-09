import { Avatar, Icon } from './common.jsx'
import { currentUser } from '../data/demoData.js'
import { formatPrice } from '../utils/formatPrice.js'

function renderMedia(post, productById, openProduct, className = '') {
  if (post.mediaType === 'video') {
    return (
      <div className={`post-media post-video ${className}`}>
        <video
          src={post.media}
          poster={post.poster}
          controls
          playsInline
          preload="metadata"
          aria-label={`Vidéo produit : ${post.alt}`}
        />
        <span className="media-kind"><Icon name="play" size={13} /> Vidéo</span>
        <button
          className="video-product-link"
          type="button"
          onClick={() => openProduct(post.productId)}
        >
          Voir le produit
        </button>
      </div>
    )
  }

  return (
    <button
      className={`post-media post-image ${className}`}
      type="button"
      aria-label={`Voir la fiche produit : ${productById.get(post.productId)?.name ?? post.alt}`}
      onClick={() => openProduct(post.productId)}
    >
      <img src={post.media} alt={post.alt} loading="lazy" />
    </button>
  )
}

export default function PostCard({ post, productById, likedPosts, followedSellers, expandedComments, setExpandedComments, commentDrafts, setCommentDrafts, showToast, toggleLike, toggleFollow, sharePost, addComment, openProduct }) {
  const product = productById.get(post.productId)
  if (!product) return null
  const liked = likedPosts.includes(post.id)
  const following = followedSellers.includes(post.sellerId)
  const commentsOpen = expandedComments.includes(post.id)
  const postLikeCount = post.likes + (liked ? 1 : 0)

  return (
    <article className="post-card" id={post.id} key={post.id}>
      <div className="post-header">
        <div className="post-author">
          <button
            className="avatar-link"
            type="button"
            aria-label={`Voir le profil de ${post.sellerName}`}
            onClick={() => showToast(`Profil de ${post.sellerName} — démonstration.`)}
          >
            <Avatar src={post.avatar} initials={post.initials} />
          </button>
          <div className="author-details">
            <button
              className="author-name"
              type="button"
              onClick={() => showToast(`Profil de ${post.sellerName} — démonstration.`)}
            >
              {post.sellerName} <span className="verified-mark"><Icon name="check" size={11} /></span>
            </button>
            <span>{post.shopName} · {post.location}</span>
          </div>
        </div>
        {post.sellerId !== currentUser.id && (
          <button
            className={`follow-button${following ? ' is-following' : ''}`}
            type="button"
            aria-pressed={following}
            onClick={() => toggleFollow(post.sellerId, post.shopName)}
          >
            {following ? 'Abonné·e' : 'Suivre'}
          </button>
        )}
      </div>

      <p className="post-caption">{post.caption}</p>
      {renderMedia(post, productById, openProduct)}

      <div className="post-reactions">
        <button
          className={`reaction-button like-button${liked ? ' is-liked' : ''}`}
          type="button"
          aria-label={liked ? 'Ne plus aimer cette publication' : 'Aimer cette publication'}
          aria-pressed={liked}
          onClick={() => toggleLike(post.id)}
        >
          <Icon name="heart" size={19} filled={liked} />
          <span>{postLikeCount}</span>
        </button>
        <button
          className="reaction-button"
          type="button"
          aria-label={`Afficher les commentaires (${post.comments.length})`}
          aria-expanded={commentsOpen}
          onClick={() =>
            setExpandedComments((current) =>
              current.includes(post.id)
                ? current.filter((id) => id !== post.id)
                : [...current, post.id],
            )
          }
        >
          <Icon name="comment" size={19} />
          <span>{post.comments.length}</span>
        </button>
        <button
          className="reaction-button share-button"
          type="button"
          onClick={() => sharePost(post)}
        >
          <Icon name="share" size={18} />
          <span>Partager</span>
        </button>
      </div>

      {commentsOpen && (
        <div className="comments-panel">
          {post.comments.length > 0 ? (
            post.comments.map((comment, index) => (
              <p className="comment" key={`${post.id}-${index}`}>
                <strong>{comment.author}</strong> {comment.text}
              </p>
            ))
          ) : (
            <p className="comments-empty">Soyez la première personne à commenter.</p>
          )}
          <form className="comment-form" onSubmit={(event) => addComment(post.id, event)}>
            <Avatar src={currentUser.avatar} initials={currentUser.initials} size="tiny" />
            <input
              aria-label={`Écrire un commentaire sur ${post.shopName}`}
              placeholder="Écrire un commentaire…"
              value={commentDrafts[post.id] ?? ''}
              onChange={(event) =>
                setCommentDrafts((current) => ({
                  ...current,
                  [post.id]: event.target.value,
                }))
              }
            />
            <button type="submit" disabled={!commentDrafts[post.id]?.trim()}>Publier</button>
          </form>
        </div>
      )}

      <button
        className="product-attachment"
        type="button"
        onClick={() => openProduct(product.id)}
      >
        <span className={`attachment-thumb attachment-${product.category.toLowerCase().replace('é', 'e')}`}>
          {post.mediaType === 'video' && <span className="thumb-play"><Icon name="play" size={12} /></span>}
          <img src={post.mediaType === 'video' ? post.poster : post.media} alt="" loading="lazy" />
        </span>
        <span className="attachment-details">
          <span className="attachment-label">PRODUIT DE LA PUBLICATION</span>
          <strong>{product.name}</strong>
          <span>{product.stock > 0 ? `${product.stock} disponible${product.stock > 1 ? 's' : ''}` : 'Indisponible'}</span>
        </span>
        <span className="attachment-buy">
          <strong>{formatPrice(product.price)}</strong>
          <span>Voir le produit <span aria-hidden="true">→</span></span>
        </span>
      </button>
    </article>
  )
}
