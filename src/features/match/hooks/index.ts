/**
 * Barrel export for match-related custom hooks
 */
export { useMatchTimer } from './useMatchTimer';
export { useEvaluationManager } from './useEvaluationManager';
export { useSwipeGesture } from './useSwipeGesture';
export { useSubstitutions } from './useSubstitutions';
export { useFatigueTracker } from './useFatigueTracker';
export { usePostMatchReport } from './usePostMatchReport';

export type { PlayerStatus, Substitution } from './useSubstitutions';
export type { FatigueLevel, FatigueColor, FatigueInfo } from './useFatigueTracker';
export type { PostMatchSessionData } from './usePostMatchReport';

