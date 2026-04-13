const { networkGraph, zones } = require('../data/venueData');
const googleService = require('./googleService');
const NodeCache = require('node-cache');

// Cache route results for 5 minutes to optimize performance
const routeCache = new NodeCache({ stdTTL: 300 });

/**
 * Service for venue navigation and pathfinding.
 * Employs Dijkstra's algorithm for crowd-aware routing.
 */
class NavigationService {

  /**
   * Calculates the 'cost' of traversing a zone based on its current density.
   * @param {string} zoneId - The unique ID of the zone.
   * @returns {number} The calculated cost.
   */
  getZoneCost(zoneId) {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return 1000; // Return high cost if zone is invalid
    return 1 + (zone.density / 10);
  }

  /**
   * Finds the most efficient path between two zones, avoiding high-density areas.
   * @param {string} startId - Starting zone ID.
   * @param {string} endId - Destination zone ID.
   * @returns {Object|null} Optimized path data or null if unreachable.
   */
  findSmartPath(startId, endId) {
    if (!networkGraph[startId] || !networkGraph[endId]) {
      googleService.logEvent('WARN', 'Invalid navigation parameters', { startId, endId });
      return null;
    }

    const cacheKey = `${startId}_to_${endId}`;
    const cachedResult = routeCache.get(cacheKey);
    
    if (cachedResult) {
      return { ...cachedResult, status: 'cached' };
    }

    // Dijkstra algorithm implementation
    const distances = {};
    const previousNodes = {};
    const unvisitedNodes = new Set();

    // Initialization
    for (const zoneId in networkGraph) {
      distances[zoneId] = Infinity;
      previousNodes[zoneId] = null;
      unvisitedNodes.add(zoneId);
    }
    
    distances[startId] = 0;

    while (unvisitedNodes.size > 0) {
      // Find node with minimum distance
      let currentZoneId = null;
      for (const zoneId of unvisitedNodes) {
        if (currentZoneId === null || distances[zoneId] < distances[currentZoneId]) {
          currentZoneId = zoneId;
        }
      }

      // Exit if destination reached or min distance is Infinity (remaining unreachable)
      if (currentZoneId === null || distances[currentZoneId] === Infinity || currentZoneId === endId) {
        break;
      }

      unvisitedNodes.delete(currentZoneId);

      const neighbors = networkGraph[currentZoneId] || [];
      for (const neighborId of neighbors) {
        if (!unvisitedNodes.has(neighborId)) continue;

        const edgeCost = this.getZoneCost(neighborId);
        const alt = distances[currentZoneId] + edgeCost;

        if (alt < distances[neighborId]) {
          distances[neighborId] = alt;
          previousNodes[neighborId] = currentZoneId;
        }
      }
    }

    // Path reconstruction
    const path = [];
    let tracer = endId;
    while (tracer) {
      path.unshift(tracer);
      tracer = previousNodes[tracer];
    }

    if (path[0] !== startId) {
      googleService.logEvent('WARN', 'Route not found during search', { from: startId, to: endId });
      return null;
    }

    // Enrichment and response formatting
    const mapEnrichment = googleService.generatePathPolyline(path);
    const pathZonesData = path.map(id => zones.find(z => z.id === id)).filter(Boolean);
    const totalPathCost = path.reduce((total, id) => total + this.getZoneCost(id), 0);

    const result = {
      pathIds: path,
      zones: pathZonesData,
      cost: parseFloat(totalPathCost.toFixed(2)),
      maps_data: mapEnrichment,
      benefit: totalPathCost > path.length * 1.5 
        ? "Heavy crowds detected. Rerouting for comfort." 
        : "Clear path identified. Direct route suggested.",
      type: 'Weighted Optimality',
      timestamp: new Date().toISOString()
    };

    googleService.logEvent('INFO', 'Route generated', { from: startId, to: endId, cost: totalPathCost });
    routeCache.set(cacheKey, result);
    return result;
  }
}


module.exports = new NavigationService();
