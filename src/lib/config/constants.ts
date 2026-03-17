/**
 * Game configuration constants
 *
 * Centralized magic numbers for the Topick game.
 * All game rules and scoring values should be defined here.
 */

// Draft / Selection
export const DRAFT_SIZE = 5;

// Scoring
export const CAPTAIN_BONUS = 3;
export const MAX_BASE_SCORE = DRAFT_SIZE;
export const MAX_TOTAL_SCORE = MAX_BASE_SCORE + CAPTAIN_BONUS;

// Rankings
export const TOP_RANK = 1;
export const TOP_N = 5;

// UI Animation Timing (milliseconds)
export const REVEAL_DELAY_RANKINGS = 300;
export const REVEAL_DELAY_STATS = 1800;
export const COUNTDOWN_INTERVAL = 1000;

// Display
export const SHARE_CARD_ITEM_TRUNCATE_LENGTH = 30;

// Percentage calculation (one decimal place)
export const PERCENTAGE_PRECISION_MULTIPLIER = 1000;
export const PERCENTAGE_PRECISION_DIVISOR = 10;
