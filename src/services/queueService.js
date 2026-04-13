const { zones } = require('../data/venueData');
const { WAIT_THRESHOLDS, STATUS, PENALTY_FACTORS } = require('../utils/constants');

/**
 * Service for predicting queue wait times based on zone density and base wait times.
 */
class QueueService {

  /**
   * Calculates the predicted wait time for a specific zone.
   * @param {string} zoneId - The unique identifier of the zone.
   * @returns {Object|null} Wait time prediction data or null if zone not found.
   */
  calculateWait(zoneId) {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return null;

    // Weight calculation: baseWait + (density / 10) * penalty
    const densityPenalty = (zone.density / 10) * PENALTY_FACTORS.DENSITY_WAIT;
    const finalWait = Math.round(zone.baseWait + densityPenalty);

    return {
      id: zone.id,
      name: zone.name,
      estimatedWait: finalWait,
      unit: 'min',
      status: this.getStatus(finalWait)
    };
  }

  /**
   * Translates numerical wait time into a descriptive status string.
   * @param {number} totalWait - Total calculated wait time in minutes.
   * @returns {string} descriptive status (Heavy, Moderate, Low).
   */
  getStatus(totalWait) {
    if (totalWait > WAIT_THRESHOLDS.HEAVY) return STATUS.HEAVY;
    if (totalWait > WAIT_THRESHOLDS.MODERATE) return STATUS.MODERATE;
    return STATUS.LOW;
  }

  /**
   * Generates a report for all zones in the venue.
   * @returns {Array<Object>} List of wait time predictions for all zones.
   */
  getPredictionReport() {
    return zones.map(z => this.calculateWait(z.id)).filter(Boolean);
  }
}

module.exports = new QueueService();
