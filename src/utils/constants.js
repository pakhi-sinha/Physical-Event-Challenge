/**
 * App-wide constants for venue optimization and crowd density.
 */
module.exports = {
  DENSITY_LEVELS: {
    HIGH: 80,
    MEDIUM: 40
  },
  WAIT_THRESHOLDS: {
    HEAVY: 25,
    MODERATE: 10
  },
  STATUS: {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    HEAVY: 'Heavy',
    MODERATE: 'Moderate'
  },
  PENALTY_FACTORS: {
    DENSITY_WAIT: 2
  }
};
