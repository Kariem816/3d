class Matrix {
	#m; // rows count
	#n; // cols count
	#values;
	constructor(m, n) {
		this.#m = m;
		this.#n = n;
		this.#values = new Array(m*n).fill(0);
	}

	get m() {
		return this.#m;
	}

	get n() {
		return this.#n;
	}

	set m(newM) {
		if (newM === this.#m) return;

		if (newM < this.#m) {
			this.#values.length = newM * this.#n;
			this.#m = newM;
			return;
		}
		// newM > this.#m
		for (let i = this.#values.length; i < newM * this.#n; ++i) {
			this.#values[i] = 0;
		}
		this.#m = newM;
	}

	set n(newM) {
		// set n, expand array, copy values
		throw new Error("not implemented");
	}

	get dims() {
		return [this.#m, this.#n];
	}

	at(i, j) {
		if (i <= 0 || i > this.#m || j <= 0 || j > this.#n) throw new Error("out of bounds access");
		return this.#values[(i-1)*this.#n + (j-1)];
	}

	#atZeroed(i, j) {
		//if (i < 0 || i >= this.#m || j < 0 || j >= this.#n) throw new Error("out of bounds access");
		return this.#values[i*this.#n + j];
	}

	setAt(i, j, val) {
		if (i <= 0 || i > this.#m || j <= 0 || j > this.#n) throw new Error("out of bounds access");
		if (typeof val !== "number") throw new Error("type error");
		this.#values[(i-1)*this.#n + (j-1)] = val;
		return this;
	}

	#setAtZeroed(i, j, val) {
		//if (i < 0 || i >= this.#m || j < 0 || j >= this.#n) throw new Error("out of bounds access");
		this.#values[i*this.#n + j] = val;
		return this;
	}

	values(...vals) {
		if (vals.length != this.#values.length) throw new Error("length mismatch");

		for (let i = 0; i < vals.length; ++i) {
			const val = vals[i];
			if (typeof val !== "number") throw new Error("type error");
			this.#values[i] = val;
		}

		return this;
	}

	row(i) {
		if (i <= 0 || i > this.#m) throw new Error("out of bounds access");
		return new Array(this.#n)
			.fill(0)
			.map((_, j) => this.#atZeroed(i-1, j));
	}

	col(j) {
		if (j <= 0 || j > this.#n) throw new Error("out of bounds access");
		return new Array(this.#m)
			.fill(0)
			.map((_, i) => this.#atZeroed(i, j-1));
	}

	get vals() {
		return new Array(this.#m)
			.fill(null)
			.map((_, i) => this.row(i+1));
	}

	times(mat) {
		const a = this;
		const b = mat;

		if (a.n !== b.m) throw new Error("dimensions mismatch");
		const t = a.n; // or b.m

		const res = new Matrix(a.m, b.n);
		for (let i = 1; i <= res.m; ++i) {
			for (let j = 1; j <= res.n; ++j) {
				let val = 0;
				const row = a.row(i);
				const col = b.col(j);
				for (let tt = 0; tt < t; ++tt) {
					val += row[tt] * col[tt];
				}
				res.setAt(i, j, val);
			}
		}
		return res;
	}

	static Mul(...mats) {
		let res;
		for (let i = 0; i < mats.length - 1; ++i) {
			if (res) {
				res = res.times(mats[i+1]);
			} else {
				res = mats[i].times(mats[i+1]);
			}
		}
		return res;
	}
}