import { useEffect, useMemo, useRef, useState } from 'react'
import './MessagingWidget.css'

function MessageIcon({ name, size = 20 }) {
  const paths = {
    message: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.4-.8L4 20l1.5-4A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11h8m-8 3h5" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    back: <><path d="m10 5-7 7 7 7" /><path d="M4 12h16" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    send: <><path d="m3 4 18 8-18 8 3-8-3-8Z" /><path d="M6 12h15" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function ContactAvatar({ contact }) {
  return (
    <span className="messaging-avatar">
      {contact.avatar ? <img src={contact.avatar} alt="" /> : contact.initials}
    </span>
  )
}

function MessagingWidget({ contacts, isOpen, onOpenChange, selectedId, onSelect, productContexts, products = [], onConfirmOrder }) {
  const [query, setQuery] = useState('')
  const [conversations, setConversations] = useState({})
  const [drafts, setDrafts] = useState({})
  const [orderForm, setOrderForm] = useState(null)
  const historyRef = useRef(null)
  const messageSequence = useRef(0)
  const selectedContact = contacts.find((contact) => contact.id === selectedId)
  const selectedMessages = conversations[selectedId] ?? []
  const draft = drafts[selectedId] ?? ''
  const contactProducts = products.filter((product) => product.sellerId === selectedId)
  const contextProduct = productContexts[selectedId]

  function openOrderForm() {
    const product = contactProducts.find((item) => item.id === contextProduct?.id) ?? contactProducts[0]
    setOrderForm({ contactId: selectedId, productId: product?.id ?? '', price: product ? String(product.price) : '', error: '' })
  }

  function changeOrderProduct(productId) {
    const product = contactProducts.find((item) => item.id === productId)
    setOrderForm((current) => ({ ...current, productId, price: product ? String(product.price) : current.price, error: '' }))
  }

  function submitOrder(event) {
    event.preventDefault()
    const product = contactProducts.find((item) => item.id === orderForm.productId)
    const price = Number(orderForm.price)
    if (!product) {
      setOrderForm((current) => ({ ...current, error: 'Choisissez le produit commandé.' }))
      return
    }
    if (!Number.isInteger(price) || price <= 0) {
      setOrderForm((current) => ({ ...current, error: 'Indiquez le prix final convenu (nombre entier supérieur à 0).' }))
      return
    }
    onConfirmOrder?.(product, price)
    messageSequence.current += 1
    const message = {
      sequence: messageSequence.current,
      kind: 'order',
      productName: product.name,
      price,
      time: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
    }
    setConversations((current) => ({
      ...current,
      [selectedContact.id]: [...(current[selectedContact.id] ?? []), message],
    }))
    setOrderForm(null)
  }

  const filteredContacts = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('fr')
    return contacts
      .filter((contact) =>
        `${contact.name} ${contact.shopName} ${contact.handle}`
          .toLocaleLowerCase('fr')
          .includes(search),
      )
      .slice()
      .sort((a, b) => {
        const aLast = conversations[a.id]?.at(-1)?.sequence ?? 0
        const bLast = conversations[b.id]?.at(-1)?.sequence ?? 0
        return bLast - aLast
      })
  }, [contacts, conversations, query])

  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight
  }, [isOpen, selectedId, selectedMessages.length])

  function sendMessage(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!selectedContact || !text) return

    messageSequence.current += 1
    const message = {
      sequence: messageSequence.current,
      text,
      time: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
    }
    setConversations((current) => ({
      ...current,
      [selectedContact.id]: [...(current[selectedContact.id] ?? []), message],
    }))
    setDrafts((current) => ({ ...current, [selectedContact.id]: '' }))
  }

  return (
    <aside className={`messaging-widget${isOpen ? ' is-open' : ''}`} aria-label="Messagerie de démonstration">
      <button
        className="messaging-bar"
        type="button"
        aria-expanded={isOpen}
        aria-controls="messaging-panel"
        onClick={() => onOpenChange(!isOpen)}
      >
        <span className="messaging-bar-icon"><MessageIcon name="message" size={19} /></span>
        <span className="messaging-bar-title">Messagerie <small>Démo</small></span>
        <span className="messaging-bar-action" aria-hidden="true">
          <MessageIcon name="chevron" size={19} />
        </span>
      </button>

      <div id="messaging-panel" className="messaging-panel" hidden={!isOpen}>
        <p className="messaging-demo-note">Démonstration : les messages restent dans ce navigateur jusqu’au rechargement et ne sont pas envoyés.</p>
        <div className={`messaging-content${selectedContact ? ' has-conversation' : ''}`}>
          <section className="messaging-contacts" aria-label="Contacts">
            <label className="messaging-search">
              <MessageIcon name="search" size={17} />
              <input
                type="search"
                aria-label="Rechercher un contact"
                placeholder="Rechercher un contact"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="messaging-list-heading">
              <strong>Vos contacts</strong><span>{filteredContacts.length}</span>
            </div>
            <div className="messaging-contact-list">
              {filteredContacts.length ? filteredContacts.map((contact) => {
                const latest = conversations[contact.id]?.at(-1)
                return (
                  <button
                    className={`messaging-contact${selectedId === contact.id ? ' is-selected' : ''}`}
                    type="button"
                    key={contact.id}
                    aria-current={selectedId === contact.id ? 'true' : undefined}
                    onClick={() => onSelect(contact.id)}
                  >
                    <ContactAvatar contact={contact} />
                    <span className="messaging-contact-info">
                      <strong>{contact.name}</strong>
                      <span>{latest ? (latest.kind === 'order' ? 'Commande confirmée' : `Vous : ${latest.text}`) : contact.shopName}</span>
                    </span>
                    {latest && <time className="messaging-contact-time">{latest.time}</time>}
                  </button>
                )
              }) : (
                <p className="messaging-no-contacts">Aucun contact trouvé. Essayez un autre nom.</p>
              )}
            </div>
          </section>

          <section className={`messaging-conversation${orderForm?.contactId === selectedId ? ' has-order-form' : ''}`} aria-label={selectedContact ? `Conversation avec ${selectedContact.name}` : 'Conversation'}>
            {selectedContact ? (
              <>
                <header className="messaging-conversation-header">
                  <button className="messaging-back" type="button" aria-label="Retour aux contacts" onClick={() => onSelect(null)}>
                    <MessageIcon name="back" size={19} />
                  </button>
                  <ContactAvatar contact={selectedContact} />
                  <span><strong>{selectedContact.name}</strong><small>{selectedContact.shopName} · {selectedContact.handle}</small></span>
                  <button className="messaging-close-conversation" type="button" aria-label="Fermer la conversation" onClick={() => onSelect(null)}>
                    <MessageIcon name="close" size={17} />
                  </button>
                </header>
                {contextProduct && (
                  <div className="messaging-product-context">
                    <MessageIcon name="bag" size={17} />
                    <span>À propos de <strong>{contextProduct.name}</strong></span>
                  </div>
                )}
                <div className="messaging-order-bar">
                  <button type="button" className="messaging-confirm-order" disabled={!contactProducts.length} onClick={openOrderForm}>
                    <MessageIcon name="check" size={16} /> Confirmer la commande
                  </button>
                  <small>Indiquez le prix final après discussion.</small>
                </div>
                {orderForm?.contactId === selectedContact.id && (
                  <form className="messaging-order-form" onSubmit={submitOrder}>
                    <label className="form-field">
                      <span>Produit</span>
                      <select value={orderForm.productId} onChange={(event) => changeOrderProduct(event.target.value)}>
                        {contactProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Prix final convenu (Ar)</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        value={orderForm.price}
                        onChange={(event) => setOrderForm((current) => ({ ...current, price: event.target.value, error: '' }))}
                        autoFocus
                      />
                    </label>
                    {orderForm.error && <p className="form-error" role="alert">{orderForm.error}</p>}
                    <p className="messaging-order-note">Démo : la commande est enregistrée sans paiement ni livraison.</p>
                    <div className="messaging-order-actions">
                      <button type="button" className="messaging-order-cancel" onClick={() => setOrderForm(null)}>Annuler</button>
                      <button type="submit" className="button-primary">Confirmer la commande</button>
                    </div>
                  </form>
                )}
                <div className="messaging-history" ref={historyRef} aria-live="polite">
                  {selectedMessages.length ? (
                    selectedMessages.map((message) => (
                      message.kind === 'order' ? (
                        <div className="messaging-order-card" key={message.sequence}>
                          <strong><MessageIcon name="check" size={15} /> Commande confirmée</strong>
                          <span>{message.productName}</span>
                          <span>Prix final : <b>{new Intl.NumberFormat('fr-FR').format(message.price)} Ar</b></span>
                          <time>{message.time} · En attente du vendeur · Démo</time>
                        </div>
                      ) : (
                        <div className="messaging-bubble-row" key={message.sequence}>
                          <div className="messaging-bubble">{message.text}</div>
                          <time>{message.time} · Démo</time>
                        </div>
                      )
                    ))
                  ) : (
                    <div className="messaging-empty-conversation">
                      <span><MessageIcon name="message" size={23} /></span>
                      <strong>Votre conversation commence ici</strong>
                      <p>Posez une question à {selectedContact.name} sur ses produits.</p>
                    </div>
                  )}
                </div>
                <form className="messaging-compose" onSubmit={sendMessage}>
                  <label className="visually-hidden" htmlFor="messaging-draft">Votre message à {selectedContact.name}</label>
                  <textarea
                    id="messaging-draft"
                    rows="2"
                    placeholder="Écrivez votre message…"
                    value={draft}
                    onChange={(event) => setDrafts((current) => ({ ...current, [selectedContact.id]: event.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                        event.preventDefault()
                        event.currentTarget.form?.requestSubmit()
                      }
                    }}
                  />
                  <div className="messaging-compose-actions">
                    <span>Entrée pour envoyer · Maj + Entrée pour une ligne</span>
                    <button type="submit" disabled={!draft.trim()}><MessageIcon name="send" size={15} /> Envoyer</button>
                  </div>
                </form>
              </>
            ) : (
              <div className="messaging-select-contact">
                <span><MessageIcon name="message" size={24} /></span>
                <strong>Vos échanges, au même endroit</strong>
                <p>Choisissez un contact pour commencer une conversation.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </aside>
  )
}

export default MessagingWidget
