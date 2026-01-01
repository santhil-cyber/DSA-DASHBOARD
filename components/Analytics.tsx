import React from 'react';
import { Problem, Difficulty, Status, Confidence } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface AnalyticsProps {
  problems: Problem[];
}

const Analytics: React.FC<AnalyticsProps> = ({ problems }) => {
  // 1. Difficulty Distribution
  const diffData = [
    { name: 'Easy', value: problems.filter(p => p.difficulty === Difficulty.Easy).length, color: '#10b981' },
    { name: 'Medium', value: problems.filter(p => p.difficulty === Difficulty.Medium).length, color: '#f59e0b' },
    { name: 'Hard', value: problems.filter(p => p.difficulty === Difficulty.Hard).length, color: '#f43f5e' },
  ];

  // 2. Status Progress
  const statusData = [
    { name: 'Solved', value: problems.filter(p => p.status === Status.Solved).length, color: '#6366f1' },
    { name: 'Pending', value: problems.filter(p => p.status !== Status.Solved).length, color: '#e2e8f0' },
  ];

  // 3. Pattern Mastery (Top 5)
  const patterns = [...new Set(problems.map(p => p.pattern))];
  const patternData = patterns.map(pattern => {
    const related = problems.filter(p => p.pattern === pattern);
    const solved = related.filter(p => p.status === Status.Solved).length;
    return { name: pattern, total: related.length, solved };
  }).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Distribution Card */}
      <div className="bg-white dark:bg-lc-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-lc-border">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Difficulty Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={diffData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
              <YAxis hide />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#3e3e3e', color: '#fff' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {diffData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress Pie */}
      <div className="bg-white dark:bg-lc-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-lc-border">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Completion Status</h3>
        <div className="h-64 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#3e3e3e', color: '#fff' }} />
                </PieChart>
             </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
            {statusData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></div>
                    {d.name}: {d.value}
                </div>
            ))}
        </div>
      </div>

      {/* Pattern Breakdown */}
      <div className="lg:col-span-2 bg-white dark:bg-lc-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-lc-border">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Pattern Mastery (Top 5)</h3>
        <div className="space-y-4">
            {patternData.map((p, i) => (
                <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700 dark:text-gray-200">{p.name}</span>
                        <span className="text-slate-500 dark:text-gray-400">{p.solved}/{p.total}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-lc-hover rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${(p.solved / p.total) * 100}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;