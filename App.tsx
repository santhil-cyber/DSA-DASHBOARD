import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ListTodo, 
  Calendar, 
  BrainCircuit, 
  BarChart3, 
  Plus, 
  ChevronDown, 
  CheckCircle2, 
  Play,
  Settings,
  Menu,
  Moon,
  Sun,
  ExternalLink,
  PlusCircle,
  Map,
  Target,
  ArrowRight,
  Trash2,
  Zap,
  CheckSquare,
  Square
} from 'lucide-react';
import { AppState, Problem, Status, Confidence, Difficulty, MotivationItem } from './types';
import { loadState, saveState, addNextMonth, deleteMonth, deleteProblem, deleteProblems, addMotivationItem, deleteMotivationItem } from './services/storage';
import { calculateRoadmap, getCurrentPhase } from './services/roadmap';
import Importer from './components/Importer';
import AICoach from './components/AICoach';
import RevisionZone from './components/RevisionZone';
import Analytics from './components/Analytics';
import Roadmap from './components/Roadmap';
import Motivation from './components/Motivation';

type View = 'dashboard' | 'all' | 'revision' | 'coach' | 'analytics' | 'roadmap' | 'motivation';

function App() {
  const [state, setState] = useState<AppState>(loadState());
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showImporter, setShowImporter] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProblems, setSelectedProblems] = useState<Set<string>>(new Set());

  // Sync with local storage
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Handle Dark Mode Class
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  const currentMonthProblems = state.problems.filter(p => p.monthId === state.currentMonthId);
  
  // Phase Aware Dashboard Logic
  const roadmapPlan = calculateRoadmap(state.currentMonthId, currentMonthProblems);
  const currentPhase = getCurrentPhase(roadmapPlan);
  const today = new Date().toISOString().split('T')[0];

  // Determine "Todays Focus" based on Phase
  let todaysProblems: Problem[] = [];
  let focusTitle = "Today's Focus";
  let focusSubtitle = "";

  if (currentPhase === 1) {
      // Phase 1: Solving Schedule
      todaysProblems = currentMonthProblems.filter(p => p.scheduledDate === today && p.status !== Status.Solved);
      focusTitle = "Phase 1: Solve Queue";
      focusSubtitle = "First pass solving. Don't overthink.";
  } else if (currentPhase === 2) {
      // Phase 2: Revision (Weak/Medium)
      // Show Weak problems first, then Medium
      todaysProblems = currentMonthProblems.filter(p => 
          (p.confidence === Confidence.Weak || p.confidence === Confidence.Medium) 
          && p.status === Status.Solved
      ).sort((a, b) => (a.confidence === Confidence.Weak ? -1 : 1)).slice(0, 5); // Limit to 5 for dash
      focusTitle = "Phase 2: Pattern Revision";
      focusSubtitle = "Focus on Weak/Medium problems. No peeking.";
  } else {
      // Phase 3: Polish (Random 5)
      // Pick random solved problems to polish
      focusTitle = "Phase 3: Final Polish";
      focusSubtitle = "Mixed set. Timer on.";
      // Simple randomizer for display
      todaysProblems = currentMonthProblems
        .filter(p => p.status === Status.Solved)
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);
  }

  const handleImport = (newProblems: Problem[]) => {
    setState(prev => ({
      ...prev,
      problems: [...prev.problems, ...newProblems]
    }));
  };

  const handleStatusChange = (id: string, newStatus: Status) => {
    setState(prev => ({
      ...prev,
      problems: prev.problems.map(p => 
        p.id === id ? { 
            ...p, 
            status: newStatus, 
            lastSolvedDate: newStatus === Status.Solved ? new Date().toISOString() : p.lastSolvedDate,
            confidence: newStatus === Status.Solved ? Confidence.Medium : p.confidence // Default confidence
        } : p
      )
    }));
  };

  const handleReview = (id: string, conf: Confidence) => {
      setState(prev => ({
          ...prev,
          problems: prev.problems.map(p =>
              p.id === id ? { 
                ...p, 
                confidence: conf, 
                attempts: (p.attempts || 0) + 1, 
                revisionCount: (p.revisionCount || 0) + 1,
                lastSolvedDate: new Date().toISOString() // Reset timer for SRS logic
              } : p
          )
      }));
  };

  const handleAddMonth = () => {
    setState(prev => addNextMonth(prev));
  };

  const handleDeleteMonth = () => {
      const currentId = state.currentMonthId;
      const monthName = state.months.find(m => m.id === currentId)?.name;
      if (window.confirm(`Are you sure you want to delete ${monthName}? This will permanently remove the month and all its problems.`)) {
          setState(prev => deleteMonth(prev, currentId));
      }
  };
  
  const handleDeleteProblem = (problemId: string) => {
      if (window.confirm('Delete this problem?')) {
          setState(prev => deleteProblem(prev, problemId));
      }
  };

  // Bulk Selection Logic
  const handleToggleSelect = (id: string) => {
    setSelectedProblems(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        return next;
    });
  };

  const handleSelectAll = () => {
      if (selectedProblems.size === currentMonthProblems.length) {
          setSelectedProblems(new Set());
      } else {
          setSelectedProblems(new Set(currentMonthProblems.map(p => p.id)));
      }
  };

  const handleBulkDelete = () => {
      if (selectedProblems.size === 0) return;
      if (window.confirm(`Are you sure you want to delete ${selectedProblems.size} problems?`)) {
          setState(prev => deleteProblems(prev, Array.from(selectedProblems)));
          setSelectedProblems(new Set());
      }
  };

  // Motivation Handlers
  const handleAddMotivation = (item: MotivationItem) => {
      setState(prev => addMotivationItem(prev, item));
  };

  const handleDeleteMotivation = (id: string) => {
      if(window.confirm('Remove this item?')) {
          setState(prev => deleteMotivationItem(prev, id));
      }
  };

  const toggleDarkMode = () => {
    setState(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => { setCurrentView(view); setMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
        currentView === view 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
          : 'text-slate-500 dark:text-gray-400 hover:bg-white dark:hover:bg-lc-hover hover:text-indigo-600 dark:hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className={`min-h-screen bg-[#F8FAFC] dark:bg-lc-bg flex text-slate-800 dark:text-lc-text font-sans transition-colors duration-200`}>
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#F8FAFC] dark:bg-lc-bg border-r border-slate-200 dark:border-lc-border p-6 transition-transform transform lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 bg-white dark:bg-lc-card' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200 dark:shadow-none">
            S
          </div>
          <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Santhil DSA Mastery</span>
        </div>

        <nav className="space-y-2">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="roadmap" icon={Map} label="Roadmap" />
          <NavItem view="all" icon={ListTodo} label="All Problems" />
          <NavItem view="revision" icon={BrainCircuit} label="Revision Zone" />
          <NavItem view="motivation" icon={Zap} label="Motivation" />
          <NavItem view="analytics" icon={BarChart3} label="Analytics" />
          <NavItem view="coach" icon={Play} label="AI Coach" />
        </nav>

        <div className="absolute bottom-6 left-6 right-6 space-y-4">
          <div className="bg-indigo-50 dark:bg-lc-card border border-indigo-100 dark:border-lc-border rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-indigo-900 dark:text-gray-300 text-sm">Current Month</h4>
                <button 
                  onClick={handleDeleteMonth}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                  title="Delete Month"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="relative group">
              <select 
                value={state.currentMonthId}
                onChange={(e) => setState(prev => ({...prev, currentMonthId: e.target.value}))}
                className="w-full appearance-none bg-white dark:bg-lc-hover border border-slate-200 dark:border-lc-border rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {state.months.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <button 
              onClick={handleAddMonth}
              className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 py-1"
            >
              <PlusCircle className="w-3 h-3" /> Add Next Month
            </button>
          </div>

          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-semibold text-slate-400">Theme</span>
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-white dark:bg-lc-card border border-slate-200 dark:border-lc-border hover:bg-slate-50 dark:hover:bg-lc-hover transition-colors text-slate-600 dark:text-gray-300"
            >
              {state.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-20 bg-white dark:bg-lc-card border-b border-slate-100 dark:border-lc-border flex items-center justify-between px-8 sticky top-0 z-30 transition-colors">
          <button className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-6 h-6 text-slate-600 dark:text-gray-300" />
          </button>
          
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white capitalize hidden sm:block">
                {currentView.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-semibold border border-emerald-100 dark:border-emerald-900/30">
                <CheckCircle2 className="w-4 h-4" />
                <span>{state.problems.filter(p => p.status === Status.Solved).length} Solved</span>
            </div>
            <button 
                onClick={() => setShowImporter(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-md shadow-indigo-100 dark:shadow-none transition-all text-sm"
            >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Problems</span>
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {currentView === 'dashboard' && (
            <div className="space-y-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Due Today', val: todaysProblems.length, color: 'text-indigo-600 dark:text-indigo-400' },
                        { label: 'Weekly Streak', val: `${state.streak} Days`, color: 'text-amber-600 dark:text-amber-400' },
                        { label: 'Revision Due', val: currentMonthProblems.filter(p => p.confidence === Confidence.Weak).length, color: 'text-rose-600 dark:text-rose-400' },
                        { label: 'Mastered', val: currentMonthProblems.filter(p => p.confidence === Confidence.Strong).length, color: 'text-emerald-600 dark:text-emerald-400' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white dark:bg-lc-card p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-lc-border transition-colors">
                            <div className="text-3xl font-bold mb-1 font-mono tracking-tight text-slate-800 dark:text-white">{s.val}</div>
                            <div className={`text-sm font-semibold uppercase tracking-wider ${s.color}`}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Phase Banner */}
                <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Map className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                              Phase {currentPhase}
                           </span>
                           <span className="text-white/80 text-xs font-medium">
                              {new Date(roadmapPlan.phases[currentPhase-1].startDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {new Date(roadmapPlan.phases[currentPhase-1].endDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                           </span>
                        </div>
                        <h2 className="text-3xl font-bold mb-1">{roadmapPlan.phases[currentPhase - 1].name}</h2>
                        <p className="text-indigo-100 font-medium max-w-lg">{roadmapPlan.phases[currentPhase - 1].focus}</p>
                    </div>
                    <button onClick={() => setCurrentView('roadmap')} className="relative z-10 bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-3 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 group">
                        Full Roadmap <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Today's Focus Table */}
                <div className="bg-white dark:bg-lc-card rounded-2xl shadow-sm border border-slate-200 dark:border-lc-border overflow-hidden transition-colors">
                    <div className="p-6 border-b border-slate-100 dark:border-lc-border flex justify-between items-center bg-slate-50/50 dark:bg-lc-hover/20">
                        <div>
                           <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                              {currentPhase === 1 ? <ListTodo className="w-5 h-5 text-indigo-500" /> : 
                               currentPhase === 2 ? <BrainCircuit className="w-5 h-5 text-amber-500" /> :
                               <Target className="w-5 h-5 text-emerald-500" />
                              }
                              {focusTitle}
                           </h3>
                           <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">{focusSubtitle}</p>
                        </div>
                        <div className="text-right">
                           <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Date</span>
                           <span className="text-sm font-mono text-slate-700 dark:text-gray-300">{today}</span>
                        </div>
                    </div>
                    {todaysProblems.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 dark:text-gray-500">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No specific problems scheduled for today in this phase.</p>
                            <button onClick={() => setCurrentView('all')} className="mt-4 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">View All Problems</button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-lc-hover text-slate-500 dark:text-gray-400 font-medium border-b border-slate-100 dark:border-lc-border">
                                    <tr>
                                        <th className="p-4 pl-6">Problem</th>
                                        <th className="p-4">Pattern</th>
                                        <th className="p-4">Difficulty</th>
                                        <th className="p-4 text-right pr-6">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-lc-border">
                                    {todaysProblems.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-lc-hover group transition-colors">
                                            <td className="p-4 pl-6 font-medium text-slate-800 dark:text-gray-200">
                                              {p.link ? (
                                                <a 
                                                  href={p.link} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer" 
                                                  className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline flex items-center gap-1.5 w-fit"
                                                >
                                                  {p.name}
                                                  <ExternalLink className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                                </a>
                                              ) : (
                                                p.name
                                              )}
                                              {currentPhase === 2 && (
                                                <div className="flex items-center gap-2 mt-1">
                                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                    p.confidence === Confidence.Weak ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                                  }`}>
                                                    {p.confidence}
                                                  </span>
                                                </div>
                                              )}
                                            </td>
                                            <td className="p-4 text-slate-500 dark:text-gray-400">{p.pattern}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold border
                                                    ${p.difficulty === Difficulty.Easy ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' : 
                                                      p.difficulty === Difficulty.Medium ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' : 
                                                      'bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'}`}>
                                                    {p.difficulty}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                {p.status !== Status.Solved ? (
                                                     <button 
                                                        onClick={() => handleStatusChange(p.id, Status.Solved)}
                                                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold transition-colors"
                                                    >
                                                        Mark Solved
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/30">
                                                        Revision Set
                                                    </span>
                                                )}
                                               
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
          )}

          {currentView === 'all' && (
             <div className="bg-white dark:bg-lc-card rounded-2xl shadow-sm border border-slate-200 dark:border-lc-border overflow-hidden transition-colors">
                <div className="p-6 border-b border-slate-100 dark:border-lc-border flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">All Problems</h3>
                    {selectedProblems.size > 0 && (
                        <button 
                            onClick={handleBulkDelete}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 dark:text-rose-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete ({selectedProblems.size})
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-lc-hover text-slate-500 dark:text-gray-400 font-medium border-b border-slate-100 dark:border-lc-border">
                            <tr>
                                <th className="p-4 pl-6 w-10">
                                    <button onClick={handleSelectAll} className="flex items-center text-slate-400 hover:text-indigo-600 transition-colors">
                                        {selectedProblems.size > 0 && selectedProblems.size === currentMonthProblems.length ? (
                                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                                        ) : (
                                            <Square className="w-4 h-4" />
                                        )}
                                    </button>
                                </th>
                                <th className="p-4 w-16">No.</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Difficulty</th>
                                <th className="p-4">Pattern</th>
                                <th className="p-4">Sub Pattern</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Confidence</th>
                                <th className="p-4 text-right pr-6">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-lc-border">
                            {currentMonthProblems.map((p, index) => (
                                <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-lc-hover transition-colors group ${selectedProblems.has(p.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                                    <td className="p-4 pl-6">
                                        <button onClick={() => handleToggleSelect(p.id)} className="flex items-center text-slate-300 hover:text-indigo-500">
                                            {selectedProblems.has(p.id) ? (
                                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                                            ) : (
                                                <Square className="w-4 h-4" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="p-4 text-slate-400 dark:text-gray-500 font-mono text-xs">{index + 1}</td>
                                    <td className="p-4 font-medium text-slate-800 dark:text-gray-200">
                                      {p.link ? (
                                        <a 
                                          href={p.link} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline flex items-center gap-1.5 w-fit"
                                        >
                                          {p.name}
                                          <ExternalLink className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                      ) : (
                                        p.name
                                      )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border
                                            ${p.difficulty === Difficulty.Easy ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' : 
                                              p.difficulty === Difficulty.Medium ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' : 
                                              'bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'}`}>
                                            {p.difficulty}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500 dark:text-gray-400">{p.pattern}</td>
                                    <td className="p-4 text-slate-400 dark:text-gray-500 text-xs">{p.subPattern || '-'}</td>
                                    <td className="p-4">
                                        <select 
                                            value={p.status}
                                            onChange={(e) => handleStatusChange(p.id, e.target.value as Status)}
                                            className="bg-transparent border-none text-xs font-medium text-slate-600 dark:text-gray-300 focus:ring-0 cursor-pointer dark:bg-transparent"
                                        >
                                            {Object.values(Status).map(s => <option key={s} value={s} className="dark:bg-lc-card">{s}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                                            ${p.confidence === Confidence.Strong ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                                              p.confidence === Confidence.Weak ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' :
                                              'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-gray-300'
                                            }`}>
                                            {p.confidence}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                        <button 
                                          onClick={() => handleDeleteProblem(p.id)}
                                          className="text-slate-400 hover:text-rose-500 dark:text-gray-500 dark:hover:text-rose-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                                          title="Delete Problem"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
          )}

          {currentView === 'revision' && (
              <RevisionZone problems={currentMonthProblems} onReview={handleReview} />
          )}

          {currentView === 'analytics' && (
              <Analytics problems={currentMonthProblems} />
          )}

          {currentView === 'coach' && (
              <AICoach problems={currentMonthProblems} />
          )}

          {currentView === 'roadmap' && (
              <Roadmap problems={currentMonthProblems} />
          )}

          {currentView === 'motivation' && (
              <Motivation 
                  items={state.motivation || []} 
                  onAdd={handleAddMotivation}
                  onDelete={handleDeleteMotivation}
              />
          )}
        </div>
      </main>

      {/* Modals */}
      {showImporter && (
        <Importer 
            currentMonthId={state.currentMonthId} 
            onImport={handleImport} 
            onClose={() => setShowImporter(false)} 
        />
      )}
    </div>
  );
}

export default App;