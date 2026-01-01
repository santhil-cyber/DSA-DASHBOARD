import { AppState, Problem, MonthModule, Difficulty, Status, Confidence, Priority, MotivationItem } from '../types';

const STORAGE_KEY = 'algomaster_data_v1';

const generateId = () => Math.random().toString(36).substr(2, 9);

const getInitialState = (): AppState => {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  
  return {
    problems: [],
    months: [{ id: currentMonth, name: monthName, problemIds: [] }],
    motivation: [],
    currentMonthId: currentMonth,
    streak: 0,
    darkMode: false,
    userParams: { dailyGoal: 3 }
  };
};

export const loadState = (): AppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return getInitialState();
    const state = JSON.parse(serialized);
    // Backward compatibility check for motivation
    if (!state.motivation) state.motivation = [];
    return state;
  } catch (e) {
    console.error("Failed to load state", e);
    return getInitialState();
  }
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
    // Handle quota exceeded
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      alert("Storage Quota Exceeded! The motivation item might be too large. Try deleting some items or using a URL instead of uploading files.");
    }
  }
};

export const addNextMonth = (state: AppState): AppState => {
  // Find the last month in the list
  const lastMonthId = state.months[state.months.length - 1].id;
  const [year, month] = lastMonthId.split('-').map(Number);
  
  // Create date for the 15th of the NEXT month (avoids timezone edge cases at month start)
  const nextDate = new Date(year, month, 15);
  
  const id = nextDate.toISOString().slice(0, 7);
  const name = nextDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  if (state.months.find(m => m.id === id)) {
    return { ...state, currentMonthId: id };
  }

  return {
    ...state,
    months: [...state.months, { id, name, problemIds: [] }],
    currentMonthId: id
  };
};

export const deleteMonth = (state: AppState, monthId: string): AppState => {
  // 1. Remove problems for this month
  const remainingProblems = state.problems.filter(p => p.monthId !== monthId);
  
  // 2. Remove the month module itself
  const remainingMonths = state.months.filter(m => m.id !== monthId);
  
  // 3. Handle edge case: No months left? Re-init default.
  if (remainingMonths.length === 0) {
     return getInitialState();
  }

  // 4. If current month was deleted, switch to the last available one
  let newCurrentId = state.currentMonthId;
  if (state.currentMonthId === monthId) {
      newCurrentId = remainingMonths[remainingMonths.length - 1].id;
  }

  return {
      ...state,
      problems: remainingProblems,
      months: remainingMonths,
      currentMonthId: newCurrentId
  };
};

export const deleteProblem = (state: AppState, problemId: string): AppState => {
  return {
    ...state,
    problems: state.problems.filter(p => p.id !== problemId)
  };
};

export const deleteProblems = (state: AppState, problemIds: string[]): AppState => {
  return {
    ...state,
    problems: state.problems.filter(p => !problemIds.includes(p.id))
  };
};

export const addMotivationItem = (state: AppState, item: MotivationItem): AppState => {
    return {
        ...state,
        motivation: [item, ...state.motivation]
    };
};

export const deleteMotivationItem = (state: AppState, itemId: string): AppState => {
    return {
        ...state,
        motivation: state.motivation.filter(m => m.id !== itemId)
    };
};

// Helper to handle CSV splitting with quotes
const splitCSV = (str: string) => {
  const result = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ',' && !inQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

export const importCSV = (csvText: string, currentMonthId: string): Problem[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = splitCSV(lines[0]).map(h => h.toLowerCase().replace(/['"]+/g, '').trim());
  
  // Mapping logic based on user specified format
  const findIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

  const idxMap = {
    name: findIdx(['question', 'problem']),
    link: findIdx(['link', 'url']),
    pattern: findIdx(['pattern']),
    subPattern: findIdx(['sub-pattern', 'sub pattern']),
    difficulty: findIdx(['difficulty']),
    priority: findIdx(['priority']),
    estimatedTime: findIdx(['estimated', 'est']),
    scheduledDay: findIdx(['day', 'date']), // Covers "January Day", "Scheduled Day"
    status: findIdx(['status']),
    solvedDate: findIdx(['solved date']),
    attempts: findIdx(['attempts']),
    timeTaken: findIdx(['time taken']),
    confidence: findIdx(['confidence']),
    mistake: findIdx(['mistake']),
    revision: findIdx(['revision']),
  };

  const problems: Problem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitCSV(lines[i]);
    if (row.length < 2) continue; // Skip empty rows

    const getVal = (idx: number) => idx !== -1 && row[idx] ? row[idx].replace(/^"|"$/g, '') : '';

    const name = getVal(idxMap.name) || 'Unknown Problem';
    const pattern = getVal(idxMap.pattern) || 'General';
    
    // Difficulty
    let difficulty = Difficulty.Easy;
    const diffStr = getVal(idxMap.difficulty).toLowerCase();
    if (diffStr.includes('med')) difficulty = Difficulty.Medium;
    if (diffStr.includes('hard')) difficulty = Difficulty.Hard;

    // Status
    let status = Status.NotStarted;
    const statusStr = getVal(idxMap.status).toLowerCase();
    if (statusStr.includes('solv')) status = Status.Solved;
    if (statusStr.includes('attempt')) status = Status.Attempted;

    // Confidence
    let confidence = Confidence.None;
    const confStr = getVal(idxMap.confidence).toLowerCase();
    if (confStr.includes('weak')) confidence = Confidence.Weak;
    if (confStr.includes('med')) confidence = Confidence.Medium;
    if (confStr.includes('strong')) confidence = Confidence.Strong;

    // Priority
    let priority = Priority.Normal;
    const prioStr = getVal(idxMap.priority).toLowerCase();
    if (prioStr.includes('must')) priority = Priority.MustDo;
    else if (prioStr.includes('high')) priority = Priority.High;
    else if (prioStr.includes('low')) priority = Priority.Low;

    // Scheduled Date Logic
    let scheduledDate = new Date().toISOString().split('T')[0]; // Default today
    const dayVal = getVal(idxMap.scheduledDay);
    if (dayVal) {
      const dayNum = parseInt(dayVal.replace(/\D/g, ''));
      if (!isNaN(dayNum) && dayNum > 0 && dayNum <= 31) {
        const [year, month] = currentMonthId.split('-').map(Number);
        const date = new Date(year, month - 1, dayNum);
        scheduledDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }
    }

    problems.push({
      id: generateId(),
      name,
      link: getVal(idxMap.link),
      pattern,
      subPattern: getVal(idxMap.subPattern),
      difficulty,
      priority,
      status,
      confidence,
      estimatedTime: parseInt(getVal(idxMap.estimatedTime)) || undefined,
      timeTaken: parseInt(getVal(idxMap.timeTaken)) || undefined,
      scheduledDate,
      lastSolvedDate: getVal(idxMap.solvedDate),
      attempts: parseInt(getVal(idxMap.attempts)) || 0,
      revisionCount: parseInt(getVal(idxMap.revision)) || 0,
      notes: getVal(idxMap.mistake),
      monthId: currentMonthId,
    });
  }
  return problems;
};