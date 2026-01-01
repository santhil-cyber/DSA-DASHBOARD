import React from 'react';
import { Problem, Confidence, Status } from '../types';
import { Clock, RefreshCw, CheckCircle2, ExternalLink, Calendar, TrendingUp } from 'lucide-react';

interface RevisionZoneProps {
  problems: Problem[];
  onReview: (id: string, newConfidence: Confidence) => void;
}

const RevisionZone: React.FC<RevisionZoneProps> = ({ problems, onReview }) => {
  const getDaysDiff = (dateStr?: string) => {
    if (!dateStr) return 0;
    const today = new Date();
    const lastDate = new Date(dateStr);
    return Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
  };

  const getNextInterval = (conf: Confidence) => {
      switch(conf) {
          case Confidence.Weak: return 1;
          case Confidence.Medium: return 3;
          case Confidence.Strong: return 7;
          default: return 1;
      }
  };

  // SRS Logic
  const getDueProblems = () => {
    return problems.filter(p => {
        if (p.status !== Status.Solved) return false;
        if (!p.lastSolvedDate) return false;
        
        const daysDiff = getDaysDiff(p.lastSolvedDate);
        const interval = getNextInterval(p.confidence);
        
        return daysDiff >= interval;
    }).sort((a, b) => {
        // Sort by priority: Weak first, then by how overdue they are
        const scoreA = (a.confidence === Confidence.Weak ? 100 : 0) + getDaysDiff(a.lastSolvedDate);
        const scoreB = (b.confidence === Confidence.Weak ? 100 : 0) + getDaysDiff(b.lastSolvedDate);
        return scoreB - scoreA;
    });
  };

  const dueProblems = getDueProblems();

  // Calculate upcoming reviews (for empty state or stats)
  const upcomingReviews = problems
    .filter(p => p.status === Status.Solved && !dueProblems.find(d => d.id === p.id))
    .sort((a, b) => {
        const nextA = getNextInterval(a.confidence) - getDaysDiff(a.lastSolvedDate);
        const nextB = getNextInterval(b.confidence) - getDaysDiff(b.lastSolvedDate);
        return nextA - nextB;
    })
    .slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Revision Zone
            </h2>
            <p className="text-slate-500 dark:text-gray-400 mt-1">
                Spaced repetition optimizes your memory retention.
            </p>
        </div>
        <div className="flex gap-4">
             <div className="text-right px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 block leading-none">{dueProblems.length}</span>
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider font-bold">Due Now</span>
            </div>
        </div>
      </div>

      {dueProblems.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-10 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">All Caught Up!</h3>
                <p className="text-emerald-600 dark:text-emerald-400 max-w-sm">
                    You've cleared your revision queue for now. Great job maintaining your streak.
                </p>
            </div>
            
            {upcomingReviews.length > 0 && (
                <div className="bg-white dark:bg-lc-card border border-slate-200 dark:border-lc-border rounded-2xl p-6">
                    <h4 className="font-bold text-slate-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Coming Up Next
                    </h4>
                    <div className="space-y-3">
                        {upcomingReviews.map(p => {
                            const daysLeft = Math.max(1, getNextInterval(p.confidence) - getDaysDiff(p.lastSolvedDate));
                            return (
                                <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-lc-hover rounded-lg">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                            p.confidence === Confidence.Weak ? 'bg-rose-500' : 
                                            p.confidence === Confidence.Medium ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`} />
                                        <span className="text-sm font-medium text-slate-700 dark:text-gray-300 truncate">{p.name}</span>
                                    </div>
                                    <span className="text-xs font-mono text-slate-400 whitespace-nowrap">in {daysLeft}d</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {dueProblems.map(problem => {
                const daysSince = getDaysDiff(problem.lastSolvedDate);
                return (
                <div key={problem.id} className="bg-white dark:bg-lc-card p-6 rounded-xl shadow-sm border border-slate-200 dark:border-lc-border hover:shadow-md transition-all group relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${
                        problem.confidence === Confidence.Weak ? 'bg-rose-500' : 
                        problem.confidence === Confidence.Medium ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    
                    <div className="flex justify-between items-start mb-4 pl-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-lc-hover text-slate-600 dark:text-gray-400">
                            {problem.pattern}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1" title={`Last solved ${problem.lastSolvedDate}`}>
                            <Clock className="w-3 h-3" /> {daysSince}d ago
                        </span>
                    </div>

                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 pl-3 line-clamp-2 min-h-[3.5rem]">
                      {problem.link ? (
                        <a 
                          href={problem.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:text-indigo-500 hover:underline flex items-start gap-2"
                        >
                          {problem.name}
                          <ExternalLink className="w-4 h-4 opacity-50 mt-1" />
                        </a>
                      ) : (
                        problem.name
                      )}
                    </h3>
                    
                    <div className="pl-3">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                             <span>Rate difficulty to reschedule:</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button 
                                onClick={() => onReview(problem.id, Confidence.Weak)}
                                className="flex flex-col items-center justify-center p-2 rounded-lg bg-rose-50 dark:bg-rose-900/10 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-100 dark:border-rose-900/30 transition-all group/btn"
                            >
                                <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">Hard</span>
                                <span className="text-[10px] text-rose-400 dark:text-rose-500 group-hover/btn:text-rose-600 mt-0.5">1 Day</span>
                            </button>
                            <button 
                                onClick={() => onReview(problem.id, Confidence.Medium)}
                                className="flex flex-col items-center justify-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-100 dark:border-amber-900/30 transition-all group/btn"
                            >
                                <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">Medium</span>
                                <span className="text-[10px] text-amber-400 dark:text-amber-500 group-hover/btn:text-amber-600 mt-0.5">3 Days</span>
                            </button>
                            <button 
                                onClick={() => onReview(problem.id, Confidence.Strong)}
                                className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-900/30 transition-all group/btn"
                            >
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">Easy</span>
                                <span className="text-[10px] text-emerald-400 dark:text-emerald-500 group-hover/btn:text-emerald-600 mt-0.5">7 Days</span>
                            </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                             <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Revs: {problem.revisionCount}</span>
                             <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Attempts: {problem.attempts}</span>
                        </div>
                    </div>
                </div>
            )})}
        </div>
      )}
    </div>
  );
};

export default RevisionZone;