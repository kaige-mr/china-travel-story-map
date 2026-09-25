import { describe, it, expect, beforeEach } from 'vitest';
import { QuadTree, createBoundingBox, containsPoint, intersectsBox, Point2D } from '../QuadTree';

describe('QuadTree Spatial Index Engine', () => {
  let qt: QuadTree<Point2D>;

  beforeEach(() => {
    // 0 to 100 on both axes
    const box = createBoundingBox(0, 0, 100, 100);
    qt = new QuadTree(box, 4, 8);
  });

  it('correctly reports bounding box containment', () => {
    const box = createBoundingBox(10, 10, 50, 50);
    expect(containsPoint(box, { x: 30, y: 30 })).toBe(true);
    expect(containsPoint(box, { x: 5, y: 30 })).toBe(false);
    expect(containsPoint(box, { x: 60, y: 30 })).toBe(false);
  });

  it('correctly reports bounding box intersection', () => {
    const box1 = createBoundingBox(0, 0, 20, 20);
    const box2 = createBoundingBox(10, 10, 30, 30);
    const box3 = createBoundingBox(40, 40, 60, 60);

    expect(intersectsBox(box1, box2)).toBe(true);
    expect(intersectsBox(box1, box3)).toBe(false);
  });

  it('inserts points and tracks size', () => {
    expect(qt.size()).toBe(0);
    expect(qt.insert({ x: 10, y: 10, id: 'p1' })).toBe(true);
    expect(qt.insert({ x: 20, y: 20, id: 'p2' })).toBe(true);
    expect(qt.insert({ x: 200, y: 200, id: 'outside' })).toBe(false);
    expect(qt.size()).toBe(2);
  });

  it('subdivides upon exceeding node capacity', () => {
    for (let i = 0; i < 20; i++) {
      qt.insert({ x: i * 4, y: i * 4, id: `p${i}` });
    }
    expect(qt.size()).toBe(20);
  });

  it('queries rectangular range accurately', () => {
    for (let i = 0; i < 10; i++) {
      qt.insert({ x: i * 10, y: i * 10, id: `p${i}` });
    }

    const range = createBoundingBox(25, 25, 65, 65);
    const results = qt.queryRange(range);
    const ids = results.map(r => r.id).sort();

    expect(ids).toEqual(['p3', 'p4', 'p5', 'p6']);
  });

  it('queries radial circular distance', () => {
    qt.insert({ x: 50, y: 50, id: 'center' });
    qt.insert({ x: 52, y: 50, id: 'near' });
    qt.insert({ x: 80, y: 80, id: 'far' });

    const results = qt.queryRadius({ x: 50, y: 50 }, 5);
    const ids = results.map(r => r.id).sort();
    expect(ids).toEqual(['center', 'near']);
  });

  it('finds k-nearest neighbors', () => {
    qt.insert({ x: 10, y: 10, id: 'p10' });
    qt.insert({ x: 20, y: 20, id: 'p20' });
    qt.insert({ x: 30, y: 30, id: 'p30' });
    qt.insert({ x: 80, y: 80, id: 'p80' });

    const nearest = qt.findNearest({ x: 18, y: 18 }, 2);
    expect(nearest.length).toBe(2);
    expect(nearest[0].id).toBe('p20');
    expect(nearest[1].id).toBe('p10');
  });

  it('clears all points', () => {
    qt.insert({ x: 10, y: 10 });
    qt.insert({ x: 20, y: 20 });
    expect(qt.size()).toBe(2);

    qt.clear();
    expect(qt.size()).toBe(0);
  });
});
