import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Sparkles, 
  MessageSquare, 
  UserPlus, 
  ArrowRight,
  ChevronDown,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import type { UserProfile, ExchangeRequest } from '../types.ts';
import { Avatar } from './Avatar.tsx';

interface DiscoverViewProps {
  currentUser: UserProfile;
  onStartChat: (partnerId: string, partnerName: string) => void;
  onRequestCreated: (newReq: ExchangeRequest) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  currentUser,
  onStartChat,
  onRequestCreated
}) => {
  // Match finder state
  const [skillWantToLearn, setSkillWantToLearn] = useState('Web development');
  const [skillCanTeach, setSkillCanTeach] = useState('Python basic');
  const [skillLevel, setSkillLevel] = useState('Intermediate');
  const [preferredAvailability, setPreferredAvailability] = useState('Flexible / anytime');
  const [onlineOrInPerson, setOnlineOrInPerson] = useState('Online');
  const [matches, setMatches] = useState<any[]>([]);
  const [hasSearchedMatches, setHasSearchedMatches] = useState(false);
  const [isSearchingMatches, setIsSearchingMatches] = useState(false);

  // AI Skill Match state
  const [aiSkillLearn, setAiSkillLearn] = useState('');
  const [aiGoal, setAiGoal] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Browse all members state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Profile modal & Request modal
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [requestTargetUser, setRequestTargetUser] = useState<UserProfile | null>(null);
  const [requestSkillOffer, setRequestSkillOffer] = useState('');
  const [requestSkillWanted, setRequestSkillWanted] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSending, setRequestSending] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [searchQuery, selectedCategory]);

  const fetchMembers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedCategory && selectedCategory !== 'All categories') {
        params.set('category', selectedCategory);
      }
      const res = await fetch(`/api/members?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (e) {
      console.error('Failed to load members:', e);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to delete member "${memberName}"? This will permanently remove their profile.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/members/${encodeURIComponent(memberId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        setMatches(prev => prev.filter(m => m.member.id !== memberId));
        if (selectedProfile?.id === memberId) {
          setSelectedProfile(null);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete member');
      }
    } catch (err) {
      console.error('Delete member error:', err);
    }
  };

  const handleFindMatches = async () => {
    setIsSearchingMatches(true);
    setHasSearchedMatches(true);
    try {
      const params = new URLSearchParams({
        learn: skillWantToLearn,
        teach: skillCanTeach,
        level: skillLevel,
        availability: preferredAvailability,
        mode: onlineOrInPerson
      });
      const res = await fetch(`/api/matches?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (e) {
      console.error('Find matches error:', e);
    } finally {
      setIsSearchingMatches(false);
    }
  };

  const handleAiSkillMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSkillLearn.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    try {
      const res = await fetch('/api/ai/skill-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillWanted: aiSkillLearn,
          goal: aiGoal
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to match mentors');
      }
      setAiResult(data);
    } catch (err: any) {
      setAiError(err.message || 'AI service unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenRequest = (target: UserProfile) => {
    setRequestTargetUser(target);
    setRequestSkillOffer(currentUser.teachSkills[0]?.name || '');
    setRequestSkillWanted(target.teachSkills[0]?.name || '');
    setRequestMessage('');
    setRequestSuccess(false);
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTargetUser) return;
    setRequestSending(true);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: requestTargetUser.id,
          skillOffered: requestSkillOffer,
          skillRequested: requestSkillWanted,
          message: requestMessage
        })
      });
      if (res.ok) {
        const newReq = await res.json();
        onRequestCreated(newReq);
        setRequestSuccess(true);
        setTimeout(() => {
          setRequestTargetUser(null);
          setRequestSuccess(false);
        }, 1500);
      }
    } catch (e) {
      console.error('Send request error:', e);
    } finally {
      setRequestSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Find matches
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Tell us what you want to swap and we'll rank real members by compatibility.
        </p>
      </div>

      {/* Match finder Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#11192e]/90 border border-[#1e2c4d] space-y-5">
        <div className="flex items-center gap-2.5 text-purple-400 font-semibold text-sm">
          <Users className="w-4 h-4" />
          <span>Match finder</span>
        </div>

        <div className="space-y-4">
          {/* Skill I want to learn */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Skill I want to learn</label>
            <input
              type="text"
              value={skillWantToLearn}
              onChange={(e) => setSkillWantToLearn(e.target.value)}
              placeholder="e.g. Python"
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            {currentUser.learnSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentUser.learnSkills.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSkillWantToLearn(s.name)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[#19243f] text-slate-300 border border-[#23355c] hover:border-purple-400 cursor-pointer"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Skill I can teach */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Skill I can teach</label>
            <input
              type="text"
              value={skillCanTeach}
              onChange={(e) => setSkillCanTeach(e.target.value)}
              placeholder="e.g. Graphic design"
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            {currentUser.teachSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentUser.teachSkills.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSkillCanTeach(s.name)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[#19243f] text-slate-300 border border-[#23355c] hover:border-purple-400 cursor-pointer"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Skill level wanted */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Skill level wanted</label>
            <div className="relative">
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Preferred availability */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Preferred availability</label>
            <div className="relative">
              <select
                value={preferredAvailability}
                onChange={(e) => setPreferredAvailability(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
              >
                <option value="Weekday mornings">Weekday mornings</option>
                <option value="Weekday evenings">Weekday evenings</option>
                <option value="Weekends">Weekends</option>
                <option value="Flexible / anytime">Flexible / anytime</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Online / In person */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Online / In person</label>
            <div className="relative">
              <select
                value={onlineOrInPerson}
                onChange={(e) => setOnlineOrInPerson(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
              >
                <option value="Online">Online</option>
                <option value="In person">In person</option>
                <option value="Either">Either</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Submit button */}
          <button
            id="match-finder-submit-btn"
            onClick={handleFindMatches}
            disabled={isSearchingMatches}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{isSearchingMatches ? 'Ranking members...' : 'Find matches'}</span>
          </button>
        </div>

        {/* Results of Match Finder */}
        {hasSearchedMatches && (
          <div className="pt-4 border-t border-[#1e2c4d] space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Compatibility Results ({matches.length})
            </h4>
            {matches.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                No matching members found with that criteria.
              </p>
            ) : (
              <div className="space-y-3">
                {matches.map(({ member, compatibilityScore, reciprocalMatch }) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-2xl bg-[#141e36] border border-[#223359] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={member.avatarUrl}
                        name={member.name}
                        size="md"
                        shape="circle"
                        className="ring-1 ring-purple-500/30 shrink-0 mt-0.5"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{member.name}</span>
                          {reciprocalMatch && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/40">
                              Mutual Match
                            </span>
                          )}
                          <span className="text-[11px] text-purple-400 font-semibold">
                            {compatibilityScore}% match
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMember(member.id, member.name);
                            }}
                            title={`Delete ${member.name}`}
                            className="ml-1 p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400">
                          Teaches: {member.teachSkills.map((s: any) => s.name).join(', ') || 'None listed'}
                        </p>
                        <p className="text-xs text-slate-400">
                          Wants to learn: {member.learnSkills.map((s: any) => s.name).join(', ') || 'None listed'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => setSelectedProfile(member)}
                        className="px-3 py-1.5 rounded-xl bg-[#1b2745] hover:bg-[#23335a] text-xs text-slate-200 border border-[#273a67]"
                      >
                        View profile
                      </button>
                      <button
                        onClick={() => handleOpenRequest(member)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs text-white font-medium"
                      >
                        Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Skill Match Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#11192e]/90 border border-[#1e2c4d] space-y-4">
        <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>AI Skill Match</span>
        </div>
        <p className="text-xs text-slate-400">
          Let AI recommend the best mentors from the community based on your goal.
        </p>

        <form onSubmit={handleAiSkillMatch} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Skill you want to learn</label>
            <input
              type="text"
              required
              value={aiSkillLearn}
              onChange={(e) => setAiSkillLearn(e.target.value)}
              placeholder="e.g. Web development"
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Your goal (optional)</label>
            <input
              type="text"
              value={aiGoal}
              onChange={(e) => setAiGoal(e.target.value)}
              placeholder="e.g. Build a portfolio project for frontend internships"
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={aiLoading}
            id="ai-skill-match-btn"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{aiLoading ? 'AI Analyzing Mentors...' : 'Find mentors'}</span>
          </button>
        </form>

        {aiError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{aiError}</span>
          </div>
        )}

        {aiResult && (
          <div className="pt-3 border-t border-[#1e2c4d] space-y-3 animate-fadeIn">
            {aiResult.advice && (
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200">
                <span className="font-semibold text-purple-300">AI Advice: </span>
                {aiResult.advice}
              </div>
            )}

            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-200">Recommended Mentors:</h5>
              {aiResult.recommendations?.length > 0 ? (
                aiResult.recommendations.map((rec: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#141e36] border border-[#223359] text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{rec.memberName}</span>
                      <span className="text-[11px] font-semibold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                        {rec.matchScore}% Match
                      </span>
                    </div>
                    <p className="text-slate-300">{rec.rationale}</p>
                    {rec.suggestedStartingTopic && (
                      <p className="text-slate-400 text-[11px]">
                        <span className="text-slate-400 font-semibold">Suggested topic:</span> {rec.suggestedStartingTopic}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No matching mentors available in the community right now.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Browse all members Section */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Browse all members
        </h2>

        {/* Search & Category filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, city, or skill"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
            >
              <option value="All categories">All categories</option>
              <option value="Programming">Programming</option>
              <option value="Design">Design</option>
              <option value="Language">Language</option>
              <option value="Music">Music</option>
              <option value="Other">Other</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
          </div>
        </div>

        {/* Member cards list */}
        {loadingMembers ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#11192e]/80 border border-[#1e2c4d] text-center text-xs text-slate-400">
            No members available matching this search.
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => {
              const initial = member.name ? member.name.charAt(0).toUpperCase() : 'M';
              return (
                <div
                  key={member.id}
                  className="p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] space-y-4 hover:border-purple-500/30 transition-all"
                >
                  {/* Member header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={member.avatarUrl}
                        name={member.name}
                        size="md"
                        shape="circle"
                        className="ring-1 ring-purple-500/30 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{member.name}</h3>
                        </div>
                        <p className="text-xs text-slate-400">
                          {member.city ? `${member.city} , ${member.country}` : 'Global'}
                        </p>
                      </div>
                    </div>

                    {/* Delete button right near the name */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMember(member.id, member.name);
                      }}
                      title={`Delete ${member.name}`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>

                  {/* Skills taught */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      TEACHES
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {member.teachSkills.length > 0 ? (
                        member.teachSkills.map((s) => (
                          <span
                            key={s.id}
                            className="px-2.5 py-0.5 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-medium"
                          >
                            {s.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-xs">None listed</span>
                      )}
                    </div>
                  </div>

                  {/* Skills wants to learn */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      WANTS TO LEARN
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {member.learnSkills.length > 0 ? (
                        member.learnSkills.map((s) => (
                          <span
                            key={s.id}
                            className="px-2.5 py-0.5 rounded-lg bg-[#142340] text-indigo-300 border border-[#233860] text-xs font-medium"
                          >
                            {s.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-xs">None listed</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => setSelectedProfile(member)}
                      className="w-full py-2.5 rounded-xl bg-[#16213a] hover:bg-[#1f2e52] text-slate-200 border border-[#233359] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      View profile
                    </button>
                    <button
                      onClick={() => onStartChat(member.id, member.name)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Profile Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-[#0f1629] border border-[#213052] space-y-5">
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2540]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <Avatar
                src={selectedProfile.avatarUrl}
                name={selectedProfile.name}
                size="lg"
                shape="circle"
                className="ring-2 ring-purple-500/40 shrink-0"
              />
              <div>
                <h3 className="text-base font-bold text-white">{selectedProfile.name}</h3>
                <p className="text-xs text-slate-400">
                  {selectedProfile.city ? `${selectedProfile.city} , ${selectedProfile.country}` : 'Global'}
                </p>
              </div>
            </div>

            {selectedProfile.bio && (
              <p className="text-xs text-slate-300 leading-relaxed bg-[#141e36] p-3 rounded-xl border border-[#1e2e4f]">
                {selectedProfile.bio}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Teaches</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedProfile.teachSkills.length > 0 ? (
                    selectedProfile.teachSkills.map(s => (
                      <span key={s.id} className="text-xs px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30">
                        {s.name} ({s.level || 'Intermediate'})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">None listed</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Wants to learn</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedProfile.learnSkills.length > 0 ? (
                    selectedProfile.learnSkills.map(s => (
                      <span key={s.id} className="text-xs px-2.5 py-1 rounded-lg bg-[#142340] text-indigo-300 border border-[#233860]">
                        {s.name} ({s.level || 'Beginner'})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">None listed</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedProfile(null);
                  handleOpenRequest(selectedProfile);
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
              >
                Request exchange
              </button>
              <button
                onClick={() => {
                  setSelectedProfile(null);
                  onStartChat(selectedProfile.id, selectedProfile.name);
                }}
                className="w-full py-2.5 rounded-xl bg-[#16213a] hover:bg-[#1f2e52] text-slate-200 border border-[#233359] text-xs font-semibold transition-colors"
              >
                Send message
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteMember(selectedProfile.id, selectedProfile.name);
                }}
                className="w-full py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete member</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Request Modal */}
      {requestTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-[#0f1629] border border-[#213052] space-y-5">
            <button
              onClick={() => setRequestTargetUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2540]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <Avatar
                src={requestTargetUser.avatarUrl}
                name={requestTargetUser.name}
                size="md"
                shape="circle"
                className="ring-1 ring-purple-500/40 shrink-0"
              />
              <div>
                <h3 className="text-base font-bold text-white">
                  Propose Exchange with {requestTargetUser.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Suggest what you'll teach and what you want to learn in return.
                </p>
              </div>
            </div>

            {requestSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold">Request sent successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Skill I will teach</label>
                  <input
                    type="text"
                    required
                    value={requestSkillOffer}
                    onChange={(e) => setRequestSkillOffer(e.target.value)}
                    placeholder="e.g. Python basic"
                    className="w-full px-4 py-2 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Skill I want to learn</label>
                  <input
                    type="text"
                    required
                    value={requestSkillWanted}
                    onChange={(e) => setRequestSkillWanted(e.target.value)}
                    placeholder="e.g. Web development"
                    className="w-full px-4 py-2 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Message</label>
                  <textarea
                    rows={3}
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Hi, would love to exchange skills with you!"
                    className="w-full px-4 py-2 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={requestSending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {requestSending ? 'Sending proposal...' : 'Send Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
