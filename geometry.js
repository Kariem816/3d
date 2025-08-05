// TODO: does not blend
function colorBlend(c1, c2) {
	const rc1 = parseInt(c1.slice(1), 16);
	const r1 = (rc1 >> 0*8) & 0xFF;
	const g1 = (rc1 >> 1*8) & 0xFF;
	const b1 = (rc1 >> 2*8) & 0xFF;

	const rc2 = parseInt(c2.slice(1), 16);
	const r2 = (rc2 >> 0*8) & 0xFF;
	const g2 = (rc2 >> 1*8) & 0xFF;
	const b2 = (rc2 >> 2*8) & 0xFF;

	const rr = r1 * r2 / 255;
	const gr = g1 * g2 / 255;
	const br = b1 * b2 / 255;
	return `#${Math.round(rr).toString(16).padStart(2, "0")}${Math.round(gr).toString(16).padStart(2, "0")}${Math.round(br).toString(16).padStart(2, "0")}`;
}

function transMatrixYaw(yaw) {
	const cos = Math.cos(yaw);
	const sin = Math.sin(yaw);
	return new Matrix(3, 3)
		.values(
			cos , sin, 0,
			-sin, cos, 0,
			0   , 0  , 1,
		);
}

function transMatrixPitch(pitch) {
	const cos = Math.cos(pitch);
	const sin = Math.sin(pitch);
	return new Matrix(3, 3)
		.values(
			cos , 0, sin,
			0   , 1, 0  ,
			-sin, 0, cos,
		);
}

function transMatrixRoll(roll) {
	const cos = Math.cos(roll);
	const sin = Math.sin(roll);
	return new Matrix(3, 3)
		.values(
			1, 0   , 0  ,
			0, cos , sin,
			0, -sin, cos,
		);
}

function transMatrix(yaw, pitch, roll) {
	return Matrix.Mul(transMatrixYaw(yaw), transMatrixPitch(pitch), transMatrixRoll(roll));
}

class Vec3 {
	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.color = "#ffffff";
	}

	static WithColor(x, y, z, color) {
		const v = new Vec3(x, y, z);
		v.color = color;
		return v;
	}

	// I might have got the names wrong
	// Rotation around axes in order: Z-Axis, Y-Axis, X-Axis
	rotate(yaw, pitch, roll, around = { x: 0, y: 0, z: 0 }) {
		const x = this.x - around.x;
		const y = this.y - around.y;
		const z = this.z - around.z;

		/*
			const sin0 = Math.sin(yaw);
			const cos0 = Math.cos(yaw);
			const sinO = Math.sin(pitch);
			const cosO = Math.cos(pitch);
			const sinw = Math.sin(roll);
			const cosw = Math.cos(roll);

			const newX = x*         cos0*cosO          - y*          sin0*cosO         - z*   sinO;
			const newY = x* (sin0*cosw-cos0*sinO*sinw) + y* (cos0*cosw+sin0*sinO*sinw) - z* cosO*sinw;
			const newZ = x* (sin0*sinw+cos0*sinO*cosw) + y* (cos0*sinw-sin0*sinO*cosw) + z* cosO*cosw;
		*/

		// Matrices look cooler to the uneducated eye than Math uggh
		const mat   = new Matrix(1, 3).values(x, y, z);
		const trans = transMatrix(yaw, pitch, roll);
		const res   = mat.times(trans);

		this.x = res.at(1, 1) + around.x;
		this.y = res.at(1, 2) + around.y;
		this.z = res.at(1, 3) + around.z;
	}

	toCircular() {
		const xy = Math.hypot(this.x, this.y);
		const r = Math.hypot(xy, this.z);
		const phi = Math.atan2(this.z, xy);
		const theta = Math.atan2(this.y, this.x);

		return { r, theta, phi };
	}

	normalize() {
		const mag = Math.hypot(this.x, this.y, this.z);
		if (mag === 0) {console.log(this);throw new Error("Zero magnitude");}
		return new Vec3(this.x/mag, this.y/mag, this.z/mag);
	}

	scale(s) {
		return new Vec3(this.x*s, this.y*s, this.z*s);
	}

	// TODO: remember to remove this
	projections() {
		return [
			new Line(Vec3.WithColor(0, 0, 0, this.color), this),
			new Line(Vec3.WithColor(0, 0, 0, "#999999"), new Vec3(this.x, this.y, 0)),
			new Line(Vec3.WithColor(this.x, this.y, 0, "#AAAA00"), this),
			new Line(Vec3.WithColor(this.x, 0, 0, "#AA0000"), new Vec3(this.x, this.y, 0)),
			new Line(Vec3.WithColor(0, this.y, 0, "#00AA00"), new Vec3(this.x, this.y, 0)),
			new Line(Vec3.WithColor(0, 0, this.z, "#0000AA"), this),
		];
	}

	static fromCircular(r, theta, phi) {
		const xy = r*Math.cos(phi);
		return new Vec3(xy*Math.cos(theta), xy*Math.sin(theta), r*Math.sin(phi));
	}

	static Add(p1, p2) {
		return new Vec3(p1.x + p2.x, p1.y + p2.y, p1.z + p2.z);
	}

	static Sub(p1, p2) {
		return new Vec3(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z);
	}
}

class Line {
	constructor(p1, p2) {
		this.p1 = p1;
		this.p2 = p2;
		this.color = p1.color; // colorBlend(p1.color, p2.color);
	}

	dir() {
		return Vec3.Sub(this.p1, this.p2);
	}
}

class Plane {
	constructor(a, b, c, d) {
		const normMag = Math.hypot(a, b, c);
		if (normMag === 0) throw new Error("WTF!!");
		this.a = a / normMag;
		this.b = b / normMag;
		this.c = c / normMag;
		this.d = d / normMag;
	}

	static fromPointNorm(p, n) {
		const nn = n.normalize();
		const d = p.x * nn.x + p.y * nn.y + p.z * nn.z;
		return new Plane(nn.x, nn.y, nn.z, d);
	}

	intersectLine(l) {
		const dir = l.dir();
		const denom = this.a*dir.x + this.b*dir.y + this.c*dir.z;
		if (denom === 0) return null;
		const num = this.d - this.a*l.p1.x - this.b*l.p1.y - this.c*l.p1.z;

		const k = num / denom;
		return Vec3.Add(l.p1, dir.scale(k));
	}
}
