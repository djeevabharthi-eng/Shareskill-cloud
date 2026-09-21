import React, { useState } from 'react';
import { Sparkles, MapPin, CheckCircle2, Clock, FolderGit2, AlertCircle } from 'lucide-react';
import type { UserProfile, CareerPlan } from '../types.ts';

interface CareerViewProps {
  user: UserProfile;
}

export const CareerView: React.FC<CareerViewProps> = ({ user }) => {
  const [careerGoal, setCareerGoal] = useState('');
  const [horizonMonths, setHorizonMonths] = useState('12');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<CareerPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!careerGoal.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/career-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careerGoal: careerGoal.trim(),
          horizonMonths: Number(horizonMonths) || 12
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate plan');
      }
      setPlan(data.plan);
    } catch (err: any) {
      setError(err.message || 'AI service unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8">
      {/* Header matching frame 01:21 */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <span>AI Career Advisor</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Tell us where you want to go — we map the path from your current skills.
        </p>
      </div>

      {/* Form Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#11192e]/90 border border-[#1e2c4d] space-y-5">
        <form onSubmit={handleGetPlan} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Your career goal</label>
            <input
              type="text"
              required
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              placeholder="e.g. Become a senior full-stack engineer at a product company"
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Horizon (months)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={horizonMonths}
              onChange={(e) => setHorizonMonths(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            id="career-get-plan-btn"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Mapping Career Path...' : 'Get my plan'}</span>
          </button>
        </form>

        {error && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Generated Roadmap Output */}
        {plan && (
          <div className="pt-6 border-t border-[#1e2c4d] space-y-6 animate-fadeIn">
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                Roadmap for {plan.horizonMonths} Months
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                {plan.goal}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed bg-[#141d33] p-4 rounded-2xl border border-[#213052]">
                {plan.summary}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Milestones & Skill Acquisition
              </h4>

              <div className="space-y-3">
                {plan.milestones?.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-[#141e36] border border-[#223359] space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-800/40">
                          {m.phase}
                        </span>
                        <h5 className="text-sm font-bold text-white">{m.title}</h5>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {m.duration}
                      </span>
                    </div>

                    {m.skillsToAcquire?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-400">
                          Skills to master / barter for:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.skillsToAcquire.map((s, i) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-0.5 rounded-lg bg-purple-600/15 text-purple-300 border border-purple-500/30"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.recommendedProjects?.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                          Recommended Proof Projects:
                        </span>
                        <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                          {m.recommendedProjects.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
