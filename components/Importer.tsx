import React, { useState } from 'react';
import { Upload, FileText, Check } from 'lucide-react';
import { importCSV } from '../services/storage';
import { Problem } from '../types';

interface ImporterProps {
  currentMonthId: string;
  onImport: (problems: Problem[]) => void;
  onClose: () => void;
}

const Importer: React.FC<ImporterProps> = ({ currentMonthId, onImport, onClose }) => {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<Problem[]>([]);

  const handlePreview = () => {
    if (!text) return;
    const parsed = importCSV(text, currentMonthId);
    setPreview(parsed);
  };

  const handleConfirm = () => {
    onImport(preview);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-lc-card rounded-xl shadow-2xl w-full max-w-2xl p-6 flex flex-col max-h-[90vh] border border-slate-200 dark:border-lc-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Import Problems (CSV)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg text-sm text-indigo-800 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900/30">
            <p className="font-semibold mb-1">Paste your CSV content below.</p>
            <p className="opacity-80">
              Expected headers: Question, LeetCode Link, Pattern, Sub-Pattern, Difficulty, Priority, Estimated Time (min), January Day, Week, Daily Slot, Status, Solved Date, Attempts, Time Taken (min), Confidence, Mistake Type, Revision Count
            </p>
          </div>

          <textarea
            className="w-full h-40 p-4 border border-slate-200 dark:border-lc-border bg-white dark:bg-lc-bg text-slate-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm whitespace-pre"
            placeholder={`Question,LeetCode Link,Pattern,Sub-Pattern,Difficulty,Priority,Estimated Time (min),January Day,Week,Daily Slot,Status,Solved Date,Attempts,Time Taken (min),Confidence,Mistake Type,Revision Count
Two Sum,https://leetcode.com/...,Two Pointers,,Easy,Must Do,15,Day 1,Week 1,Morning,Solved,2024-01-01,1,10,Strong,,0`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex gap-2">
            <button
              onClick={handlePreview}
              className="px-4 py-2 bg-slate-200 dark:bg-lc-hover text-slate-700 dark:text-gray-200 rounded-lg hover:bg-slate-300 dark:hover:bg-neutral-700 font-medium transition-colors"
            >
              Preview
            </button>
          </div>

          {preview.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Preview ({preview.length} problems)
              </h3>
              <div className="border border-slate-200 dark:border-lc-border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-lc-hover text-slate-600 dark:text-gray-300">
                    <tr>
                      <th className="p-3 font-medium">Name</th>
                      <th className="p-3 font-medium">Difficulty</th>
                      <th className="p-3 font-medium">Pattern</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-lc-border">
                    {preview.slice(0, 5).map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-lc-hover text-slate-800 dark:text-gray-200">
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold
                            ${p.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                              p.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                              'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                            {p.difficulty}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-gray-400">{p.pattern}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 5 && (
                  <div className="p-2 text-center text-xs text-slate-400 dark:text-gray-500 bg-slate-50 dark:bg-lc-hover border-t dark:border-lc-border">
                    + {preview.length - 5} more items...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-lc-border flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-lc-hover rounded-lg font-medium">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={preview.length === 0}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Import & Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default Importer;