import { useRef } from 'react'
import useHomePage from '../hooks/useHomePage.js'
import SiteHeader from '../components/SiteHeader.jsx'
import LeftSidebar from '../components/LeftSidebar.jsx'
import RightSidebar from '../components/RightSidebar.jsx'
import MobileNavigation from '../components/MobileNavigation.jsx'
import HomeModals from '../components/HomeModals.jsx'
import MessagingWidget from '../MessagingWidget.jsx'
import VideoInjection from '../VideoInjection.jsx'

export default function VideosPage({ navigate, path }) {
  const searchRef = useRef(null)
  const feedRef = useRef(null)
  const fileInputRef = useRef(null)
  const state = useHomePage({ searchRef, feedRef })

  return (
    <div className="app-shell">
      <SiteHeader
        handleNavigation={state.handleNavigation}
        searchRef={searchRef}
        query={state.query}
        setQuery={state.setQuery}
        navigate={navigate}
        activePath={path}
      />
      <div className="feed-layout" ref={feedRef}>
        <LeftSidebar
          posts={state.posts}
          followedSellers={state.followedSellers}
          handleNavigation={state.handleNavigation}
          feedTab={state.feedTab}
          setFeedTab={state.setFeedTab}
          activeCategory={state.activeCategory}
          setActiveCategory={state.setActiveCategory}
        />
        <main className="feed-column">
          <section className="feed-intro">
            <div className="feed-heading">
              <div><p>VIDÉOS DU BACKEND</p><h1>Reels et démonstrations</h1></div>
            </div>
            <p>Retrouvez ici les vidéos récupérées depuis l'API backend.</p>
          </section>
          <VideoInjection title="Vidéos backend" embedded mode="reels" />
        </main>
        <RightSidebar
          setQuery={state.setQuery}
          focusSearch={state.focusSearch}
          followedSellers={state.followedSellers}
          toggleFollow={state.toggleFollow}
          setFeedTab={state.setFeedTab}
        />
      </div>
      <MobileNavigation handleNavigation={state.handleNavigation} navigate={navigate} activePath={path} />
      <MessagingWidget
        contacts={state.messageContacts}
        isOpen={state.messagingOpen}
        onOpenChange={state.setMessagingOpen}
        selectedId={state.selectedContactId}
        onSelect={state.setSelectedContactId}
        productContexts={state.productContexts}
      />
      <HomeModals
        modal={state.modal}
        setModal={state.setModal}
        productById={state.productById}
        posts={state.posts}
        followedSellers={state.followedSellers}
        toggleFollow={state.toggleFollow}
        openMessages={state.openMessages}
        startDemoPurchase={state.startDemoPurchase}
        fileInputRef={fileInputRef}
        updateDraftMedia={state.updateDraftMedia}
        draftMedia={state.draftMedia}
        publishPost={state.publishPost}
        publishProductId={state.publishProductId}
        setPublishProductId={state.setPublishProductId}
        setDraftError={state.setDraftError}
        products={state.products}
        draftError={state.draftError}
        profileTab={state.profileTab}
        setProfileTab={state.setProfileTab}
        demoPurchases={state.demoPurchases}
        handleNavigation={state.handleNavigation}
      />
      <div className={`toast${state.toastMessage ? ' is-visible' : ''}`} role="status" aria-live="polite">
        {state.toastMessage}
      </div>
    </div>
  )
}
