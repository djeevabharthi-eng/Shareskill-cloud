import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  GraduationCap, 
  BookOpen, 
  Mail, 
  Users, 
  Sparkles,
  MessageSquare,
  Video,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  Award,
  Star,
  MapPin,
  RefreshCw,
  Camera,
  User as UserIcon
} from 'lucide-react';
import type { 
  UserProfile, 
  ExchangeRequest, 
  SkillExchangeSession, 
  RecommendedPartner, 
  ActivityItem 
} from '../types.ts';
import { Avatar } from './Avatar.tsx';

interface DashboardViewProps {
  user: UserProfile;
  requests: ExchangeRequest[];
  onNavigate: (tab: string) => void;
  onStartChat: (partnerId: string, partnerName?: string) => void;
  onStartVideoCall: (partnerId: string, partnerName: string) => void;
  onViewExchange: (exchangeId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  requests,
  onNavigate,
  onStartChat,
  onStartVideoCall,
  onViewExchange,
}) => {
  const firstName = user.name ? user.name.split(' ')[0] : 'Member';
  const teachCount = user.teachSkills.length;
  const learnCount = user.learnSkills.length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const [sessions, setSessions] = useState<SkillExchangeSession[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedPartner[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const [sessRes, recRes, actRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/recommendations'),
        fetch('/api/activities')
      ]);

      if (sessRes.ok) {
        const sessData = await sessRes.json();
        setSessions(sessData);
      }
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecommendations(recData);
      }
      if (actRes.ok) {
        const actData = await actRes.json();
        setActivities(actData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const activeSessions = sessions.filter(s => s.status !== 'Cancelled');

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'request_accepted':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'new_message':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'new_match':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'session_scheduled':
        return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'session_completed':
        return <Award className="w-4 h-4 text-indigo-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#11192e]/90 border border-[#1e2c4d] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* User Display Picture with quick edit badge */}
          <div
            onClick={() => onNavigate('profile')}
            title="Click to view & edit your profile display picture"
            className="relative group cursor-pointer shrink-0"
          >
            <Avatar
              src={user.avatarUrl}
              name={user.name}
              size="xl"
              shape="circle"
              className="ring-2 ring-purple-500/40 group-hover:ring-purple-400 transition-all shadow-md"
            />
            <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-purple-600 text-white shadow-md border-2 border-[#11192e] group-hover:scale-110 transition-transform">
              <Camera className="w-3 h-3" />
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {user.city ? `${user.city}, ${user.country}` : 'Global Member'} • {user.availability || 'Flexible availability'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            id="dash-edit-dp-btn"
            onClick={() => onNavigate('profile')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#17223b] hover:bg-[#1e2e50] text-slate-300 hover:text-white border border-[#23355b] text-xs font-semibold transition-all cursor-pointer"
          >
            <UserIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>Profile & DP</span>
          </button>
          <button
            id="dash-find-matches-btn"
            onClick={() => onNavigate('discover')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-purple-900/30 transition-transform active:scale-95 cursor-pointer"
          >
            <span>Find matches</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Metric Cards (2x2 grid) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 uppercase">
              Skills I teach
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {teachCount}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 uppercase">
              Skills I'm learning
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {learnCount}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 uppercase">
              Pending requests
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {pendingCount}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 uppercase">
              Active Exchanges
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {activeSessions.length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SECTION 1: Active Exchanges */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Active Exchanges</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/20">
                {activeSessions.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Accepted skill exchanges and ongoing collaboration sessions
            </p>
          </div>
        </div>

        {activeSessions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#11192e]/80 border border-[#1e2c4d] text-center space-y-3">
            <p className="text-xs sm:text-sm text-slate-400">
              No active exchanges yet. Accept an incoming request or discover partners to get started!
            </p>
            <button
              onClick={() => onNavigate('discover')}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
            >
              Explore Members
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] hover:border-purple-500/30 transition-all shadow-sm space-y-4"
              >
                {/* Header row: Skill Pairing & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      src={session.partnerAvatar}
                      name={session.partnerName}
                      size="md"
                      shape="circle"
                      className="ring-2 ring-purple-500/30 shrink-0"
                    />
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <span>{session.myTeachSkill}</span>
                        <span className="text-purple-400 font-normal">↔</span>
                        <span>{session.partnerTeachSkill}</span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Partner: <strong className="text-white">{session.partnerName}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-950/70 text-emerald-300 border border-emerald-800/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Status: {session.status === 'Completed' ? 'Completed' : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Session schedule info banner */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 bg-[#0b0f19] p-3 rounded-xl border border-[#1e2c4d]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>
                      Next Session: <strong className="text-white">{session.time || '7:00 PM'}</strong>
                      {session.date && <span className="text-slate-400 ml-1">({session.date})</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">•</span>
                    <span>Mode: <strong className="text-slate-200">{session.learningMode}</strong></span>
                  </div>

                  {session.feedback && (
                    <div className="flex items-center gap-1 text-amber-300">
                      <span className="text-slate-500">•</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{session.feedback.rating}/5 Rated</span>
                    </div>
                  )}
                </div>

                {/* Exact requested action buttons: [Message] [Video Call] [View Exchange] */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    id={`btn-dash-msg-${session.partnerId}`}
                    type="button"
                    onClick={() => onStartChat(session.partnerId, session.partnerName)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#17223b] hover:bg-[#1e2e50] text-slate-200 hover:text-white border border-[#23355b] text-xs font-semibold transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Message</span>
                  </button>

                  <button
                    id={`btn-dash-call-${session.partnerId}`}
                    type="button"
                    onClick={() => onStartVideoCall(session.partnerId, session.partnerName)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-950/30 transition-all cursor-pointer active:scale-95"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Call</span>
                  </button>

                  <button
                    id={`btn-dash-view-exchange-${session.exchangeId}`}
                    type="button"
                    onClick={() => onViewExchange(session.exchangeId || session.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all cursor-pointer ml-auto"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Exchange</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Recommended Skill Partners */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Recommended Skill Partners</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-600/20 text-purple-300 border border-purple-500/20">
                Live Matching
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Compatible members matched with your teaching and learning skills
            </p>
          </div>

          <button
            onClick={() => onNavigate('discover')}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
          >
            Explore all
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recommendations.slice(0, 4).map((rec) => {
            const partner = rec.member;
            const partnerInitial = partner.name ? partner.name.charAt(0).toUpperCase() : 'P';
            const isAcceptedExchange = sessions.some(s => s.partnerId === partner.id);

            return (
              <div
                key={partner.id}
                className="p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div>
                  {/* Top row: Avatar, Name, Compatibility score */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={partner.avatarUrl}
                        name={partner.name}
                        size="md"
                        shape="circle"
                        className="ring-1 ring-purple-500/30 shrink-0"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {partner.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                          <span>{partner.city}, {partner.country}</span>
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/50 whitespace-nowrap">
                      {rec.compatibilityScore}% Match
                    </span>
                  </div>

                  {/* Bio snippet */}
                  {partner.bio && (
                    <p className="text-xs text-slate-300 line-clamp-2 mt-2 italic">
                      "{partner.bio}"
                    </p>
                  )}

                  {/* Skills badges */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Teaches:</span>
                      {partner.teachSkills.map(s => (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-600/15 text-purple-300 border border-purple-500/20"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Learns:</span>
                      {partner.learnSkills.map(s => (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#142340] text-slate-300 border border-[#233860]"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Match reasons tags */}
                  {rec.matchReasons && rec.matchReasons.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {rec.matchReasons.slice(0, 2).map((reason, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/30 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-[#1e2c4d] flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {partner.availability || 'Flexible'}
                  </span>

                  {isAcceptedExchange ? (
                    <button
                      type="button"
                      onClick={() => onStartChat(partner.id, partner.name)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 text-xs font-semibold cursor-pointer"
                    >
                      Message
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigate('discover')}
                      className="px-3 py-1.5 rounded-xl bg-[#17223b] hover:bg-[#1e2e50] text-slate-200 hover:text-white border border-[#23355b] text-xs font-semibold cursor-pointer"
                    >
                      View Match
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Recent Activity</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600/20 text-blue-300 border border-blue-500/20">
                Live Feed
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Live updates from exchange requests, messages, matches, and scheduled sessions
            </p>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#11192e]/80 border border-[#1e2c4d] text-center text-xs text-slate-400">
            No activities recorded yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {activities.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#11192e]/80 border border-[#1e2c4d] hover:border-purple-500/30 transition-all flex items-start gap-3.5"
              >
                <div className="p-2 rounded-xl bg-[#0b0f19] border border-[#1e2c4d] shrink-0 mt-0.5">
                  {getActivityIcon(item.type)}
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-white">
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {item.timeAgo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: Your Skills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white">
            Your skills
          </h2>
          <button
            id="dash-manage-skills-btn"
            onClick={() => onNavigate('profile')}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
          >
            Manage
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {user.teachSkills.map((s) => (
            <div
              key={s.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/15 border border-purple-500/30 text-xs text-purple-200 font-medium"
            >
              <span className="text-purple-400 font-semibold">Teach •</span> {s.name}
            </div>
          ))}

          {user.learnSkills.map((s) => (
            <div
              key={s.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#142340] border border-[#233860] text-xs text-slate-300 font-medium"
            >
              <span className="text-indigo-400 font-semibold">Learn •</span> {s.name}
            </div>
          ))}

          {user.teachSkills.length === 0 && user.learnSkills.length === 0 && (
            <p className="text-xs text-slate-400">No skills listed yet. Click Manage to add.</p>
          )}
        </div>
      </div>
    </div>
  );
};
