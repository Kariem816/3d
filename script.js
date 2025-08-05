const camera = new Camera(-200, 0, 1);
const renderer = new Renderer(camera);
const keyboard = new Map(Object.entries({
	"Space": false,
	"KeyW": false,
	"KeyS": false,
	"KeyA": false,
	"KeyD":	false,
	"KeyE": false,
	"KeyQ": false,
	"keyL": false,
	"Numpad2": false,
	"Numpad4": false,
	"Numpad6": false,
	"Numpad8": false,
}));

function getCube(res) {
	return new Array(res).fill({}).map((_, i) => {
		return new Array(res).fill({}).map((_, j) => {
			return new Array(res).fill({}).map((_, k) => {
				return Vec3.WithColor(
					(i - res/2) * 10,
					(j - res/2) * 10,
					(k - res/2) * 10,
					`#${Math.round(i*255/res).toString(16).padStart(2, "0")}${Math.round(j*255/res).toString(16).padStart(2, "0")}${Math.round(k*255/res).toString(16).padStart(2, "0")}`
				);
			});
		}).flat();
	}).flat();
}

function getSphere(res) {
	return new Array(res).fill(null).map((_, i) => {
		return new Array(res).fill(null).map((_, j) => {
			const theta = (i*2/res-1)*Math.PI;
			const phi = (j*2/res-1)*Math.PI*0.5;
			const v = Vec3.fromCircular(100, theta, phi);
			v.color = `#${Math.round((v.x+100)*255/200).toString(16).padStart(2, "0")}${Math.round((v.y+100)*255/200).toString(16).padStart(2, "0")}${Math.round((v.z+100)*255/200).toString(16).padStart(2, "0")}`
			return v;
		});
	}).flat();
}

// const points = getCube(10);
const points = getSphere(40);

let log = false;
let logging = false;

const dts = [];
function renderFPS(dt) {
	if (dts.push(dt) > 60) dts.shift();
	const dtAvg = dts.reduce((acc, dt) => acc += dt, 0)/dts.length;
	ctx.fillStyle = "snow";
	ctx.fillText(Math.round(1/dtAvg) + " FPS", 0, 0);	
}

let lastTs = 0;
let paused = false;
let pauseCooldown = 0;

function render(ts) {
	const realdt = (ts - lastTs)/1000;
	const dt = paused ? 0 : realdt;
	lastTs = ts;
	if (pauseCooldown > 0) pauseCooldown -= realdt;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	const ll = keyboard.get("KeyL");
	if (!logging && ll) {log = true; points.forEach(p => p.logging = true);};
	logging = ll;

	if (keyboard.get("Space") && pauseCooldown <= 0) {paused = !paused; pauseCooldown = 0.5}
	if (keyboard.get("KeyW")) camera.forward(realdt);
	if (keyboard.get("KeyS")) camera.backward(realdt);
	if (keyboard.get("KeyA")) camera.left(realdt);
	if (keyboard.get("KeyD")) camera.right(realdt);
	if (keyboard.get("KeyE")) camera.up(realdt);
	if (keyboard.get("KeyQ")) camera.down(realdt);
	if (keyboard.get("Numpad2")) camera.lookDown(realdt);
	if (keyboard.get("Numpad4")) camera.lookLeft(realdt);
	if (keyboard.get("Numpad6")) camera.lookRight(realdt);
	if (keyboard.get("Numpad8")) camera.lookUp(realdt);

	points.forEach(p => p.rotate(Math.PI*dt/10, 0, 0));
	points.forEach(p => renderer.dispatch(p));
	log = false;
	points.forEach(p => p.logging = false);

	renderer.cull();
	renderer.render();

	renderFPS(realdt);

	requestAnimationFrame(render);
}

requestAnimationFrame(render);

window.addEventListener("keydown", (e) => {
	if (e.repeat) return;
	keyboard.set(e.code, true);
});

window.addEventListener("keyup", (e) => {
	if (e.repeat) return;
	keyboard.set(e.code, false);
});
