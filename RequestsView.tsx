import React, { useState } from 'react';
import { MessageSquare, Check, CheckCircle2, Clock, XCircle, CheckSquare } from 'lucide-react';
import type { ExchangeRequest } from '../types.ts';
import { Avatar } from './Avatar.tsx';

interface RequestsViewProps {
  incoming: ExchangeRequest[];
  sent: ExchangeRequest[];
  onStartChat: (partnerId: string, partnerName: string) => void;
  onUpdateRequestStatus: (id: string, status: 'accepted' | 'completed' | 'declined') => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  incoming,
  sent,
  onStartChat,
  onUpdateRequestStatus
}) => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>('incoming');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleComplete = (id: string) => {
    onUpdateRequestStatus(id, 'completed');
    showToast('Request completed');
  };

  const handleAccept = (id: string) => {
    onUpdateRequestStatus(id, 'accepted');
    showToast('Request accepted');
  };

  const handleDecline = (id: string) => {
    onUpdateRequestStatus(id, 'declined');
    showToast('Request declined');
  };

  const currentList = activeTab === 'incoming' ? incoming : sent;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Toast notification banner (frame 00:59) */}
      {toastMessage && (
        <div className="p-3 sm:p-4 rounded-2xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-lg shadow-emerald-950/40 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Requests
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e2c4d] pb-2">
        <button
          id="requests-tab-incoming"
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'incoming'
              ? 'bg-[#18233c] text-white border border-purple-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Incoming ({incoming.length})
        </button>

        <button
          id="requests-tab-sent"
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'sent'
              ? 'bg-[#18233c] text-white border border-purple-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sent ({sent.length})
        </button>
      </div>

      {/* Requests List */}
      {currentList.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#11192e]/80 border border-[#1e2c4d] text-center space-y-2">
          <p className="text-sm font-semibold text-slate-300">Nothing here yet.</p>
          <p className="text-xs text-slate-400">
            {activeTab === 'incoming'
              ? 'When another member requests an exchange with you, it will appear here.'
              : 'Explore the community in Discover and send your first exchange proposal!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((req) => {
            const isCompleted = req.status === 'completed';
            const isAccepted = req.status === 'accepted';
            const isPending = req.status === 'pending';
            const isDeclined = req.status === 'declined';
            const otherUserName = activeTab === 'incoming' ? req.senderName : req.receiverName;
            const otherUserId = activeTab === 'incoming' ? req.senderId : req.receiverId;
            const otherUserAvatar = activeTab === 'incoming' ? req.senderAvatar : req.receiverAvatar;

            return (
              <div
                key={req.id}
                className="p-5 rounded-3xl bg-[#11192e]/90 border border-[#1e2c4d] space-y-3.5 hover:border-purple-500/30 transition-all"
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={otherUserAvatar}
                      name={otherUserName}
                      size="md"
                      shape="circle"
                      className="ring-1 ring-purple-500/30 shrink-0"
                    />
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                      {otherUserName}
                    </h3>
                  </div>

                  {/* Status pill badge */}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                      isCompleted
                        ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50'
                        : isAccepted
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                        : isPending
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                        : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {/* Skill exchange title */}
                <div className="text-xs sm:text-sm font-medium text-slate-200">
                  {req.skillOffered} ↔ {req.skillRequested}
                </div>

                {/* Message quote */}
                {req.message && (
                  <p className="text-xs text-slate-400 italic bg-[#152038] p-3 rounded-xl border border-[#1f2d4e]">
                    "{req.message}"
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => onStartChat(otherUserId, otherUserName)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#18243e] hover:bg-[#203054] text-xs font-semibold text-slate-200 border border-[#26375f] transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Chat</span>
                  </button>

                  {isAccepted && (
                    <button
                      onClick={() => handleComplete(req.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-xs font-semibold text-purple-200 border border-purple-500/40 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-purple-300" />
                      <span>Mark complete</span>
                    </button>
                  )}

                  {isPending && activeTab === 'incoming' && (
                    <>
                      <button
                        onClick={() => handleAccept(req.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-xs font-semibold text-emerald-200 border border-emerald-500/40 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleDecline(req.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-xs font-semibold text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
