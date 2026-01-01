import React, { useState, useEffect } from 'react';
import { Target, Calendar, Brain, Flame, CheckCircle2, AlertTriangle, Layers, Clock, Zap, ArrowRight, ShieldAlert } from 'lucide-react';
import { Problem, Confidence, Status } from '../types';
import { calculateRoadmap, RoadmapPlan, getCurrentPhase } from '../services/roadmap';

interface RoadmapProps {
  problems: Problem[];
}

const Roadmap: React.FC<RoadmapProps> = ({ problems }) => {
  const [plan, setPlan] = useState<RoadmapPlan | null>(null);
  const [activePhase, setActivePhase] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    // Determine current month from the first problem or default to current date
    const monthId = problems.length > 0 ? problems[0].monthId : new Date().toISOString().slice(0, 7);
    const calculatedPlan = calculateRoadmap(monthId, problems);
    setPlan(calculatedPlan);
    setActivePhase(getCurrentPhase(calculatedPlan));
  }, [problems]);

  if (!plan) return <div>Loading Plan...</div>;

  // Live Metrics
  const totalSolved = problems.filter(p => p.status === Status.Solved).length;
  const totalProblems = problems.length || 1;
  const strongCount = problems.filter(p => p.confidence === Confidence.Strong).length;
  const weakCount = problems.filter(p => p.confidence === Confidence.Weak).length;
  const strongPct = Math.round((strongCount / totalProblems) * 100);
  const weakPct = Math.round((weakCount / totalProblems) * 100);

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="space-y-8 pb-10">
      {/* 🎯 UNIVERSAL STRUCTURE HEADER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-violet-900 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6 text-yellow-300" /> Adaptive Roadmap
              </h2>
              <p className="text-indigo-100 mt-1 opacity-90 text-sm">
                {plan.totalDays} Day Cycle • {problems.length} Questions
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                    <span className="text-sm font-bold">Target: {formatDate(plan.phases[2].endDate)}</span>
                </div>
                <span className="text-xs text-indigo-200">Buffer: {plan.bufferDays} Days</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <div className="text-xs text-indigo-200 uppercase font-bold mb-1">Total Qs</div>
              <div className="text-2xl font-bold">{problems.length}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <div className="text-xs text-indigo-200 uppercase font-bold mb-1">Daily (M-F)</div>
              <div className="text-2xl font-bold">{plan.dailyCapacity.weekday}</div>
              <div className="text-[10px] opacity-70">questions/day</div>
            </div>
             <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <div className="text-xs text-indigo-200 uppercase font-bold mb-1">Weekend</div>
              <div className="text-2xl font-bold">{plan.dailyCapacity.weekend}</div>
              <div className="text-[10px] opacity-70">questions/day</div>
            </div>
             <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <div className="text-xs text-indigo-200 uppercase font-bold mb-1">Time/Day</div>
              <div className="text-2xl font-bold">~2h</div>
            </div>
          </div>
        </div>

        {/* Live Targets */}
        <div className="bg-white dark:bg-lc-card rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-lc-border flex flex-col justify-between">
           <div>
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-rose-500" /> Success Criteria
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">Strong (Goal ≥ 65%)</span>
                  <span className="text-slate-500 dark:text-gray-400">{strongPct}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-lc-hover rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-1000" style={{width: `${Math.min(strongPct, 100)}%`}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-rose-600 dark:text-rose-400">Weak (Goal ≤ 5%)</span>
                  <span className="text-slate-500 dark:text-gray-400">{weakPct}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-lc-hover rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all duration-1000" style={{width: `${Math.min(weakPct, 100)}%`}}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-lc-border flex gap-2">
             <ShieldAlert className="w-4 h-4 text-slate-400" />
             <p className="text-xs text-slate-500 dark:text-gray-400 leading-tight">
                A pattern is "mastered" when 80%+ problems in it are Strong.
             </p>
          </div>
        </div>
      </div>

      {/* PHASE TABS */}
      <div className="flex flex-col sm:flex-row gap-4 border-b border-slate-200 dark:border-lc-border pb-1 overflow-x-auto">
        {plan.phases.map((phase) => (
          <button
            key={phase.id}
            onClick={() => setActivePhase(phase.id)}
            className={`flex-1 min-w-[200px] flex items-center justify-center sm:justify-start gap-3 px-6 py-4 rounded-t-xl transition-all border-b-2 ${
              activePhase === phase.id
                ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                activePhase === phase.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-lc-hover text-slate-500'
            }`}>
                {phase.id}
            </div>
            <div className="text-left">
              <div className="font-bold text-sm">{phase.name}</div>
              <div className="text-xs opacity-70">{formatDate(phase.startDate)} – {formatDate(phase.endDate)} ({phase.duration}d)</div>
            </div>
          </button>
        ))}
      </div>

      {/* PHASE CONTENT */}
      <div className="bg-white dark:bg-lc-card rounded-b-2xl rounded-tr-2xl shadow-sm border border-slate-200 dark:border-lc-border p-8 min-h-[400px]">
        <div className="flex items-center gap-3 mb-8 p-4 bg-slate-50 dark:bg-lc-hover rounded-lg border border-slate-100 dark:border-lc-border">
             <Zap className="w-5 h-5 text-amber-500" />
             <div>
                 <div className="text-sm font-bold text-slate-800 dark:text-white">Current Focus</div>
                 <div className="text-xs text-slate-500 dark:text-gray-400">{plan.phases[activePhase - 1].focus}</div>
             </div>
        </div>

        {activePhase === 1 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-slate-200 dark:border-lc-border rounded-xl p-5">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-500" /> Time Boxing Rules
                        </h4>
                        <ul className="space-y-3 text-sm text-slate-600 dark:text-gray-300">
                            <li className="flex justify-between"><span>Easy</span> <span className="font-mono bg-slate-100 dark:bg-lc-hover px-2 py-0.5 rounded">15m → Hint → 10m</span></li>
                            <li className="flex justify-between"><span>Medium</span> <span className="font-mono bg-slate-100 dark:bg-lc-hover px-2 py-0.5 rounded">25m → Hint → 15m</span></li>
                            <li className="flex justify-between"><span>Hard</span> <span className="font-mono bg-slate-100 dark:bg-lc-hover px-2 py-0.5 rounded">35m → Hint → 20m</span></li>
                        </ul>
                    </div>
                    <div className="border border-slate-200 dark:border-lc-border rounded-xl p-5">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Confidence Marking
                        </h4>
                         <ul className="space-y-3 text-sm text-slate-600 dark:text-gray-300">
                            <li className="flex gap-2">
                                <span className="text-emerald-500 font-bold">Strong:</span> Solved independently, can explain.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-amber-500 font-bold">Medium:</span> Used hint, logic clear but not fluent.
                            </li>
                             <li className="flex gap-2">
                                <span className="text-rose-500 font-bold">Weak:</span> Struggled heavily or copied.
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-200 rounded-lg text-sm border border-amber-100 dark:border-amber-900/30">
                    <strong>Last Day of Phase 1 is Cleanup Day:</strong> No new problems. Reattempt all Weak problems once.
                </div>
             </div>
        )}

        {activePhase === 2 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-slate-200 dark:border-lc-border rounded-xl p-5">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-4">Revision Priority Queue</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-gray-300">
                            <li className="font-semibold text-rose-500">All Weak problems (Must do)</li>
                            <li>Medium problems from complex patterns</li>
                            <li>Strong problems ONLY if pattern confidence &lt; 50%</li>
                        </ol>
                    </div>
                    <div className="border border-slate-200 dark:border-lc-border rounded-xl p-5">
                         <h4 className="font-bold text-slate-800 dark:text-white mb-4">The "No Peeking" Rule</h4>
                         <p className="text-sm text-slate-600 dark:text-gray-300 mb-2">
                            1. Look at problem statement only.
                         </p>
                         <p className="text-sm text-slate-600 dark:text-gray-300 mb-2">
                            2. Recall approach from memory.
                         </p>
                         <p className="text-sm text-slate-600 dark:text-gray-300">
                            3. Code independently. If stuck, it stays Weak.
                         </p>
                    </div>
                 </div>
             </div>
        )}

        {activePhase === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 dark:bg-lc-hover p-4 rounded-xl border border-slate-200 dark:border-lc-border">
                        <h5 className="font-bold text-sm text-slate-800 dark:text-white mb-2">Mixed Sets</h5>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Select 5-7 random problems. 90 min timer. No hints.</p>
                    </div>
                     <div className="bg-slate-50 dark:bg-lc-hover p-4 rounded-xl border border-slate-200 dark:border-lc-border">
                        <h5 className="font-bold text-sm text-slate-800 dark:text-white mb-2">Mock Interviews</h5>
                        <p className="text-xs text-slate-500 dark:text-gray-400">2 problems / 60 min. Verbalize solution while coding.</p>
                    </div>
                     <div className="bg-slate-50 dark:bg-lc-hover p-4 rounded-xl border border-slate-200 dark:border-lc-border">
                        <h5 className="font-bold text-sm text-slate-800 dark:text-white mb-2">Final Weak Sweep</h5>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Reattempt any remaining Weak problems once. Accept the result.</p>
                    </div>
                </div>
            </div>
        )}

      </div>

      {/* MENTAL RULES FOOTER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
            { t: 'Pace', d: 'Quality > Speed', i: '✅' },
            { t: 'Honesty', d: 'Mark confidence brutally', i: '✅' },
            { t: 'Breaks', d: '5m between problems', i: '✅' },
            { t: 'Sleep', d: '7+ hours for consolidation', i: '✅' },
            { t: 'No Binge', d: 'Don\'t do 10 in a row', i: '❌' },
            { t: 'No Ego', d: 'Don\'t mark Weak as Strong', i: '❌' },
            { t: 'No Skipping', d: 'Revision is 50% of value', i: '❌' },
            { t: 'No Copying', d: 'Understand before pasting', i: '❌' },
        ].map((r, i) => (
            <div key={i} className="bg-white dark:bg-lc-card p-3 rounded-lg border border-slate-100 dark:border-lc-border flex items-center gap-2">
                <span className="text-lg">{r.i}</span>
                <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-white">{r.t}</div>
                    <div className="text-[10px] text-slate-500 dark:text-gray-400">{r.d}</div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Roadmap;