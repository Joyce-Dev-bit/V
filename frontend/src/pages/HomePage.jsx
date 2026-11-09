import { useRef } from 'react'
import useHomePage from '../hooks/useHomePage.js'
import SiteHeader from '../components/SiteHeader.jsx'
import LeftSidebar from '../components/LeftSidebar.jsx'
import Feed from '../components/Feed.jsx'
import RightSidebar from '../components/RightSidebar.jsx'
import MobileNavigation from '../components/MobileNavigation.jsx'
import HomeModals from '../components/HomeModals.jsx'
import MessagingWidget from '../MessagingWidget.jsx'

export default function HomePage() {
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
        <Feed
          handleNavigation={state.handleNavigation}
          feedTab={state.feedTab}
          setFeedTab={state.setFeedTab}
          filteredPosts={state.filteredPosts}
          setQuery={state.setQuery}
          setActiveCategory={state.setActiveCategory}
          productById={state.productById}
          likedPosts={state.likedPosts}
          followedSellers={state.followedSellers}
          expandedComments={state.expandedComments}
          setExpandedComments={state.setExpandedComments}
          commentDrafts={state.commentDrafts}
          setCommentDrafts={state.setCommentDrafts}
          showToast={state.showToast}
          toggleLike={state.toggleLike}
          toggleFollow={state.toggleFollow}
          sharePost={state.sharePost}
          addComment={state.addComment}
          openProduct={state.openProduct}
        />
        <RightSidebar
          setQuery={state.setQuery}
          focusSearch={state.focusSearch}
          followedSellers={state.followedSellers}
          toggleFollow={state.toggleFollow}
          setFeedTab={state.setFeedTab}
        />
      </div>
      <MobileNavigation handleNavigation={state.handleNavigation} />
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
