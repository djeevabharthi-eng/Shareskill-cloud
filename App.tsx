import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { LandingView } from './components/LandingView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { DiscoverView } from './components/DiscoverView.tsx';
import { RequestsView } from './components/RequestsView.tsx';
import { MessagesView } from './components/MessagesView.tsx';
import { ProgressView } from './components/ProgressView.tsx';
import { ResumeView } from './components/ResumeView.tsx';
import { CareerView } from './components/CareerView.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { SkillExchangeDetailView } from './components/SkillExchangeDetailView.tsx';
import { VideoCallModal } from './components/VideoCallModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import type { UserProfile, ExchangeRequest } from './types.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [requests, setRequests] = useState<{ incoming: ExchangeRequest[]; sent: ExchangeRequest[] }>({
    incoming: [],
    sent: []
  });
  const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(null);
  const [selectedExchangeId, setSelectedExchangeId] = useState<string | null>(null);
  const [videoCallState, setVideoCallState] = useState<{
    isOpen: boolean;
    partnerId: string;
    partnerName: string;
  } | null>(null);

  // Initialize current user and requests
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUser(userData);
      }

      const reqRes = await fetch('/api/requests');
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData);
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  };

  const handleUpdateRequestStatus = async (id: string, status: 'accepted' | 'completed' | 'declined') => {
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setRequests((prev) => ({
          incoming: prev.incoming.map((r) => (r.id === id ? updated : r)),
          sent: prev.sent.map((r) => (r.id === id ? updated : r))
        }));
      }
    } catch (e) {
      console.error('Update request status error:', e);
    }
  };

  const handleStartChat = (partnerId: string, partnerName?: string) => {
    setActiveChatPartnerId(partnerId);
    setCurrentTab('messages');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartVideoCall = (partnerId: string, partnerName: string) => {
    setVideoCallState({
      isOpen: true,
      partnerId,
      partnerName
    });
  };

  const handleViewExchange = (exchangeId: string) => {
    setSelectedExchangeId(exchangeId);
    setCurrentTab('exchange-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestCreated = (newReq: ExchangeRequest) => {
    setRequests((prev) => ({
      ...prev,
      sent: [newReq, ...prev.sent]
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-[#f1f5f9] font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'messages') {
            setActiveChatPartnerId(null);
          }
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isLoggedIn={Boolean(currentUser)}
        userName={currentUser?.name}
        onGoHome={() => setCurrentTab('landing')}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentTab === 'landing' && (
          <LandingView
            onGetStarted={() => {
              setCurrentTab('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentUser && (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                user={currentUser}
                requests={[...requests.incoming, ...requests.sent]}
                onNavigate={(tab) => {
                  setCurrentTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onStartChat={handleStartChat}
                onStartVideoCall={handleStartVideoCall}
                onViewExchange={handleViewExchange}
              />
            )}

            {currentTab === 'exchange-detail' && (
              <SkillExchangeDetailView
                currentUser={currentUser}
                exchangeId={selectedExchangeId || 'req-arun'}
                onBack={() => {
                  setCurrentTab('dashboard');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onStartChat={handleStartChat}
                onStartVideoCall={handleStartVideoCall}
              />
            )}

            {currentTab === 'discover' && (
              <DiscoverView
                currentUser={currentUser}
                onStartChat={handleStartChat}
                onRequestCreated={handleRequestCreated}
              />
            )}

            {currentTab === 'requests' && (
              <RequestsView
                incoming={requests.incoming}
                sent={requests.sent}
                onStartChat={handleStartChat}
                onUpdateRequestStatus={handleUpdateRequestStatus}
              />
            )}

            {currentTab === 'messages' && (
              <MessagesView
                currentUser={currentUser}
                initialPartnerId={activeChatPartnerId}
                onClearActivePartner={() => setActiveChatPartnerId(null)}
                onNavigate={(tab) => {
                  setCurrentTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentTab === 'progress' && <ProgressView />}

            {currentTab === 'resume' && <ResumeView user={currentUser} />}

            {currentTab === 'career' && <CareerView user={currentUser} />}

            {currentTab === 'profile' && (
              <ProfileView
                user={currentUser}
                onUpdateProfile={(updated) => setCurrentUser(updated)}
              />
            )}
          </>
        )}
      </main>

      {/* Footer matching reference */}
      <Footer
        onNavigate={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentTab('dashboard');
        }}
      />

      {/* Video Call Modal */}
      {videoCallState?.isOpen && currentUser && (
        <VideoCallModal
          isOpen={videoCallState.isOpen}
          onClose={() => setVideoCallState(null)}
          partnerId={videoCallState.partnerId}
          partnerName={videoCallState.partnerName}
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
}
