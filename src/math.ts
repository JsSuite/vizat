export interface Vec {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Affine matrix: [a c e; b d f; 0 0 1]. Column vectors, right-hand multiply applies first. */
export class Matrix {
  constructor(
    public a = 1,
    public b = 0,
    public c = 0,
    public d = 1,
    public e = 0,
    public f = 0,
  ) {}

  multiply(other: Matrix): Matrix {
    const a = this;
    const b = other;
    return new Matrix(
      a.a * b.a + a.c * b.b,
      a.b * b.a + a.d * b.b,
      a.a * b.c + a.c * b.d,
      a.b * b.c + a.d * b.d,
      a.a * b.e + a.c * b.f + a.e,
      a.b * b.e + a.d * b.f + a.f,
    );
  }

  translate(x: number, y: number): Matrix {
    return this.multiply(new Matrix(1, 0, 0, 1, x, y));
  }

  rotate(deg: number): Matrix {
    const r = (deg * Math.PI) / 180;
    const cos = Math.cos(r);
    const sin = Math.sin(r);
    return this.multiply(new Matrix(cos, sin, -sin, cos, 0, 0));
  }

  scale(sx: number, sy: number): Matrix {
    return this.multiply(new Matrix(sx, 0, 0, sy, 0, 0));
  }

  point(x: number, y: number): Vec {
    return {
      x: this.a * x + this.c * y + this.e,
      y: this.b * x + this.d * y + this.f,
    };
  }

  inverse(): Matrix {
    const det = this.a * this.d - this.b * this.c;
    if (Math.abs(det) < 1e-8) return new Matrix();
    const inv = 1 / det;
    return new Matrix(
      this.d * inv,
      -this.b * inv,
      -this.c * inv,
      this.a * inv,
      (this.c * this.f - this.d * this.e) * inv,
      (this.b * this.e - this.a * this.f) * inv,
    );
  }

  /** Length of the transformed X axis — screen pixels per local unit. */
  scaleX(): number {
    return Math.hypot(this.a, this.b) || 1;
  }
}

export function rotateVec(v: Vec, deg: number): Vec {
  const r = (deg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
}

export function vectorFromOrigin(
  lx: number,
  ly: number,
  rotation: number,
  sx: number,
  sy: number,
  ox: number,
  oy: number,
): Vec {
  return rotateVec({ x: (lx - ox) * sx, y: (ly - oy) * sy }, rotation);
}

export function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function aabb(points: Vec[]): Box {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!points.length) return { x: 0, y: 0, width: 0, height: 0 };
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
