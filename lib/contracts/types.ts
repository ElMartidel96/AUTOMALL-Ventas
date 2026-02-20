/**
 * Contract Types and Enums
 * Standalone file to avoid circular dependencies
 */

// Task status enum matching contract
export enum TaskStatus {
  Available = 0,
  Claimed = 1, 
  InProgress = 2,
  Submitted = 3,
  Completed = 4,
  Cancelled = 5
}