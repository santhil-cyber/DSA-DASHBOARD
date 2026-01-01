import React, { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, AlertCircle } from 'lucide-react';
import { chatWithCoach, getCoachRecommendations } from '../services/gemini';
import { Problem } from '../types';

interface AICoachProps {
  problems: Problem[];
}

const AICoach: React.FC<AICoachProps> = ({ problems }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [recommendation, setRecommendation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    // Initial recommendation load
    setRecLoading(true);
    getCoachRecommendations(problems).then(rec => {
        setRecommendation(rec);
        setRecLoading(false);
    });
  }, [problems]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const response = await chatWithCoach(userMsg, problems);
    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Sidebar Recommendations */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-violet-900 rounded-2xl p-6 text-white shadow-xl dark:shadow-none border border-transparent dark:border-indigo-800">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <h3 className="text-lg font-bold">Coach Insights</h3>
          </div>
          {recLoading ? (
            <div className="animate-pulse space-y-2">
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                <div className="h-4 bg-white/20 rounded w-1/2"></div>
            </div>
          ) : (
            <div 
                className="text-sm text-indigo-100 dark:text-gray-200 leading-relaxed prose prose-invert prose-sm"
                dangerouslySetInnerHTML={{__html: recommendation}} 
            />
          )}
        </div>

        <div className="bg-white dark:bg-lc-card rounded-xl shadow-sm border border-slate-200 dark:border-lc-border p-4">
            <h4 className="font-semibold text-slate-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" /> Weak Areas
            </h4>
            <div className="flex flex-wrap gap-2">
                {/* Mock data for visualization if we don't have enough history */}
                {['Dynamic Programming', 'Tries'].map(tag => (
                    <span key={tag} className="px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs rounded-full font-medium border border-rose-100 dark:border-rose-900/30">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-2 bg-white dark:bg-lc-card rounded-2xl shadow-sm border border-slate-200 dark:border-lc-border flex flex-col h-[600px]">
        <div className="p-4 border-b border-slate-100 dark:border-lc-border flex items-center gap-3 bg-slate-50 dark:bg-lc-hover rounded-t-2xl">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">Gemini DSA Coach</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400">Powered by Google Gemini 3 Flash</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
                <div className="text-center text-slate-400 dark:text-gray-500 mt-20">
                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Ask me anything about your progress or specific algorithms!</p>
                </div>
            )}
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-slate-100 dark:bg-lc-hover text-slate-800 dark:text-gray-200 rounded-bl-none'
                    }`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-lc-hover rounded-2xl rounded-bl-none px-4 py-3 flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-lc-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about Two Pointers..."
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-lc-border bg-white dark:bg-lc-bg text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            />
            <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICoach;