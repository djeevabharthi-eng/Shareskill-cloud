import React, { useState } from 'react';
import { Sparkles, FileText, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import type { UserProfile, ResumeData } from '../types.ts';

interface ResumeViewProps {
  user: UserProfile;
}

export const ResumeView: React.FC<ResumeViewProps> = ({ user }) => {
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate resume');
      }
      setResumeData(data.resume);
    } catch (err: any) {
      setError(err.message || 'AI service unavailable');
    } finally {
      setLoading(false);
    }
  };

  const copyAsMarkdown = () => {
    if (!resumeData) return;
    const text = `# ${user.name} - Resume Outline
Target Role: ${resumeData.targetRole}
Location: ${user.city}, ${user.country}

## Executive Summary
${resumeData.summary}

## Core Competencies
${resumeData.coreCompetencies.map(c => `- ${c}`).join('\n')}

## Skills Taught & Mentored
${resumeData.skillsTaught.map(s => `- ${s}`).join('\n')}

## Skills Acquired
${resumeData.skillsLearned.map(s => `- ${s}`).join('\n')}

## Peer Verified Exchanges
${resumeData.completedExchanges.map(e => `- ${e}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8">
      {/* Header matching frame 01:17 */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <span>AI Resume Builder</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Built from your profile, skills, and completed exchanges.
        </p>
      </div>

      {/* Generator Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#11192e]/90 border border-[#1e2c4d] space-y-5">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Target role (optional)</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Frontend Engineer, UX Designer"
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            id="generate-resume-btn"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Building Resume...' : 'Generate resume'}</span>
          </button>
        </form>

        {error && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Output */}
        {resumeData && (
          <div className="pt-6 border-t border-[#1e2c4d] space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Generated Profile Resume
              </h3>
              <button
                onClick={copyAsMarkdown}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#18243e] hover:bg-[#203054] text-slate-200 border border-[#273a67] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-[#0e1424] border border-[#1d2b4b] space-y-5 text-xs text-slate-300">
              <div>
                <h2 className="text-lg font-bold text-white">{user.name}</h2>
                <p className="text-slate-400">{user.city}, {user.country}</p>
                <p className="text-purple-400 font-semibold mt-0.5">{resumeData.targetRole}</p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
                  Summary
                </h4>
                <p className="leading-relaxed text-slate-300">{resumeData.summary}</p>
              </div>

              {resumeData.coreCompetencies?.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
                    Core Competencies
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeData.coreCompetencies.map((c, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-[#16213a] text-slate-200 border border-[#23345c]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
                    Skills Taught / Mentored
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {resumeData.skillsTaught?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
                    Skills Acquired
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {resumeData.skillsLearned?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {resumeData.completedExchanges?.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
                    Verified Peer Exchanges
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {resumeData.completedExchanges.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
