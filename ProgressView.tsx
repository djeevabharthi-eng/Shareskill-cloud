import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Trophy, 
  Calendar, 
  Target, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2 
} from 'lucide-react';
import type { UserProgress, LearningGoal } from '../types.ts';

export const ProgressView: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress>({
    currentStreak: 0,
    longestStreak: 0,
    minutesThisWeek: 0,
    weeklyTarget: 120,
    goals: [],
    logs: []
  });

  const [logMinutes, setLogMinutes] = useState('30');
  const [logging, setLogging] = useState(false);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);

  // New Goal Form
  const [goalSkill, setGoalSkill] = useState('');
  const [goalTargetLevel, setGoalTargetLevel] = useState('intermediate');
  const [goalSteps, setGoalSteps] = useState('10');
  const [goalWeeklyMinutes, setGoalWeeklyMinutes] = useState('120');
  const [addingGoal, setAddingGoal] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const res = await fetch('/api/progress');
      if (res.ok) {
        const data: UserProgress = await res.json();
        setProgress(data);
        const today = new Date().toISOString().split('T')[0];
        const logged = data.logs.some(l => l.date === today);
        setHasLoggedToday(logged);
      }
    } catch (e) {
      console.error('Fetch progress error:', e);
    }
  };

  const handleLogToday = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true);
    try {
      const res = await fetch('/api/progress/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: Number(logMinutes) || 30 })
      });
      if (res.ok) {
        const data = await res.json();
        setProgress(data);
        setHasLoggedToday(true);
      }
    } catch (e) {
      console.error('Log today error:', e);
    } finally {
      setLogging(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalSkill.trim()) return;
    setAddingGoal(true);
    try {
      const res = await fetch('/api/progress/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: goalSkill.trim(),
          targetLevel: goalTargetLevel,
          steps: Number(goalSteps) || 10,
          weeklyMinutes: Number(goalWeeklyMinutes) || 120
        })
      });
      if (res.ok) {
        const data = await res.json();
        setProgress(data);
        setGoalSkill('');
      }
    } catch (e) {
      console.error('Add goal error:', e);
    } finally {
      setAddingGoal(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/progress/goals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setProgress(data);
      }
    } catch (e) {
      console.error('Delete goal error:', e);
    }
  };

  const weeklyProgressPercent = Math.min(
    100,
    Math.round((progress.minutesThisWeek / (progress.weeklyTarget || 120)) * 100)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8">
      {/* Header matching frame 01:09 */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Progress & Streak
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Log a little every day, and watch your goals and streak grow.
        </p>
      </div>

      {/* 4 Metric Cards (2x2 grid) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* CURRENT STREAK */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 uppercase">
              CURRENT STREAK
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {progress.currentStreak}d
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        {/* LONGEST STREAK */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 uppercase">
              LONGEST STREAK
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {progress.longestStreak}d
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        {/* MINUTES THIS WEEK */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 uppercase">
              MINUTES THIS WEEK
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {progress.minutesThisWeek}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* ACTIVE GOALS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 uppercase">
              ACTIVE GOALS
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {progress.goals.length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Target className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Today's learning Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#11192e]/90 border border-[#1e2c4d] space-y-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            Today's learning
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {hasLoggedToday ? 'Logged today! Keep up the momentum.' : 'Not logged yet today.'}
          </p>
        </div>

        {/* Minutes input & Log button */}
        <form onSubmit={handleLogToday} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-28 space-y-1">
              <label className="text-[11px] font-medium text-slate-400">Minutes</label>
              <input
                type="number"
                min="5"
                max="480"
                value={logMinutes}
                onChange={(e) => setLogMinutes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white font-semibold focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="pt-5">
              <button
                type="submit"
                disabled={logging}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-purple-900/30 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{logging ? 'Logging...' : 'Log today'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Weekly Target Progress bar */}
        <div className="space-y-1.5 pt-2 border-t border-[#1a2542]">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Weekly target</span>
            <span className="font-semibold text-purple-300">
              {progress.minutesThisWeek} / {progress.weeklyTarget} min
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#162035] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${weeklyProgressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* 17 Weeks Activity Grid (Frame 01:12) */}
        <div className="space-y-2 pt-2 border-t border-[#1a2542]">
          <span className="text-xs font-semibold text-slate-400">Last 17 weeks</span>
          <div className="overflow-x-auto pb-2">
            <div className="grid grid-flow-col grid-rows-7 gap-1 min-w-[320px]">
              {Array.from({ length: 17 * 7 }).map((_, i) => {
                // Determine shade based on active logs
                const isRecent = i > 17 * 7 - 5;
                const hasActivity = hasLoggedToday && i === 17 * 7 - 1;
                return (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-sm transition-colors ${
                      hasActivity
                        ? 'bg-purple-500 shadow-sm shadow-purple-500/50'
                        : isRecent
                        ? 'bg-[#1e2a47]'
                        : 'bg-[#151e33]'
                    }`}
                    title={`Day ${i + 1}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add a learning goal Section (Frame 01:13) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#11192e]/90 border border-[#1e2c4d] space-y-5">
        <h2 className="text-base sm:text-lg font-bold text-white">
          Add a learning goal
        </h2>

        <form onSubmit={handleAddGoal} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Skill</label>
            <input
              type="text"
              required
              value={goalSkill}
              onChange={(e) => setGoalSkill(e.target.value)}
              placeholder="e.g. Python"
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Target level</label>
            <select
              value={goalTargetLevel}
              onChange={(e) => setGoalTargetLevel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="beginner">beginner</option>
              <option value="intermediate">intermediate</option>
              <option value="advanced">advanced</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Steps</label>
            <input
              type="number"
              min="1"
              max="100"
              value={goalSteps}
              onChange={(e) => setGoalSteps(e.target.value)}
              placeholder="10"
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Weekly minutes</label>
            <input
              type="number"
              min="10"
              max="1000"
              value={goalWeeklyMinutes}
              onChange={(e) => setGoalWeeklyMinutes(e.target.value)}
              placeholder="120"
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={addingGoal}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1c2847] hover:bg-[#24345d] text-slate-200 border border-[#283b68] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add goal</span>
          </button>
        </form>

        {/* Goals List or Empty state (frame 01:14) */}
        <div className="pt-3 border-t border-[#1a2542]">
          {progress.goals.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              No goals yet — add your first one above.
            </p>
          ) : (
            <div className="space-y-3">
              {progress.goals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-4 rounded-2xl bg-[#152038] border border-[#223359] flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white capitalize">{goal.skill}</h4>
                    <p className="text-xs text-slate-400">
                      Target: {goal.targetLevel} • {goal.steps} steps • {goal.weeklyMinutes} min/week
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
