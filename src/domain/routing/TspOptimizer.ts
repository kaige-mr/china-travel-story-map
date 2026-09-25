/**
 * TSP (Traveling Salesperson Problem) Itinerary Optimizer
 * Computes optimal travel stop sequence minimizing total travel distance.
 * Implements Nearest Neighbor seed, 2-opt local search heuristic, and Simulated Annealing.
 */

export interface TourNode {
  id: string;
  lat: number;
  lng: number;
  name?: string;
}

export interface OptimizationResult {
  route: TourNode[];
  totalDistanceKm: number;
  iterations: number;
  initialDistanceKm: number;
  improvementPercentage: number;
}

export class TspOptimizer {
  private nodes: TourNode[];
  private distMatrix: number[][] = [];

  constructor(nodes: TourNode[]) {
    this.nodes = [...nodes];
    this.buildDistanceMatrix();
  }

  private buildDistanceMatrix(): void {
    const n = this.nodes.length;
    this.distMatrix = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d = this.haversine(
          this.nodes[i].lat,
          this.nodes[i].lng,
          this.nodes[j].lat,
          this.nodes[j].lng
        );
        this.distMatrix[i][j] = d;
        this.distMatrix[j][i] = d;
      }
    }
  }

  public optimize2Opt(closedLoop = false, maxIterations = 1000): OptimizationResult {
    const n = this.nodes.length;
    if (n <= 2) {
      const dist = this.calculateTotalDistance(this.nodes, closedLoop);
      return {
        route: [...this.nodes],
        totalDistanceKm: dist,
        iterations: 0,
        initialDistanceKm: dist,
        improvementPercentage: 0
      };
    }

    // Step 1: Initial greedy tour
    let order = this.nearestNeighborTour(0);
    const initialDistance = this.calculatePathDistance(order, closedLoop);
    let bestDistance = initialDistance;
    let iterations = 0;
    let improved = true;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      const limit = closedLoop ? n : n - 1;
      for (let i = 1; i < limit - 1; i++) {
        for (let k = i + 1; k < limit; k++) {
          const delta = this.eval2OptDelta(order, i, k, closedLoop);
          if (delta < -1e-4) {
            order = this.apply2OptSwap(order, i, k);
            bestDistance += delta;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }

    const optimizedRoute = order.map(idx => this.nodes[idx]);
    const finalDistance = this.calculateTotalDistance(optimizedRoute, closedLoop);
    const improvement = initialDistance > 0 ? ((initialDistance - finalDistance) / initialDistance) * 100 : 0;

    return {
      route: optimizedRoute,
      totalDistanceKm: Number(finalDistance.toFixed(2)),
      iterations,
      initialDistanceKm: Number(initialDistance.toFixed(2)),
      improvementPercentage: Number(improvement.toFixed(2))
    };
  }

  public optimizeSimulatedAnnealing(
    initialTemp = 1000,
    coolingRate = 0.995,
    maxSteps = 5000,
    closedLoop = false
  ): OptimizationResult {
    const n = this.nodes.length;
    if (n <= 2) {
      return this.optimize2Opt(closedLoop, 1);
    }

    let currentOrder = this.nearestNeighborTour(0);
    let currentDistance = this.calculatePathDistance(currentOrder, closedLoop);
    let bestOrder = [...currentOrder];
    let bestDistance = currentDistance;
    const initialDistance = currentDistance;

    let temp = initialTemp;
    let step = 0;

    while (temp > 0.1 && step < maxSteps) {
      step++;
      const i = 1 + Math.floor(Math.random() * (n - 2));
      const j = i + 1 + Math.floor(Math.random() * (n - i - 1));

      const newOrder = this.apply2OptSwap(currentOrder, i, j);
      const newDistance = this.calculatePathDistance(newOrder, closedLoop);
      const diff = newDistance - currentDistance;

      if (diff < 0 || Math.exp(-diff / temp) > Math.random()) {
        currentOrder = newOrder;
        currentDistance = newDistance;
        if (currentDistance < bestDistance) {
          bestOrder = [...currentOrder];
          bestDistance = currentDistance;
        }
      }

      temp *= coolingRate;
    }

    const optimizedRoute = bestOrder.map(idx => this.nodes[idx]);
    const finalDistance = this.calculateTotalDistance(optimizedRoute, closedLoop);
    const improvement = initialDistance > 0 ? ((initialDistance - finalDistance) / initialDistance) * 100 : 0;

    return {
      route: optimizedRoute,
      totalDistanceKm: Number(finalDistance.toFixed(2)),
      iterations: step,
      initialDistanceKm: Number(initialDistance.toFixed(2)),
      improvementPercentage: Number(improvement.toFixed(2))
    };
  }

  private nearestNeighborTour(startIndex: number): number[] {
    const n = this.nodes.length;
    const visited = new Set<number>([startIndex]);
    const tour: number[] = [startIndex];

    let current = startIndex;
    while (tour.length < n) {
      let nearest = -1;
      let minDistance = Infinity;

      for (let i = 0; i < n; i++) {
        if (!visited.has(i) && this.distMatrix[current][i] < minDistance) {
          minDistance = this.distMatrix[current][i];
          nearest = i;
        }
      }

      if (nearest !== -1) {
        visited.add(nearest);
        tour.push(nearest);
        current = nearest;
      }
    }

    return tour;
  }

  private apply2OptSwap(tour: number[], i: number, k: number): number[] {
    const newTour = tour.slice(0, i);
    const reversed = tour.slice(i, k + 1).reverse();
    return newTour.concat(reversed).concat(tour.slice(k + 1));
  }

  private eval2OptDelta(tour: number[], i: number, k: number, closed: boolean): number {
    const n = tour.length;
    const a = tour[i - 1];
    const b = tour[i];
    const c = tour[k];
    const d = k + 1 < n ? tour[k + 1] : closed ? tour[0] : -1;

    const currentEdge1 = this.distMatrix[a][b];
    const currentEdge2 = d !== -1 ? this.distMatrix[c][d] : 0;
    const newEdge1 = this.distMatrix[a][c];
    const newEdge2 = d !== -1 ? this.distMatrix[b][d] : 0;

    return newEdge1 + newEdge2 - (currentEdge1 + currentEdge2);
  }

  private calculatePathDistance(indices: number[], closed: boolean): number {
    let d = 0;
    for (let i = 0; i < indices.length - 1; i++) {
      d += this.distMatrix[indices[i]][indices[i + 1]];
    }
    if (closed && indices.length > 2) {
      d += this.distMatrix[indices[indices.length - 1]][indices[0]];
    }
    return d;
  }

  private calculateTotalDistance(route: TourNode[], closed: boolean): number {
    let sum = 0;
    for (let i = 0; i < route.length - 1; i++) {
      sum += this.haversine(route[i].lat, route[i].lng, route[i + 1].lat, route[i + 1].lng);
    }
    if (closed && route.length > 2) {
      sum += this.haversine(route[route.length - 1].lat, route[route.length - 1].lng, route[0].lat, route[0].lng);
    }
    return sum;
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
