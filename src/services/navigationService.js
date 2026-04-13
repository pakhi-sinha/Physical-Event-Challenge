const { networkGraph, zones } = require('../data/venueData');
const googleService = require('./googleService');
const AppError = require('../utils/AppError');
const NodeCache = require('node-cache');

// Performance: Cache route results to reduce CPU overhead for repetitive queries.
const routeCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * NavigationService
 * Implements crowd-aware Dijkstra routing for safe stadium navigation.
 */
class NavigationService {
  /**
   * Calculates traversal cost with density penalties.
   * @param {string} zoneId - Zone identifier.
   * @returns {number} Weighted cost.
   */
  getZoneCost(zoneId) {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return 10000;
    
    // Core Formula: Base distance + (Density / 5) * Penalty factor
    // This ensures even 50% density has a significant impact on routing decisions.
    return 1 + (zone.density / 20);
  }

  /**
   * Generates a smart path between two points.
   * @param {string} startId - Source zone.
   * @param {string} endId - Destination zone.
   * @throws {AppError} If parameters are invalid.
   */
  findSmartPath(startId, endId) {
    if (!networkGraph[startId] || !networkGraph[endId]) {
      throw new AppError('Invalid start or end zone provided for navigation.', 400, 'NAV_INVALID_PARAMS');
    }

    const cacheKey = `path_${startId}_${endId}`;
    const cached = routeCache.get(cacheKey);
    if (cached) return { ...cached, efficiency: 'cached' };

    const distances = {};
    const previous = {};
    const nodes = new Set();

    Object.keys(networkGraph).forEach(zoneId => {
      distances[zoneId] = Infinity;
      previous[zoneId] = null;
      nodes.add(zoneId);
    });

    distances[startId] = 0;

    while (nodes.size > 0) {
      // O(V) scan - acceptable for stadium network size
      let closest = null;
      for (const node of nodes) {
        if (closest === null || distances[node] < distances[closest]) {
          closest = node;
        }
      }

      if (distances[closest] === Infinity || closest === endId) break;

      nodes.delete(closest);

      const neighbors = networkGraph[closest] || [];
      for (const neighbor of neighbors) {
        if (!nodes.has(neighbor)) continue;

        const cost = this.getZoneCost(neighbor);
        const alt = distances[closest] + cost;

        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = closest;
        }
      }
    }

    const path = [];
    let curr = endId;
    while (curr) {
      path.unshift(curr);
      curr = previous[curr];
    }

    if (path[0] !== startId) {
      googleService.logEvent('WARN', 'Path not found', { from: startId, to: endId });
      return null;
    }

    const mapsData = googleService.generatePathPolyline(path);
    const cost = parseFloat(distances[endId].toFixed(2));

    const result = {
      path,
      meta: {
        totalCost: cost,
        isCrowdOptimized: cost > path.length * 1.2,
        recommendation: cost > path.length * 1.5 
          ? "Heavy congestion detected. Rerouting via alternative concourse for safety." 
          : "Standard route identified with minimal crowd interference.",
        generatedAt: new Date().toISOString()
      },
      maps: mapsData
    };

    googleService.logEvent('INFO', 'Smart Path Generated', { from: startId, to: endId, cost });
    routeCache.set(cacheKey, result);
    return result;
  }
}



module.exports = new NavigationService();
