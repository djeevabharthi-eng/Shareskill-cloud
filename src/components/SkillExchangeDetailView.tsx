import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Video, 
  MessageSquare, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Sparkles, 
  User, 
  MapPin, 
  Mail, 
  Laptop, 
  Users, 
  RefreshCw, 
  Check, 
  X,
  Edit3,
  CalendarCheck
} from 'lucide-react';
import type { 
  UserProfile, 
  SkillExchangeSession, 
  SessionStatus, 
  SessionFeedback 
} from '../types.ts';

interface SkillExchangeDetailViewProps {
  currentUser: UserProfile;
  exchangeId: string;
  onBack: () => void;
  onStartChat: (partnerId: string, partnerName?: string) => void;
  onStartVideoCall: (partnerId: string, partnerName: string) => void;
}

export const SkillExchangeDetailView: React.FC<SkillExchangeDetailViewProps> = ({
  currentUser,
  exchangeId,
  onBack,
  onStartChat,
  onStartVideoCall
}) => {
  const [session, setSession] = useState<SkillExchangeSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notes state
  const [notesText, setNotesText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveMessage, setNotesSaveMessage] = useState<string | null>(null);

  // Schedule modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'Online' | 'In person'>('Online');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Feedback state
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    fetchSessionData();
  }, [exchangeId]);

  const fetchSessionData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${encodeURIComponent(exchangeId)}`);
      if (!res.ok) {
        throw new Error('Failed to load skill exchange session');
      }
      const data: SkillExchangeSession = await res.json();
      setSession(data);
      setNotesText(data.notes || '');
      setScheduleDate(data.date || new Date().toISOString().split('T')[0]);
      setScheduleTime(data.time || '07:00 PM');
      setScheduleMode(data.learningMode || 'Online');
      if (data.feedback) {
        setRating(data.feedback.rating);
        setFeedbackText(data.feedback.feedbackText);
      }
    } catch (err: any) {
      console.error('Session load error:', err);
      setError(err?.message || 'Could not load session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: SessionStatus) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setSession(updated);
      }
    } catch (err) {
      console.error('Status change error:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!session) return;
    setIsSavingNotes(true);
    setNotesSaveMessage(null);
    try {
      const res = await fetch(`/api/sessions/${session.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesText })
      });
      if (res.ok) {
        const data = await res.json();
        setSession(prev => prev ? { ...prev, notes: data.notes, notesUpdatedAt: data.notesUpdatedAt } : null);
        setNotesSaveMessage('Notes saved successfully');
        setTimeout(() => setNotesSaveMessage(null), 3000);
      }
    } catch (err) {
      console.error('Save notes error:', err);
      setNotesSaveMessage('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setIsSavingSchedule(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: scheduleDate,
          time: scheduleTime,
          learningMode: scheduleMode,
          status: 'Scheduled'
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setSession(updated);
        setIsScheduleModalOpen(false);
      }
    } catch (err) {
      console.error('Schedule session error:', err);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setIsSubmittingFeedback(true);
    setFeedbackSuccess(false);
    try {
      const res = await fetch(`/api/sessions/${session.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          feedbackText
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setFeedbackSuccess(true);
        setTimeout(() => setFeedbackSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Submit feedback error:', err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading Skill Exchange Session details...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          {error || 'Session not found'}
        </div>
      </div>
    );
  }

  const partnerInitial = session.partnerName ? session.partnerName.charAt(0).toUpperCase() : 'P';
  const isCompleted = session.status === 'Completed';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-dashboard"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#11192e] border border-[#1e2c4d] text-xs font-semibold text-slate-300 hover:text-white hover:border-purple-500/30 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Status:</span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
              session.status === 'Completed'
                ? 'bg-purple-950/70 text-purple-300 border border-purple-800/50'
                : session.status === 'In Progress'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 animate-pulse'
                : session.status === 'Cancelled'
                ? 'bg-rose-950/70 text-rose-300 border border-rose-800/50'
                : 'bg-blue-950/70 text-blue-300 border border-blue-800/50'
            }`}
          >
            {session.status}
          </span>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="p-6 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-600/20 text-purple-300 border border-purple-500/30">
                Active Skill Exchange
              </span>
              <span className="text-xs text-slate-400">• Mode: {session.learningMode}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{session.myTeachSkill}</span>
              <span className="text-purple-400 font-normal">↔</span>
              <span>{session.partnerTeachSkill}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Skill Exchange partnership with <strong className="text-slate-200">{session.partnerName}</strong>
            </p>
          </div>

          {/* Action Buttons: Message, Start Video Call, Schedule Session */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-exchange-message"
              type="button"
              onClick={() => onStartChat(session.partnerId, session.partnerName)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17223b] hover:bg-[#1e2e50] text-slate-200 hover:text-white border border-[#23355b] text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span>Message</span>
            </button>

            <button
              id="btn-exchange-video-call"
              type="button"
              onClick={() => onStartVideoCall(session.partnerId, session.partnerName)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-950/40 transition-all cursor-pointer active:scale-95"
            >
              <Video className="w-4 h-4" />
              <span>Start Video Call</span>
            </button>

            <button
              id="btn-exchange-schedule"
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Schedule Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Exchange Pairing & Partner Profile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: My Teaching Skill & Partner Teaching Skill */}
        <div className="p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Skills Exchanged
          </h2>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/30 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-0.5">
                  My Teaching Skill
                </span>
                <span className="text-sm font-bold text-white">{session.myTeachSkill}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-600/20 text-purple-300">
                You Teach
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/30 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-0.5">
                  Partner's Teaching Skill
                </span>
                <span className="text-sm font-bold text-white">{session.partnerTeachSkill}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-600/20 text-indigo-300">
                You Learn
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Partner Profile */}
        <div className="p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Partner Profile
          </h2>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-700 flex items-center justify-center font-bold text-white text-lg shadow-sm shrink-0">
              {partnerInitial}
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="text-base font-bold text-white">{session.partnerName}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>{session.partnerCity ? `${session.partnerCity}, ${session.partnerCountry || 'India'}` : 'Global Online'}</span>
              </p>
              {session.partnerBio && (
                <p className="text-xs text-slate-300 line-clamp-2 mt-1 italic">
                  "{session.partnerBio}"
                </p>
              )}
              {session.partnerAvailability && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Availability: <span className="text-slate-200">{session.partnerAvailability}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Session Details & Status Controller */}
      <div className="p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Session Details & Status
          </h2>
          <span className="text-[11px] text-slate-400">
            Update status to trigger real exchange progress
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-[#1e2c4d] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Session Date</span>
              <span className="text-xs sm:text-sm font-semibold text-white">{session.date || 'Not scheduled'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-[#1e2c4d] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Session Time</span>
              <span className="text-xs sm:text-sm font-semibold text-white">{session.time || '7:00 PM'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-[#1e2c4d] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Learning Mode</span>
              <span className="text-xs sm:text-sm font-semibold text-white">{session.learningMode}</span>
            </div>
          </div>
        </div>

        {/* Status Selection Buttons */}
        <div className="pt-2 border-t border-[#1e2c4d]">
          <span className="text-xs font-semibold text-slate-300 block mb-2">Change Session Status:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['Scheduled', 'In Progress', 'Completed', 'Cancelled'] as SessionStatus[]).map((st) => {
              const isCurrent = session.status === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                    isCurrent
                      ? st === 'Completed'
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/40'
                        : st === 'In Progress'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40'
                        : st === 'Cancelled'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/40'
                        : 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/40'
                      : 'bg-[#141e33] text-slate-300 border-[#1e2c4d] hover:border-purple-500/30 hover:text-white'
                  }`}
                >
                  {isCurrent && <Check className="w-3.5 h-3.5 inline mr-1" />}
                  <span>{st}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shared Session Notes Section */}
      <div className="p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Session Notes</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/20">
                Shared with {session.partnerName}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Both users can save notes, curriculum plans, links, and code snippets here.
            </p>
          </div>

          {session.notesUpdatedAt && (
            <span className="text-[11px] text-slate-400">
              Updated: {new Date(session.notesUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <textarea
          id="session-notes-input"
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
          placeholder="Type session agendas, learning milestones, practice questions, or meeting summaries..."
          rows={5}
          className="w-full p-4 rounded-xl bg-[#0b0f19] border border-[#1e2c4d] text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-y font-mono leading-relaxed"
        />

        <div className="flex items-center justify-between">
          <div>
            {notesSaveMessage && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {notesSaveMessage}
              </span>
            )}
          </div>
          <button
            id="btn-save-session-notes"
            type="button"
            onClick={handleSaveNotes}
            disabled={isSavingNotes}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition-all cursor-pointer"
          >
            {isSavingNotes ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Notes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback & Rating Section */}
      <div className="p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Session Feedback & Rating</span>
              {isCompleted && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
                  Ready for review
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Submit your experience and rating for this skill exchange session.
            </p>
          </div>
        </div>

        {session.feedback ? (
          <div className="p-4 rounded-xl bg-[#0b0f19] border border-[#1e2c4d] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= session.feedback!.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                ))}
                <span className="text-sm font-bold text-white ml-2">
                  {session.feedback.rating} / 5 Stars
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Submitted by {session.feedback.submittedByName}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 italic bg-[#11192e] p-3 rounded-lg border border-[#1e2c4d]">
              "{session.feedback.feedbackText || 'No comments provided.'}"
            </p>

            <div className="text-[11px] text-slate-400">
              Submitted on: {new Date(session.feedback.createdAt).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            {/* Interactive Star Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Your Rating:
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-semibold text-amber-300 ml-2">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            {/* Feedback text */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Feedback Comments:
              </label>
              <textarea
                id="session-feedback-input"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your thoughts on the session, teaching pace, communication, and key takeaways..."
                rows={3}
                required
                className="w-full p-3 rounded-xl bg-[#0b0f19] border border-[#1e2c4d] text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                {feedbackSuccess && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Feedback and rating saved in database!
                  </span>
                )}
              </div>
              <button
                id="btn-submit-feedback"
                type="submit"
                disabled={isSubmittingFeedback || !feedbackText.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition-all cursor-pointer"
              >
                {isSubmittingFeedback ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Submit Feedback & Rating</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Schedule Session Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#11192e] border border-[#1e2c4d] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Schedule Session</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Session Date:
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl bg-[#0b0f19] border border-[#1e2c4d] text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Session Time:
                </label>
                <input
                  type="text"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  placeholder="e.g. 7:00 PM or 18:30"
                  required
                  className="w-full p-2.5 rounded-xl bg-[#0b0f19] border border-[#1e2c4d] text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Learning Mode:
                </label>
                <select
                  value={scheduleMode}
                  onChange={(e) => setScheduleMode(e.target.value as 'Online' | 'In person')}
                  className="w-full p-2.5 rounded-xl bg-[#0b0f19] border border-[#1e2c4d] text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Online">Online (ShareSkillCloud WebRTC Video Call)</option>
                  <option value="In person">In person</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2c4d]">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSchedule}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30"
                >
                  {isSavingSchedule ? 'Saving...' : 'Save & Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
