export class Mutex {
	#locked = false
	#waiting = []
	async acquire() {
		while (this.#locked) {
			await new Promise((resolve) => this.#waiting.push(resolve))
		}
		this.#locked = true
	}
	release() {
		this.#locked = false
		if (this.#waiting.length) {
			const resolve = this.#waiting.shift()
			resolve()
		}
	}
}
