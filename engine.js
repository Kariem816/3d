// TODO: looking at phi != zero produces funny projections

const CAMERA_SPEED = 20;
const CAMERA_PAN_SPEED = Math.PI;

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const FOV = 90*DEG;
const HALF_FOV = 0.5 * FOV;
const V_FOV = FOV * canvas.height / canvas.width; // adjust for aspect ratio
const HALF_V_FOV = 0.5 * V_FOV;

function clampAngle(a) {
	let realA = a;
	while (realA > Math.PI) {
		realA -= Math.PI*2;
	}
	while (realA < -Math.PI) {
		realA += Math.PI*2;
	}
	return realA;
}

function angleLT(a, b) {
	return clampAngle(a) < clampAngle(b);
}

const POINT_RADIUS = 100;
const LINE_WIDTH = 100;
function renderObject(o) {
	switch (o.type) {
		case "point": {
			const px = (o.coords.x + 1)*canvas.width/2;
			const py = (o.coords.y + 1)*canvas.height/2;
	
			ctx.fillStyle = o.org.color;
			ctx.beginPath();
			ctx.arc(px, py, POINT_RADIUS/o.depth, 0, 2*Math.PI);
			ctx.fill();			
		} break;
		case "line": {
			const p1x = (o.coords[0].x + 1)*canvas.width/2;
			const p1y = (o.coords[0].y + 1)*canvas.height/2;

			const p2x = (o.coords[1].x + 1)*canvas.width/2;
			const p2y = (o.coords[1].y + 1)*canvas.height/2;
	
			ctx.strokeStyle = o.org.color;
			ctx.lineWidth = LINE_WIDTH/o.depth;
			ctx.beginPath();
			ctx.moveTo(p1x, p1y);
			ctx.lineTo(p2x, p2y);
			ctx.stroke();
		} break;
		default:
			throw new Error("Not Implemented");
	}
}

class Renderer {
	constructor(camera) {
		this.camera = camera;
		this.buffer = [];
	}

	dispatch(o) {
		if (o instanceof Vec3) {
			const { x, y, depth} = this.camera.project(o, o.logging);
			if (depth <= 0) return;
			this.buffer.push({
				type: "point",
				coords: {x, y},
				depth,
				org: o,
			});
		} else if (o instanceof Line) {
			//debugger;
			const { x: x1, y: y1, depth: d1 } = this.camera.project(o.p1);
			const { x: x2, y: y2, depth: d2 } = this.camera.project(o.p2);

			if (d1 <= 0 && d2 <= 0) {
				// consider rendering only a part of the line
				// without seeing any ends
				return;
			} else if (d1 <= 0 || d2 <= 0) { // line from p1 or p2 to screen edge
				// halt for now
				return;
				/*
				// this approach is based on a parameter called issue (i)
				// that was returned from inViewport function
				// this parameter told the projection which point overflowed
				// from which side in order to compensate for it
				let nx1, ny1, nx2, ny2;
				let vLine = false, hLine = false;

				const dx = x2 - x1;
				const dy = y2 - y1;
				if (dx === 0) vLine = true;
				if (dy === 0) hLine = true;

				const m = vLine ? 0 : dy / dx;
				const c = y1 - m * x1;
				if (i1 === 1) {
					// line is overflowing the screen from the side (x-axis)
					// clamp it from x axis and get new y
					nx1 = x1 < x2 ? -1 : 1;
					ny1 = hLine ? y1 : m * nx1 + c;
					nx2 = x2;
					ny2 = y2;
				} else if (i1 === 2) {
					// line is overflowing the screen from the top or bottom (y-axis)
					// clamp it from y axis and get new x
					ny1 = y1 < y2 ? -1 : 1;
					nx1 = vLine ? x1 : (ny1 - c) / m;
					nx2 = x2;
					ny2 = y2;
				} else if (i2 == 1) {
					nx1 = x2 < x1 ? -1 : 1;
					ny1 = hLine ? y2 : m * nx1 + c;
					nx2 = x1;
					ny2 = y1;
				} else if (i2 === 2) {
					ny1 = y2 < y1 ? -1 : 1;
					nx1 = vLine ? x2 : (ny1 - c) / m;
					nx2 = x1;
					ny2 = y1;
				} else if (i1 == 3) {
					const angle = Math.abs(Math.atan2(y1, x1));
					if (angle < Math.PI*0.25 || angle > Math.PI*0.75) { // i = 1
						nx1 = x1 < x2 ? -1 : 1;
						ny1 = m * nx1 + c;
					} else { // i = 2
						ny1 = y1 < y2 ? -1 : 1;
						nx1 = (ny1 - c) / m;
					}
					nx2 = x2;
					ny2 = y2;
				} else if (i2 == 3) {
					const angle = Math.abs(Math.atan2(y2, x2));
					if (angle < Math.PI*0.25 || angle > Math.PI*0.75) { // i = 1
						nx1 = x2 < x1 ? -1 : 1;
						ny1 = m * nx1 + c;
					} else { // i = 2
						ny1 = y2 < y1 ? -1 : 1;
						nx1 = (ny1 - c) / m;
					}
					nx2 = x1;
					ny2 = y2;
				} else {
					throw new Error("WTF is the issue??!!");
				}
				this.buffer.push({
					type: "line",
					coords: [{x:nx1, y:ny1}, {x:nx2, y:ny2}],
					depth: (d1+d2)/2,
					org: o,
				});
				*/
			} else {
				this.buffer.push({
					type: "line",
					coords: [{x:x1, y:y1}, {x:x2, y:y2}],
					depth: (d1+d2)/2,
					org: o,
				});
			}
		} else {
			throw new Error("Not Implemented");
		}
	}

	cull() {
		this.buffer.sort((a, b) => b.depth - a.depth);
	}

	render() {
		this.buffer.forEach(renderObject);
		this.buffer.length = 0;
	}
}

class Camera {
	constructor(x, y, z) {
		this.loc = new Vec3(x, y, z);
		this.dir = { theta: 0*DEG,  phi: 0 };
		//const dirVec = Vec3.fromCircular(1, this.dir.theta, this.dir.phi);
		//this.viewPlane = Plane.fromPointNorm(this.loc, dirVec);
	}

	inViewport(theta, phi) {
		// if (this.dir.phi + HALF_V_FOV > 0.5*Math.PI || this.dir.phi - HALF_V_FOV < -0.5*Math.PI) {
		// 	console.warn("This can not be solved using the same formula");
		// }
		if (angleLT(Math.abs(theta - this.dir.theta), HALF_FOV)) {
			if (angleLT(Math.abs(phi - this.dir.phi), HALF_V_FOV)) {
				return true;
			}		
		}
		return false;
	}

	project(p) {
		const dir = Vec3.Sub(p, this.loc);
		const { r, theta, phi } = dir.toCircular();
		const inViewPort = this.inViewport(theta, phi)
		if (p.logging) console.table({x: p.x, y: p.y, z: p.z, r, theta: theta*RAD, phi: phi*RAD, dPhi: (phi-this.dir.phi)*RAD, render: inViewPort});
		if (!inViewPort) return { x: 0, y: 0, depth: -1 };

		const dT = theta-this.dir.theta;
		const dP = phi-this.dir.phi;
		// const d = Math.hypot(1, dT, dP);
		const x = dT/HALF_FOV;
		const y = -dP/HALF_V_FOV;
		// remember -ve sign for HTML canvas
		// html canvas Y-Axis start at zero from top edge
	
		return { x, y, depth: r };
	}

	forward(dt) {
		camera.loc = Vec3.Add(camera.loc, Vec3.fromCircular(CAMERA_SPEED*dt, this.dir.theta, 0));
	}

	backward(dt) {
		camera.loc = Vec3.Sub(camera.loc, Vec3.fromCircular(CAMERA_SPEED*dt, this.dir.theta, 0));
	}

	left(dt) {
		camera.loc = Vec3.Add(camera.loc, Vec3.fromCircular(CAMERA_SPEED*dt, this.dir.theta - 90*DEG, 0));
	}

	right(dt) {
		camera.loc = Vec3.Add(camera.loc, Vec3.fromCircular(CAMERA_SPEED*dt, this.dir.theta + 90*DEG, 0));
	}

	up(dt) {
		camera.loc.z += CAMERA_SPEED*dt;
	}

	down(dt) {
		camera.loc.z -= CAMERA_SPEED*dt;
	}

	lookUp(dt) {
		camera.dir.phi += CAMERA_PAN_SPEED*dt;
		if (camera.dir.phi > Math.PI*0.5) {
			camera.dir.phi = Math.PI*0.5;
		}
	}

	lookDown(dt) {
		camera.dir.phi -= CAMERA_PAN_SPEED*dt;
		if (camera.dir.phi < -Math.PI*0.5) {
			camera.dir.phi = -Math.PI*0.5;
		}
	}

	lookRight(dt) {
		camera.dir.theta += CAMERA_PAN_SPEED*dt;
		if (camera.dir.theta > Math.PI) camera.dir.theta -= 2*Math.PI;
	}

	lookLeft(dt) {
		camera.dir.theta -= CAMERA_PAN_SPEED*dt;
		if (camera.dir.theta < -Math.PI) camera.dir.theta += 2*Math.PI;
	}
}
