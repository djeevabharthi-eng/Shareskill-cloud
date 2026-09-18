import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Plus, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Music, 
  FileText, 
  FileCheck, 
  Smile, 
  Check, 
  CheckCheck, 
  ArrowLeft, 
  Trash2, 
  Download, 
  ExternalLink, 
  X, 
  Search, 
  AlertCircle, 
  Loader2, 
  UploadCloud, 
  Sparkles,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import type { ChatMessage, UserProfile, ConversationItem, MessageMediaType } from '../types.ts';

interface MessagesViewProps {
  currentUser: UserProfile;
  initialPartnerId?: string | null;
  onNavigate: (tab: string) => void;
  onClearActivePartner?: () => void;
}

const COMMON_EMOJIS = [
  '👋', '👍', '❤️', '🔥', '🚀', '🎉', '😄', '🙌', 
  '💡', '📚', '👏', '🤝', '✨', '💻', '🎯', '⭐', 
  '💯', '📝', '☕', '🌟', '😊', '🙏', '🎓', '✅'
];

export const MessagesView: React.FC<MessagesViewProps> = ({
  currentUser,
  initialPartnerId,
  onNavigate,
  onClearActivePartner
}) => {
  // State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialPartnerId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  // Real file uploading state
  const [stagedAttachment, setStagedAttachment] = useState<{
    url: string;
    fileName: string;
    fileSize: number;
    mediaType: MessageMediaType;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Lightbox for image preview
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);

  // Message / Media deletion modal state
  const [deleteModal, setDeleteModal] = useState<{
    message: ChatMessage;
    target: 'all' | 'media-only';
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const acceptedFileTypesRef = useRef<string>('*/*');
  const eventSourceRef = useRef<EventSource | null>(null);

  // 1. Fetch Conversations list (Only accepted/completed skill exchanges)
  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data: ConversationItem[] = await res.json();
        setConversations(data);
        
        // If initialPartnerId is specified, ensure it's selected
        if (initialPartnerId) {
          const match = data.find(c => c.partnerId === initialPartnerId);
          if (match) {
            setActivePartnerId(match.partnerId);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [currentUser.id]);

  // Synchronize when initialPartnerId prop updates
  useEffect(() => {
    if (initialPartnerId) {
      setActivePartnerId(initialPartnerId);
    }
  }, [initialPartnerId]);

  // 2. Fetch Messages for active conversation
  const fetchActiveMessages = async (partnerId: string) => {
    try {
      setLoadingMessages(true);
      const res = await fetch(`/api/messages?partnerId=${encodeURIComponent(partnerId)}`);
      if (res.ok) {
        const data: ChatMessage[] = await res.json();
        setMessages(data);
        // Refresh conversation unread counter
        setConversations(prev => prev.map(c => 
          c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c
        ));
      } else if (res.status === 403) {
        const errData = await res.json();
        setUploadError(errData.error || 'You cannot communicate with this user.');
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activePartnerId) {
      fetchActiveMessages(activePartnerId);
    } else {
      setMessages([]);
    }
  }, [activePartnerId]);

  // 3. Real-Time Server-Sent Events (SSE) stream
  useEffect(() => {
    const url = `/api/messages/stream?userId=${encodeURIComponent(currentUser.id)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message' && data.message) {
          const newMsg: ChatMessage = data.message;
          
          // If message is in currently open conversation, append immediately
          setActivePartnerId((currPartner) => {
            if (
              (newMsg.senderId === currPartner && newMsg.receiverId === currentUser.id) ||
              (newMsg.senderId === currentUser.id && newMsg.receiverId === currPartner)
            ) {
              setMessages((prev) => {
                // Prevent duplicate appending
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            }
            return currPartner;
          });

          // Update conversation list item last message
          setConversations((prev) => {
            const partnerId = newMsg.senderId === currentUser.id ? newMsg.receiverId : newMsg.senderId;
            return prev.map((c) => {
              if (c.partnerId === partnerId) {
                const isIncoming = newMsg.senderId === partnerId;
                return {
                  ...c,
                  lastMessage: newMsg,
                  unreadCount: isIncoming && activePartnerId !== partnerId ? c.unreadCount + 1 : 0
                };
              }
              return c;
            });
          });
        }

        if (data.type === 'status_update' && data.messageIds) {
          setMessages((prev) =>
            prev.map((m) =>
              data.messageIds.includes(m.id) ? { ...m, status: data.status } : m
            )
          );
        }

        if (data.type === 'delete_message' && data.messageId) {
          setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
          fetchConversations();
        }

        if (data.type === 'update_message' && data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === data.message.id ? data.message : m))
          );
          fetchConversations();
        }
      } catch (e) {
        console.error('Error handling SSE message event:', e);
      }
    };

    es.onerror = () => {
      // Reconnect handled automatically by EventSource browser standard
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [currentUser.id, activePartnerId]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, stagedAttachment, isUploading]);

  // Active Partner Details
  const activeConversation = conversations.find(c => c.partnerId === activePartnerId);

  // 4. File Selection & Upload Handlers
  const handleOpenFileInput = (types: string) => {
    acceptedFileTypesRef.current = types;
    if (fileInputRef.current) {
      fileInputRef.current.accept = types;
      fileInputRef.current.click();
    }
    setShowAttachmentMenu(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input for next pick
    e.target.value = '';

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(15);

    try {
      const reader = new FileReader();
      reader.onprogress = (pe) => {
        if (pe.lengthComputable) {
          const percent = Math.round((pe.loaded / pe.total) * 70);
          setUploadProgress(percent);
        }
      };

      reader.onload = async () => {
        setUploadProgress(85);
        const base64Data = reader.result as string;

        // Post to server's real file storage
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name,
            fileType: file.type
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to upload file to storage');
        }

        const uploadedData = await res.json();
        setUploadProgress(100);
        setStagedAttachment({
          url: uploadedData.url,
          fileName: uploadedData.fileName,
          fileSize: uploadedData.fileSize,
          mediaType: uploadedData.mediaType
        });
        setIsUploading(false);
      };

      reader.onerror = () => {
        throw new Error('Failed to read file from your device.');
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(err.message || 'Error uploading file');
      setIsUploading(false);
    }
  };

  // 5. Send Message Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activePartnerId) return;

    const trimmed = inputText.trim();
    if (!trimmed && !stagedAttachment) return;

    const payload = {
      receiverId: activePartnerId,
      text: trimmed,
      mediaUrl: stagedAttachment?.url,
      mediaType: stagedAttachment?.mediaType,
      fileName: stagedAttachment?.fileName,
      fileSize: stagedAttachment?.fileSize
    };

    // Optimistic UI clear
    setInputText('');
    setStagedAttachment(null);
    setShowEmojiPicker(false);
    setUploadError(null);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        setUploadError(err.error || 'Failed to deliver message.');
      }
    } catch (err) {
      console.error('Send error:', err);
      setUploadError('Network error delivering message. Please try again.');
    }
  };

  // Delete individual message (and any attached media)
  const handleDeleteMessage = async (messageId: string) => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/messages/${encodeURIComponent(messageId)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete message');
      }
      setMessages(prev => prev.filter(m => m.id !== messageId));
      fetchConversations();
      setDeleteModal(null);
      if (previewImageSrc) {
        setPreviewImageSrc(null);
      }
    } catch (err: any) {
      console.error('Failed to delete message:', err);
      setUploadError(err.message || 'Error deleting message');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete media attachment only
  const handleDeleteMedia = async (messageId: string) => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/messages/${encodeURIComponent(messageId)}/media`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete media');
      }
      const data = await res.json();
      if (data.messageDeleted) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      } else if (data.message) {
        setMessages(prev => prev.map(m => m.id === messageId ? data.message : m));
      }
      fetchConversations();
      setDeleteModal(null);
      if (previewImageSrc) {
        setPreviewImageSrc(null);
      }
    } catch (err: any) {
      console.error('Failed to delete media:', err);
      setUploadError(err.message || 'Error deleting media');
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear / delete conversation messages
  const handleClearConversation = async () => {
    if (!activePartnerId) return;
    if (!window.confirm('Are you sure you want to clear this entire conversation? All messages and media files in this chat will be permanently deleted from storage.')) return;

    try {
      await fetch(`/api/messages?partnerId=${encodeURIComponent(activePartnerId)}`, {
        method: 'DELETE'
      });
      setMessages([]);
      fetchConversations();
    } catch (e) {
      console.error('Error clearing chat:', e);
    }
  };

  // Helper: Format file size
  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Filtered conversations
  const filteredConversations = conversations.filter(c => 
    c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.skillOffered.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.skillRequested.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 animate-fadeIn">
      {/* Hidden File Input for Device Files */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Card: Professional 2-column layout */}
      <div className="bg-[#0b101e] border border-[#1e2c4d] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[740px]">
        
        {/* =========================================================================
            LEFT COLUMN: Conversation List
           ========================================================================= */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-[#1a2642] flex flex-col bg-[#0d1426] ${
          activePartnerId ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-[#1a2642] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Messages</h2>
                  <p className="text-xs text-slate-400 font-medium">
                    {conversations.length} accepted {conversations.length === 1 ? 'exchange' : 'exchanges'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#141d33] border border-[#1f2d4e] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#16213b]/60">
            {loadingConversations ? (
              <div className="p-8 text-center space-y-3">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading your conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center space-y-4 my-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#141d33] border border-[#223357] flex items-center justify-center mx-auto text-slate-400">
                  <MessageSquare className="w-7 h-7 text-purple-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-200">No active conversations</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Only users with an accepted Skill Exchange can communicate. Accept an incoming request or propose a skill exchange to start messaging.
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => onNavigate('requests')}
                    className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition-all cursor-pointer"
                  >
                    View Skill Requests
                  </button>
                  <button
                    onClick={() => onNavigate('discover')}
                    className="w-full py-2 px-3 rounded-xl bg-[#16213b] hover:bg-[#1f2d4e] text-slate-300 text-xs font-medium border border-[#26375a] transition-all cursor-pointer"
                  >
                    Discover Members
                  </button>
                </div>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activePartnerId === conv.partnerId;
                const lastMsg = conv.lastMessage;
                
                let snippet = 'Conversation started';
                if (lastMsg) {
                  if (lastMsg.text) {
                    snippet = lastMsg.text;
                  } else if (lastMsg.mediaType === 'image') {
                    snippet = '📷 Photo';
                  } else if (lastMsg.mediaType === 'video') {
                    snippet = '🎥 Video';
                  } else if (lastMsg.mediaType === 'audio') {
                    snippet = '🎵 Audio file';
                  } else if (lastMsg.mediaType === 'pdf') {
                    snippet = '📄 PDF: ' + (lastMsg.fileName || 'Document');
                  } else {
                    snippet = '📎 ' + (lastMsg.fileName || 'Attachment');
                  }
                }

                return (
                  <button
                    key={conv.partnerId}
                    onClick={() => {
                      setActivePartnerId(conv.partnerId);
                      setUploadError(null);
                    }}
                    className={`w-full p-3.5 flex items-start gap-3 text-left transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-purple-950/40 border-l-4 border-purple-500' 
                        : 'hover:bg-[#121b30]'
                    }`}
                  >
                    {/* Avatar with status indicator */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                        {conv.partnerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0d1426]" />
                    </div>

                    {/* Partner & message preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {conv.partnerName}
                        </h3>
                        {lastMsg && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {lastMsg.createdAt}
                          </span>
                        )}
                      </div>

                      {/* Skill exchange pill */}
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#18233e] text-[10px] font-medium text-purple-300 border border-purple-500/20 truncate max-w-full mb-1">
                        <span>{conv.skillOffered}</span>
                        <span className="text-slate-400">↔</span>
                        <span>{conv.skillRequested}</span>
                      </div>

                      {/* Last message text */}
                      <p className="text-xs text-slate-400 truncate">
                        {snippet}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {conv.unreadCount > 0 && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold shadow">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Selected Conversation
           ========================================================================= */}
        <div className={`flex-1 flex flex-col bg-[#0b101e] relative ${
          !activePartnerId ? 'hidden md:flex' : 'flex'
        }`}>
          {activePartnerId && activeConversation ? (
            <>
              {/* Selected Conversation Top Bar */}
              <div className="px-4 sm:px-6 py-3.5 bg-[#10172b] border-b border-[#1b2744] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Mobile Back to List Button */}
                  <button
                    onClick={() => {
                      setActivePartnerId(null);
                      if (onClearActivePartner) onClearActivePartner();
                    }}
                    className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1a2642] transition-colors cursor-pointer"
                    title="Back to conversation list"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {/* Partner Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow">
                      {activeConversation.partnerName.charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#10172b]" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {activeConversation.partnerName}
                      </h3>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Online
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Accepted Exchange:</span>
                      <span className="text-purple-300 font-medium">
                        {activeConversation.skillOffered} ↔ {activeConversation.skillRequested}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Clear conversation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearConversation}
                    title="Clear conversation messages"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-[#1c2847] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Error banner if any */}
              {uploadError && (
                <div className="px-4 py-2 bg-rose-950/80 border-b border-rose-800 text-rose-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                  <button onClick={() => setUploadError(null)} className="text-rose-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Messages Scroll Area */}
              <div 
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
              >
                {/* Beginning of conversation info */}
                <div className="p-4 rounded-2xl bg-[#11192e] border border-[#1d2b4b] text-center space-y-2 max-w-md mx-auto my-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white">
                    Verified Skill Exchange Channel
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    You and {activeConversation.partnerName} have an accepted skill exchange. Messages and uploaded files are saved permanently in real-time.
                  </p>
                </div>

                {loadingMessages ? (
                  <div className="py-12 text-center">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Loading message history...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <p className="text-sm font-medium text-slate-300">No messages yet</p>
                    <p className="text-xs text-slate-500">
                      Say hello to {activeConversation.partnerName} and arrange your first session!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;

                    return (
                      <div
                        key={msg.id}
                        className={`group relative flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Partner Avatar for incoming */}
                        {!isMe && (
                          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 mb-1">
                            {msg.senderName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Delete message button (visible on hover on desktop, always accessible on mobile) */}
                        <div className={`opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 self-center ${
                          isMe ? 'order-first' : 'order-last'
                        }`}>
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ message: msg, target: 'all' })}
                            title={msg.mediaUrl ? "Delete message & media options" : "Delete message"}
                            className="p-1.5 rounded-xl bg-[#131b31] hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 border border-[#202e50] hover:border-rose-500/40 transition-all cursor-pointer shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 sm:p-3.5 shadow-md ${
                          isMe
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs'
                            : 'bg-[#151e36] text-slate-100 border border-[#223153] rounded-bl-xs'
                        }`}>
                          {/* Sender name for partner */}
                          {!isMe && (
                            <p className="text-[11px] font-semibold text-purple-300 mb-1">
                              {msg.senderName}
                            </p>
                          )}

                          {/* 1. Image Preview with dedicated Delete Media option */}
                          {msg.mediaType === 'image' && msg.mediaUrl && (
                            <div className="relative mb-2 rounded-xl overflow-hidden group/media border border-white/10">
                              <img
                                src={msg.mediaUrl}
                                alt={msg.fileName || 'Attached image'}
                                onClick={() => setPreviewImageSrc(msg.mediaUrl!)}
                                className="max-h-72 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                loading="lazy"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteModal({ message: msg, target: 'media-only' });
                                }}
                                title="Delete image only"
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/75 hover:bg-rose-600 text-white/90 hover:text-white transition-all backdrop-blur-xs border border-white/20 shadow-md cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* 2. Video Player with dedicated Delete Media option */}
                          {msg.mediaType === 'video' && msg.mediaUrl && (
                            <div className="relative mb-2 rounded-xl overflow-hidden group/media">
                              <video
                                controls
                                playsInline
                                preload="metadata"
                                src={msg.mediaUrl}
                                className="rounded-xl w-full max-h-72 bg-black border border-white/10 shadow"
                              />
                              <button
                                type="button"
                                onClick={() => setDeleteModal({ message: msg, target: 'media-only' })}
                                title="Delete video only"
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/75 hover:bg-rose-600 text-white/90 hover:text-white transition-all backdrop-blur-xs border border-white/20 shadow-md cursor-pointer z-10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* 3. Audio Player with dedicated Delete Media option */}
                          {msg.mediaType === 'audio' && msg.mediaUrl && (
                            <div className="mb-2 p-2.5 rounded-xl bg-black/20 border border-white/10">
                              <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-slate-200">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Music className="w-4 h-4 text-purple-300 shrink-0" />
                                  <span className="font-medium truncate">{msg.fileName || 'Audio message'}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setDeleteModal({ message: msg, target: 'media-only' })}
                                  title="Delete audio only"
                                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <audio
                                controls
                                src={msg.mediaUrl}
                                className="w-full h-10 accent-purple-500"
                              />
                            </div>
                          )}

                          {/* 4. PDF File Card with dedicated Delete Media option */}
                          {msg.mediaType === 'pdf' && msg.mediaUrl && (
                            <div className="mb-2 p-3 rounded-xl bg-[#0e1424] border border-[#26375c] flex items-center justify-between gap-3 shadow-inner">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-white truncate">
                                    {msg.fileName || 'Document.pdf'}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    PDF Document {msg.fileSize ? `• ${formatBytes(msg.fileSize)}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white transition-all cursor-pointer"
                                  title="Open PDF"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setDeleteModal({ message: msg, target: 'media-only' })}
                                  title="Delete PDF file only"
                                  className="p-2 rounded-lg bg-rose-600/15 hover:bg-rose-600 text-rose-300 hover:text-white transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 5. Generic Document File Card with dedicated Delete Media option */}
                          {msg.mediaType === 'document' && msg.mediaUrl && (
                            <div className="mb-2 p-3 rounded-xl bg-[#0e1424] border border-[#26375c] flex items-center justify-between gap-3 shadow-inner">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                                  <FileCheck className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-white truncate">
                                    {msg.fileName || 'Attached file'}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    File {msg.fileSize ? `• ${formatBytes(msg.fileSize)}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={msg.mediaUrl}
                                  download={msg.fileName || true}
                                  className="p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white transition-all cursor-pointer"
                                  title="Download File"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setDeleteModal({ message: msg, target: 'media-only' })}
                                  title="Delete file only"
                                  className="p-2 rounded-lg bg-rose-600/15 hover:bg-rose-600 text-rose-300 hover:text-white transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Text content with emoji */}
                          {msg.text && (
                            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed font-normal">
                              {msg.text}
                            </p>
                          )}

                          {/* Message Metadata: Timestamp and Read status */}
                          <div className={`flex items-center gap-1.5 mt-1 text-[10px] ${
                            isMe ? 'text-purple-200/80 justify-end' : 'text-slate-400 justify-start'
                          }`}>
                            <span>{msg.createdAt}</span>
                            {isMe && (
                              <span>
                                {msg.status === 'read' ? (
                                  <span className="flex items-center text-cyan-300" title="Read">
                                    <CheckCheck className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <span className="flex items-center text-slate-300" title="Delivered">
                                    <Check className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Staged attachment preview bar (before sending) */}
              {stagedAttachment && (
                <div className="px-4 py-2 bg-[#121a30] border-t border-[#1d2a4a] flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                      {stagedAttachment.mediaType === 'image' && <ImageIcon className="w-4 h-4" />}
                      {stagedAttachment.mediaType === 'video' && <VideoIcon className="w-4 h-4" />}
                      {stagedAttachment.mediaType === 'audio' && <Music className="w-4 h-4" />}
                      {stagedAttachment.mediaType === 'pdf' && <FileText className="w-4 h-4 text-rose-400" />}
                      {stagedAttachment.mediaType === 'document' && <FileCheck className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {stagedAttachment.fileName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Ready to send • {formatBytes(stagedAttachment.fileSize)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStagedAttachment(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Uploading progress indicator */}
              {isUploading && (
                <div className="px-4 py-2 bg-[#121a30] border-t border-[#1d2a4a] space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs text-purple-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <UploadCloud className="w-3.5 h-3.5 animate-bounce" />
                      Uploading media to secure storage...
                    </span>
                    <span className="font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Quick Emoji Picker popover */}
              {showEmojiPicker && (
                <div className="absolute bottom-20 left-4 right-4 sm:left-6 sm:right-auto sm:w-80 p-3 bg-[#11192e] border border-[#223356] rounded-2xl shadow-2xl z-30 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1b2844]">
                    <span className="text-xs font-semibold text-slate-300">Emojis</span>
                    <button
                      onClick={() => setShowEmojiPicker(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-8 gap-1.5 text-xl">
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setInputText((prev) => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="p-1.5 rounded-lg hover:bg-[#1a2542] hover:scale-125 transition-all text-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachment menu options popover */}
              {showAttachmentMenu && (
                <div className="absolute bottom-20 left-4 sm:left-6 w-56 p-2 bg-[#11192e] border border-[#223356] rounded-2xl shadow-2xl z-30 animate-fadeIn space-y-1">
                  <button
                    type="button"
                    onClick={() => handleOpenFileInput('image/*')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-[#1a2542] hover:text-white transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>Upload Image / Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenFileInput('video/*')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-[#1a2542] hover:text-white transition-colors cursor-pointer"
                  >
                    <VideoIcon className="w-4 h-4 text-purple-400" />
                    <span>Upload Video File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenFileInput('audio/*')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-[#1a2542] hover:text-white transition-colors cursor-pointer"
                  >
                    <Music className="w-4 h-4 text-cyan-400" />
                    <span>Upload Audio File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenFileInput('.pdf')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-[#1a2542] hover:text-white transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-rose-400" />
                    <span>Upload PDF Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenFileInput('.doc,.docx,.txt,.zip,.csv,.ppt,.pptx')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-[#1a2542] hover:text-white transition-colors cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4 text-blue-400" />
                    <span>Other Documents</span>
                  </button>
                </div>
              )}

              {/* Bottom Input Bar */}
              <form 
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 bg-[#10172b] border-t border-[#1b2744] flex items-center gap-2"
              >
                {/* [+] Attachment Button */}
                <button
                  type="button"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  title="Attach media or document"
                  className="w-10 h-10 rounded-2xl bg-[#16213b] hover:bg-[#1f2d4e] border border-[#243559] text-purple-400 hover:text-purple-300 flex items-center justify-center transition-colors cursor-pointer shrink-0 font-bold"
                >
                  <Plus className="w-5 h-5" />
                </button>

                {/* Emoji Picker toggle button */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Insert emoji"
                  className="w-10 h-10 rounded-2xl bg-[#16213b] hover:bg-[#1f2d4e] border border-[#243559] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message ${activeConversation.partnerName}...`}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-[#141d33] border border-[#1f2d4e] rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() && !stagedAttachment}
                  title="Send message"
                  className="w-10 h-10 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-900/30 transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            /* Empty selection state on the right */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-[#10172b] border border-[#1e2c4d] flex items-center justify-center text-purple-400 shadow-inner">
                <MessageSquare className="w-10 h-10 text-purple-400" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Select a conversation
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Choose an accepted Skill Exchange partner from the left to start sending messages, sharing files, and collaborating.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewImageSrc && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setPreviewImageSrc(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="text-xs text-slate-400 font-medium">Image Preview</span>
              <div className="flex items-center gap-3">
                {/* Delete button from Lightbox */}
                {(() => {
                  const targetMsg = messages.find(m => m.mediaUrl === previewImageSrc);
                  if (targetMsg) {
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ message: targetMsg, target: 'media-only' });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Delete this image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Image</span>
                      </button>
                    );
                  }
                  return null;
                })()}
                <button
                  onClick={() => setPreviewImageSrc(null)}
                  className="text-white hover:text-purple-400 transition-colors p-1"
                  title="Close preview"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <img
              src={previewImageSrc}
              alt="Enlarged preview"
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Message / Media Deletion Confirmation Modal */}
      {deleteModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => !isDeleting && setDeleteModal(null)}
        >
          <div 
            className="bg-[#10172b] border border-[#223356] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white">
                  {deleteModal.target === 'media-only' 
                    ? 'Delete Media Attachment' 
                    : deleteModal.message.mediaUrl && deleteModal.message.text
                      ? 'Delete Message / Media'
                      : deleteModal.message.mediaUrl
                        ? 'Delete Media Message'
                        : 'Delete Message'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {deleteModal.target === 'media-only'
                    ? 'This will permanently remove the uploaded file from storage and the chat. If this message has accompanying text, the text will remain.'
                    : deleteModal.message.mediaUrl && deleteModal.message.text
                      ? 'This message contains both text and an attached media file. Choose whether to remove the media file only or delete the entire message.'
                      : deleteModal.message.mediaUrl
                        ? 'This will permanently delete this message and remove the file from storage.'
                        : 'Are you sure you want to delete this message? It will be removed for both participants in this exchange.'}
                </p>
              </div>
            </div>

            {/* Preview of item being deleted */}
            <div className="p-3 rounded-xl bg-[#0b101f] border border-[#1b2744] space-y-2 text-xs">
              {deleteModal.message.mediaUrl && (
                <div className="flex items-center gap-2.5 text-purple-300">
                  <div className="w-7 h-7 rounded-lg bg-purple-900/40 border border-purple-500/30 flex items-center justify-center">
                    {deleteModal.message.mediaType === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                    {deleteModal.message.mediaType === 'video' && <VideoIcon className="w-3.5 h-3.5" />}
                    {deleteModal.message.mediaType === 'audio' && <Music className="w-3.5 h-3.5" />}
                    {deleteModal.message.mediaType === 'pdf' && <FileText className="w-3.5 h-3.5 text-rose-400" />}
                    {deleteModal.message.mediaType === 'document' && <FileCheck className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-200 truncate">
                      {deleteModal.message.fileName || `${deleteModal.message.mediaType?.toUpperCase()} attachment`}
                    </p>
                    {deleteModal.message.fileSize && (
                      <p className="text-[10px] text-slate-500">
                        {formatBytes(deleteModal.message.fileSize)}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {deleteModal.message.text && (
                <p className="text-slate-300 italic border-l-2 border-purple-500/40 pl-2 line-clamp-2">
                  "{deleteModal.message.text}"
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 rounded-xl bg-[#17223b] hover:bg-[#1f2d4e] text-slate-300 hover:text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              {/* If target is 'all' and message has both text and media: allow deleting media only */}
              {deleteModal.target === 'all' && deleteModal.message.mediaUrl && deleteModal.message.text && (
                <button
                  disabled={isDeleting}
                  onClick={() => handleDeleteMedia(deleteModal.message.id)}
                  className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete Media Only
                </button>
              )}

              {/* Primary action button */}
              {deleteModal.target === 'media-only' ? (
                <button
                  disabled={isDeleting}
                  onClick={() => handleDeleteMedia(deleteModal.message.id)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete Media
                </button>
              ) : (
                <button
                  disabled={isDeleting}
                  onClick={() => handleDeleteMessage(deleteModal.message.id)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete {deleteModal.message.mediaUrl ? 'Message & Media' : 'Message'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
