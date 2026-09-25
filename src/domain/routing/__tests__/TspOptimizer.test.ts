import { describe, it, expect } from 'vitest';
import { TspOptimizer, TourNode } from '../TspOptimizer';

describe('TspOptimizer 2-Opt & Simulated Annealing', () => {
  const cities: TourNode[] = [
    { id: '1', lat: 39.9042, lng: 116.4074, name: 'Beijing' },
    { id: '2', lat: 31.2304, lng: 121.4737, name: 'Shanghai' },
    { id: '3', lat: 23.1291, lng: 113.2644, name: 'Guangzhou' },
    { id: '4', lat: 30.5728, lng: 104.0668, name: 'Chengdu' },
    { id: '5', lat: 34.3416, lng: 108.9398, name: "Xi'an" }
  ];

  it('computes 2-opt optimized route with positive improvement', () => {
    const optimizer = new TspOptimizer(cities);
    const res = optimizer.optimize2Opt(false);

    expect(res.route.length).toBe(cities.length);
    expect(res.totalDistanceKm).toBeLessThanOrEqual(res.initialDistanceKm);
    expect(res.totalDistanceKm).toBeGreaterThan(0);
  });

  it('handles small node sets gracefully', () => {
    const twoCities = cities.slice(0, 2);
    const optimizer = new TspOptimizer(twoCities);
    const res = optimizer.optimize2Opt(false);

    expect(res.route.length).toBe(2);
    expect(res.iterations).toBe(0);
  });

  it('optimizes closed loop circuit', () => {
    const optimizer = new TspOptimizer(cities);
    const openRes = optimizer.optimize2Opt(false);
    const closedRes = optimizer.optimize2Opt(true);

    expect(closedRes.totalDistanceKm).toBeGreaterThan(openRes.totalDistanceKm);
  });

  it('runs Simulated Annealing without divergence', () => {
    const optimizer = new TspOptimizer(cities);
    const res = optimizer.optimizeSimulatedAnnealing(100, 0.95, 500, false);

    expect(res.route.length).toBe(cities.length);
    expect(res.totalDistanceKm).toBeGreaterThan(0);
  });
});
