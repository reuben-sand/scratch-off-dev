<template>
	<img
		class="border border-1"
		:width="boardCanvasWidth"
		:height="boardCanvasHeight"
		:src="imageSrc"
		alt="刮刮樂內部圖案"
	/>
	<canvas
		ref="outerCanvas"
		class="border border-1"
		:width="boardCanvasWidth"
		:height="boardCanvasHeight"
		:style="cursorStyle"
		@mousedown="!isRoomOwner ? canvasMousedown($event) : null"
		@mousemove="!isRoomOwner ? canvasMousemove($event) : null"
		@mouseup="!isRoomOwner ? canvasMouseup() : null"
	></canvas>
	<Teleport to="body">
		<GameOverModal
			ref="gameOverModal"
			:game-result="gameResult"
			@delay-dispose="delayModalDispose"
		/>
	</Teleport>
</template>

<script setup>
	import { ref, computed, onMounted, useTemplateRef, onBeforeUnmount } from 'vue'
	import { useRoute } from 'vue-router'
	import { onValue, ref as realtimeRef, update } from 'firebase/database'
	import { storeToRefs } from 'pinia'
	import keySvgPath from '@/assets/key.svg'
	import { realtimeDB } from '@/firebase'
	import { useBoardStore } from '@/stores/BoardStore'
	import { useUserStore } from '@/stores/UserStore'
	import GameOverModal from './GameOverModal.vue'
	import { Mutex } from '@/composables/useLock'

	/* pinia store */
	const boardStore = useBoardStore()
	const { boardCanvasWidth, boardCanvasHeight } = storeToRefs(boardStore)
	const userStore = useUserStore()
	const { isRoomOwner } = storeToRefs(userStore)

	/* vue router */
	const route = useRoute()
	const roomId = route.params.roomId

	/* props */
	const { scratchOffTemplate, gameResult } = defineProps({
		scratchOffTemplate: Object,
		gameResult: Boolean,
	})

	/* 模板ref */
	const outerCanvasRef = useTemplateRef('outerCanvas')
	const gameOverModalRef = useTemplateRef('gameOverModal')

	const imageSrc = ref('')

	let minX, maxX, minY, maxY
	let opacityPixelPoints = new Set()
	let pointsSize
	const makeInnerScratchOff = async () => {
		const offscreenCanvas = new OffscreenCanvas(boardCanvasWidth.value, boardCanvasHeight.value)
		const ctx = offscreenCanvas.getContext('2d')
		const clipPath = new Path2D()
		let subPathData = scratchOffTemplate.range.actions[0]
		minX = subPathData.x
		maxX = subPathData.x
		minY = subPathData.y
		maxY = subPathData.y
		if (scratchOffTemplate.range.actions.length > 0) {
			clipPath.moveTo(subPathData.x, subPathData.y)
		}
		for (let i = 1; i < scratchOffTemplate.range.actions.length; i++) {
			subPathData = scratchOffTemplate.range.actions[i]
			minX = Math.min(minX, subPathData.x)
			maxX = Math.max(maxX, subPathData.x)
			minY = Math.min(minY, subPathData.y)
			maxY = Math.max(maxY, subPathData.y)
			clipPath.lineTo(subPathData.x, subPathData.y)
		}
		clipPath.closePath()

		ctx.save()
		ctx.clip(clipPath)
		ctx.fillRect(0, 0, boardCanvasWidth.value, boardCanvasHeight.value)
		const imageData = ctx.getImageData(minX, minY, maxX - minX, maxY - minY)

		for (let i = 3; i <= imageData.data.length; i += 4) {
			if (imageData.data[i] > 0) {
				opacityPixelPoints.add(i)
			}
		}
		pointsSize = opacityPixelPoints.size

		ctx.restore()
		ctx.save()
		ctx.clearRect(0, 0, boardCanvasWidth.value, boardCanvasHeight.value)
		ctx.lineWidth = 2
		ctx.stroke(clipPath)

		ctx.restore()
		ctx.save()

		ctx.clip(clipPath)
		scratchOffTemplate.inner.forEach((pathData) => {
			ctx.save()
			ctx.beginPath()
			if (pathData.tool === 'pen') {
				ctx.lineWidth = 2
				ctx.strokeStyle = pathData.color
				subPathData = pathData.actions[0]
				if (pathData.actions.length > 0) {
					ctx.moveTo(subPathData.x, subPathData.y)
				}
				for (let i = 1; i < pathData.actions.length; i++) {
					subPathData = pathData.actions[i]
					ctx.lineTo(subPathData.x, subPathData.y)
					ctx.stroke()
					ctx.moveTo(subPathData.x, subPathData.y)
				}
			} else if (pathData.tool === 'eraser') {
				ctx.lineWidth = 10
				ctx.globalCompositeOperation = 'destination-out'
				subPathData = pathData.actions[0]
				if (pathData.actions.length > 0) {
					ctx.moveTo(subPathData.x, subPathData.y)
				}
				for (let i = 1; i < pathData.actions.length; i++) {
					subPathData = pathData.actions[i]
					ctx.lineTo(subPathData.x, subPathData.y)
					ctx.stroke()
					ctx.moveTo(subPathData.x, subPathData.y)
				}
			} else if (pathData.tool === 'fonts') {
				ctx.fillStyle = pathData.color
				ctx.textBaseline = 'top'
				ctx.font = "16px 'Noto Sans TC', sans-serif"
				ctx.fillText(pathData.textContent, pathData.actions[0].x, pathData.actions[0].y)
			} else if (pathData.tool === 'fill') {
				ctx.fillStyle = pathData.color
				ctx.fillRect(0, 0, boardCanvasWidth.value, boardCanvasHeight.value)
			}
			ctx.restore()
		})

		ctx.restore()

		const blob = await offscreenCanvas.convertToBlob()
		const url = URL.createObjectURL(blob)
		imageSrc.value = url
	}
	const drawOuterCanvas = () => {
		/* 執行過程中，會頻繁讀取imageData，所以需要在一開始引用ctx時，就先設定willReadFrequently: true，browser只會在一開始成功建立該類型context時讀取options， */
		const ctx = outerCanvasRef.value.getContext('2d', { willReadFrequently: true })
		scratchOffTemplate.outer.forEach((pathData) => {
			ctx.save()
			ctx.beginPath()
			let subPathData = pathData.actions[0]
			if (pathData.tool === 'pen') {
				ctx.lineWidth = 2
				ctx.strokeStyle = pathData.color
				subPathData = pathData.actions[0]
				if (pathData.actions.length > 0) {
					ctx.moveTo(subPathData.x, subPathData.y)
				}
				for (let i = 1; i < pathData.actions.length; i++) {
					subPathData = pathData.actions[i]
					ctx.lineTo(subPathData.x, subPathData.y)
					ctx.stroke()
					ctx.moveTo(subPathData.x, subPathData.y)
				}
			} else if (pathData.tool === 'eraser') {
				ctx.lineWidth = 10
				ctx.globalCompositeOperation = 'destination-out'
				subPathData = pathData.actions[0]
				if (pathData.actions.length > 0) {
					ctx.moveTo(subPathData.x, subPathData.y)
				}
				for (let i = 1; i < pathData.actions.length; i++) {
					subPathData = pathData.actions[i]
					ctx.lineTo(subPathData.x, subPathData.y)
					ctx.stroke()
					ctx.moveTo(subPathData.x, subPathData.y)
				}
			} else if (pathData.tool === 'fonts') {
				ctx.fillStyle = pathData.color
				ctx.textBaseline = 'top'
				ctx.font = "16px 'Noto Sans TC', sans-serif"
				ctx.fillText(pathData.textContent, pathData.actions[0].x, pathData.actions[0].y)
			} else if (pathData.tool === 'fill') {
				ctx.fillStyle = pathData.color
				ctx.fillRect(0, 0, boardCanvasWidth.value, boardCanvasHeight.value)
			}
			ctx.restore()
		})
	}

	let beginDrawing = false
	let path
	let scratchOffPathData = []
	let oneStep
	let x
	let y
	const canvasMousedown = (event) => {
		const ctx = outerCanvasRef.value.getContext('2d')
		ctx.save()
		ctx.lineCap = 'square'
		ctx.lineWidth = 10
		ctx.globalCompositeOperation = 'destination-out'
		const rect = outerCanvasRef.value.getBoundingClientRect()
		const scaleX = rect.width / boardCanvasWidth.value
		const scaleY = rect.height / boardCanvasHeight.value
		x = Math.floor((event.clientX - rect.left) / scaleX)
		y = Math.floor((event.clientY - rect.top) / scaleY)
		beginDrawing = true
		path = new Path2D()
		path.moveTo(x, y)
		scratchOffPathData.push({ x: x, y: y })
		oneStep = true
	}
	const canvasMousemove = (event) => {
		if (beginDrawing) {
			const ctx = outerCanvasRef.value.getContext('2d')
			const rect = outerCanvasRef.value.getBoundingClientRect()
			const scaleX = rect.width / boardCanvasWidth.value
			const scaleY = rect.height / boardCanvasHeight.value
			const currentX = Math.floor((event.clientX - rect.left) / scaleX)
			const currentY = Math.floor((event.clientY - rect.top) / scaleY)
			if (Math.abs(currentX - x) > 4 || Math.abs(currentY - y) > 4) {
				scratchOffPathData.push({ x: currentX, y: currentY })
				if (oneStep) {
					path.lineTo(currentX, currentY)
					ctx.stroke(path)
					x = currentX
					y = currentY
					oneStep = false
				} else {
					path = new Path2D()
					path.moveTo(x, y)
					path.lineTo(currentX, currentY)
					ctx.stroke(path)
					x = currentX
					y = currentY
				}
			}
		}
	}
	let pathIndex = 0
	let isCancelled = false
	const playerActionsRef = realtimeRef(realtimeDB, 'rooms/' + roomId + '/playerActions')
	const canvasMouseup = async () => {
		await update(playerActionsRef, {
			['path' + pathIndex]: scratchOffPathData,
		})
		pathIndex++
		const ctx = outerCanvasRef.value.getContext('2d')
		scratchOffPathData = []
		beginDrawing = false
		ctx.restore()
		const imageData = ctx.getImageData(minX, minY, maxX - minX, maxY - minY)
		for (const i of opacityPixelPoints) {
			if (imageData.data[i] === 0) {
				opacityPixelPoints.delete(i)
			}
		}
		if (opacityPixelPoints.size < Math.floor(pointsSize / 4)) {
			if (isCancelled) return
			gameOverModalRef.value.getOrCreateModal().show()
		}
	}
	const cursorStyle = computed(() => {
		if (isRoomOwner.value) {
			return { cursor: 'not-allowed' }
		} else {
			return { cursor: `url("${keySvgPath}") 0 16, auto` }
		}
	})
	const unsubscribes = []
	const modalMutex = new Mutex()
	const delayBsInstanceDispose = async (delay, ...mutexs) => {
		const startTime = performance.now()

		if (mutexs.length > 1) {
			await Promise.all(
				mutexs.map((mutex) => {
					mutex.acquire()
				}),
			)
		} else {
			await mutexs[0].acquire()
		}

		const elapsedTime = performance.now() - startTime
		const remaining = delay - Math.floor(elapsedTime)

		if (remaining > 0) {
			await new Promise((resolve) => setTimeout(resolve, remaining))
		}
		if (mutexs.length > 1) {
			mutexs.forEach((mutex) => {
				mutex.release()
			})
		} else {
			mutexs[0].release()
		}
	}
	const delayModalDispose = () => {
		delayBsInstanceDispose(500, modalMutex)
	}
	onMounted(() => {
		makeInnerScratchOff()
		drawOuterCanvas()
		if (isRoomOwner.value) {
			const unsubscribePlayAction = onValue(playerActionsRef, (snapshot) => {
				const data = snapshot.val()
				if (data) {
					const ctx = outerCanvasRef.value.getContext('2d')
					ctx.save()
					ctx.lineCap = 'square'
					ctx.lineWidth = 10
					ctx.globalCompositeOperation = 'destination-out'
					let subPathData = data['path' + pathIndex][0]
					if (data['path' + pathIndex].length > 0) {
						ctx.beginPath()
						ctx.moveTo(subPathData.x, subPathData.y)
					}
					for (let i = 1; i < data['path' + pathIndex].length; i++) {
						subPathData = data['path' + pathIndex][i]
						ctx.lineTo(subPathData.x, subPathData.y)
						ctx.stroke()
						ctx.beginPath()
						ctx.moveTo(subPathData.x, subPathData.y)
					}

					ctx.restore()
					pathIndex++

					const imageData = ctx.getImageData(minX, minY, maxX - minX, maxY - minY)
					for (const i of opacityPixelPoints) {
						if (imageData.data[i] === 0) {
							opacityPixelPoints.delete(i)
						}
					}
					if (opacityPixelPoints.size < Math.floor(pointsSize / 4)) {
						if (isCancelled) return
						gameOverModalRef.value.getOrCreateModal().show()
					}
				}
			})
			unsubscribes.push(unsubscribePlayAction)
		}
	})
	const disposeModal = async () => {
		isCancelled = true
		if (gameOverModalRef.value.getModal()) {
			const bsInstance = gameOverModalRef.value.getModal()
			await modalMutex.acquire()
			try {
				bsInstance.dispose()
			} finally {
				modalMutex.release()
			}
		}
	}
	onBeforeUnmount(() => {
		disposeModal()
	})
</script>
