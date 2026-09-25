/**
 * QuadTree Spatial Indexing Engine
 * Provides 2D spatial subdivision for high-density travel waypoints and points of interest.
 * Supports efficient rectangular range queries, radial circular queries, and k-NN search.
 */

export interface Point2D {
  x: number;
  y: number;
  id?: string;
  data?: unknown;
}

export interface BoundingBox2D {
  x: number;      // Center X
  y: number;      // Center Y
  halfWidth: number;
  halfHeight: number;
}

export function createBoundingBox(minX: number, minY: number, maxX: number, maxY: number): BoundingBox2D {
  const halfWidth = (maxX - minX) / 2;
  const halfHeight = (maxY - minY) / 2;
  return {
    x: minX + halfWidth,
    y: minY + halfHeight,
    halfWidth: Math.abs(halfWidth),
    halfHeight: Math.abs(halfHeight)
  };
}

export function containsPoint(box: BoundingBox2D, p: Point2D): boolean {
  return (
    p.x >= box.x - box.halfWidth &&
    p.x <= box.x + box.halfWidth &&
    p.y >= box.y - box.halfHeight &&
    p.y <= box.y + box.halfHeight
  );
}

export function intersectsBox(a: BoundingBox2D, b: BoundingBox2D): boolean {
  return !(
    b.x - b.halfWidth > a.x + a.halfWidth ||
    b.x + b.halfWidth < a.x - a.halfWidth ||
    b.y - b.halfHeight > a.y + a.halfHeight ||
    b.y + b.halfHeight < a.y - a.halfHeight
  );
}

export class QuadTreeNode<T extends Point2D> {
  public boundary: BoundingBox2D;
  public capacity: number;
  public points: T[] = [];
  public divided = false;
  public depth: number;
  public maxDepth: number;

  public northwest?: QuadTreeNode<T>;
  public northeast?: QuadTreeNode<T>;
  public southwest?: QuadTreeNode<T>;
  public southeast?: QuadTreeNode<T>;

  constructor(boundary: BoundingBox2D, capacity = 4, depth = 0, maxDepth = 12) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.depth = depth;
    this.maxDepth = maxDepth;
  }

  public insert(point: T): boolean {
    if (!containsPoint(this.boundary, point)) {
      return false;
    }

    if (this.points.length < this.capacity || this.depth >= this.maxDepth) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    return (
      (this.northwest?.insert(point) ?? false) ||
      (this.northeast?.insert(point) ?? false) ||
      (this.southwest?.insert(point) ?? false) ||
      (this.southeast?.insert(point) ?? false)
    );
  }

  public subdivide(): void {
    const x = this.boundary.x;
    const y = this.boundary.y;
    const hw = this.boundary.halfWidth / 2;
    const hh = this.boundary.halfHeight / 2;
    const nextDepth = this.depth + 1;

    this.northwest = new QuadTreeNode<T>({ x: x - hw, y: y + hh, halfWidth: hw, halfHeight: hh }, this.capacity, nextDepth, this.maxDepth);
    this.northeast = new QuadTreeNode<T>({ x: x + hw, y: y + hh, halfWidth: hw, halfHeight: hh }, this.capacity, nextDepth, this.maxDepth);
    this.southwest = new QuadTreeNode<T>({ x: x - hw, y: y - hh, halfWidth: hw, halfHeight: hh }, this.capacity, nextDepth, this.maxDepth);
    this.southeast = new QuadTreeNode<T>({ x: x + hw, y: y - hh, halfWidth: hw, halfHeight: hh }, this.capacity, nextDepth, this.maxDepth);
    this.divided = true;

    // Distribute existing points to children
    const existing = [...this.points];
    this.points = [];
    for (const p of existing) {
      this.insert(p);
    }
  }

  public query(range: BoundingBox2D, found: T[] = []): T[] {
    if (!intersectsBox(this.boundary, range)) {
      return found;
    }

    for (const p of this.points) {
      if (containsPoint(range, p)) {
        found.push(p);
      }
    }

    if (this.divided) {
      this.northwest?.query(range, found);
      this.northeast?.query(range, found);
      this.southwest?.query(range, found);
      this.southeast?.query(range, found);
    }

    return found;
  }

  public queryRadius(center: Point2D, radius: number, found: T[] = []): T[] {
    const rBox: BoundingBox2D = {
      x: center.x,
      y: center.y,
      halfWidth: radius,
      halfHeight: radius
    };

    if (!intersectsBox(this.boundary, rBox)) {
      return found;
    }

    const r2 = radius * radius;
    for (const p of this.points) {
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      if (dx * dx + dy * dy <= r2) {
        found.push(p);
      }
    }

    if (this.divided) {
      this.northwest?.queryRadius(center, radius, found);
      this.northeast?.queryRadius(center, radius, found);
      this.southwest?.queryRadius(center, radius, found);
      this.southeast?.queryRadius(center, radius, found);
    }

    return found;
  }

  public count(): number {
    let count = this.points.length;
    if (this.divided) {
      count += (this.northwest?.count() ?? 0);
      count += (this.northeast?.count() ?? 0);
      count += (this.southwest?.count() ?? 0);
      count += (this.southeast?.count() ?? 0);
    }
    return count;
  }

  public clear(): void {
    this.points = [];
    this.divided = false;
    this.northwest = undefined;
    this.northeast = undefined;
    this.southwest = undefined;
    this.southeast = undefined;
  }
}

export class QuadTree<T extends Point2D> {
  private root: QuadTreeNode<T>;

  constructor(boundary: BoundingBox2D, capacity = 4, maxDepth = 12) {
    this.root = new QuadTreeNode<T>(boundary, capacity, 0, maxDepth);
  }

  public insert(point: T): boolean {
    return this.root.insert(point);
  }

  public insertMany(points: T[]): number {
    let inserted = 0;
    for (const p of points) {
      if (this.root.insert(p)) {
        inserted++;
      }
    }
    return inserted;
  }

  public queryRange(range: BoundingBox2D): T[] {
    return this.root.query(range, []);
  }

  public queryRadius(center: Point2D, radius: number): T[] {
    return this.root.queryRadius(center, radius, []);
  }

  public findNearest(target: Point2D, k = 1, initialRadius = 1.0, maxRadius = 180.0): T[] {
    let radius = initialRadius;
    let results: T[] = [];

    while (radius <= maxRadius) {
      results = this.queryRadius(target, radius);
      if (results.length >= k) {
        break;
      }
      radius *= 2;
    }

    return results
      .map(p => ({
        point: p,
        distanceSq: (p.x - target.x) ** 2 + (p.y - target.y) ** 2
      }))
      .sort((a, b) => a.distanceSq - b.distanceSq)
      .slice(0, k)
      .map(item => item.point);
  }

  public size(): number {
    return this.root.count();
  }

  public clear(): void {
    this.root.clear();
  }
}
