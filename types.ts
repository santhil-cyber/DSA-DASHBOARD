
export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard'
}

export enum Status {
  NotStarted = 'Not Started',
  Attempted = 'Attempted',
  Solved = 'Solved'
}

export enum Confidence {
  None = 'None',
  Weak = 'Weak',
  Medium = 'Medium',
  Strong = 'Strong'
}

export enum Priority {
  Low = 'Low',
  Normal = 'Normal',
  High = 'High',
  MustDo = 'Must Do'
}

export interface Problem {
  id: string;
  name: string;
  link?: string;
  pattern: string;
  subPattern?: string;
  difficulty: Difficulty;
  priority: Priority;
  status: Status;
  confidence: Confidence;
  estimatedTime?: number; // in minutes
  timeTaken?: number; // in minutes
  scheduledDate?: string; // ISO Date YYYY-MM-DD
  lastSolvedDate?: string; // ISO Date YYYY-MM-DD
  revisionCount: number;
  attempts: number;
  notes?: string;
  monthId: string; // Links problem to a specific month module
}

export interface MonthModule {
  id: string; // e.g., "2023-10"
  name: string; // e.g., "October 2023"
  problemIds: string[];
}

export interface MotivationItem {
  id: string;
  type: 'image' | 'video' | 'youtube';
  content: string; // Base64 data or URL
  caption?: string;
  addedDate: string;
}

export interface AppState {
  problems: Problem[];
  months: MonthModule[];
  motivation: MotivationItem[];
  currentMonthId: string;
  streak: number;
  darkMode: boolean;
  userParams: {
    dailyGoal: number;
  };
}
