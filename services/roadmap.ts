import { Problem } from '../types';

export interface PhaseConfig {
  id: 1 | 2 | 3;
  name: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in days
  focus: string;
  goal: string;
}

export interface RoadmapPlan {
  totalDays: number;
  bufferDays: number;
  workingDays: number;
  phases: PhaseConfig[];
  dailyCapacity: {
    weekday: number;
    weekend: number;
  };
}

export const calculateRoadmap = (monthId: string, problems: Problem[]): RoadmapPlan => {
  const [year, month] = monthId.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalQuestions = problems.length || 1; // Prevent div by 0

  // 1. Calculate Buffer & Working Days
  // Logic: 28 days -> Buffer 1. 30/31 -> Buffer 2.
  let bufferDays = daysInMonth === 28 ? 1 : 2;
  
  // High load adjustment
  if (totalQuestions > 100) bufferDays = 1;

  const workingDays = daysInMonth - bufferDays;

  // 2. Phase Allocation
  // User Requirement: Phase 2 + Phase 3 = 6 days TOTAL.
  const totalRevisionPolishDays = 6;
  
  // Phase 3 (Polish): 2 days (Mock Interviews + Final Review)
  let p3Days = 2;
  
  // Phase 2 (Revision): 4 days (Pattern Revision)
  let p2Days = 4;

  // Safety check for extremely short timeframe (unlikely in normal use)
  if (workingDays <= totalRevisionPolishDays) {
      p3Days = 1;
      p2Days = 1;
  }

  let p1Days = workingDays - p2Days - p3Days;

  // 3. Date Ranges
  const start = new Date(year, month - 1, 1);
  
  const p1End = new Date(start); 
  p1End.setDate(start.getDate() + p1Days - 1);

  const p2Start = new Date(p1End);
  p2Start.setDate(p1End.getDate() + 1);
  
  const p2End = new Date(p2Start);
  p2End.setDate(p2Start.getDate() + p2Days - 1);

  const p3Start = new Date(p2End);
  p3Start.setDate(p2End.getDate() + 1);
  
  const p3End = new Date(year, month - 1, daysInMonth); // End of month

  // 4. Daily Capacity
  const baseRate = Math.ceil(totalQuestions / p1Days);
  // Refine logic: Weekday vs Weekend (approximate)
  // Assume Weekend is 1.4x Weekday
  const weekdayRate = Math.max(1, Math.floor(baseRate * 0.9)); 
  const weekendRate = Math.ceil(weekdayRate * 1.4);

  return {
    totalDays: daysInMonth,
    bufferDays,
    workingDays,
    dailyCapacity: {
      weekday: weekdayRate,
      weekend: weekendRate
    },
    phases: [
      {
        id: 1,
        name: 'First Pass (Solving)',
        startDate: start,
        endDate: p1End,
        duration: p1Days,
        focus: 'Solve all questions. Don\'t overthink.',
        goal: 'Attempt 100% of questions.'
      },
      {
        id: 2,
        name: 'Pattern Revision',
        startDate: p2Start,
        endDate: p2End,
        duration: p2Days,
        focus: 'Revise Weak/Medium by pattern.',
        goal: 'Convert Weak -> Medium/Strong.'
      },
      {
        id: 3,
        name: 'Final Polish',
        startDate: p3Start,
        endDate: p3End,
        duration: p3Days, // Core duration
        focus: 'Mixed sets & Mock interviews.',
        goal: 'Speed & Confidence Lock-in.'
      }
    ]
  };
};

export const getCurrentPhase = (plan: RoadmapPlan): 1 | 2 | 3 => {
  const today = new Date();
  // Strip time for comparison
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  for (const phase of plan.phases) {
    if (now >= phase.startDate.getTime() && now <= phase.endDate.getTime()) {
      return phase.id;
    }
  }
  
  // Edge cases
  const lastPhase = plan.phases[2];
  if (now > lastPhase.endDate.getTime()) return 3; // Past month
  return 1; // Before month or default
};
