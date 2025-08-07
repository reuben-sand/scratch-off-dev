<template>
	<canvas
		ref="canvas"
		@mousedown="onPointerDown"
		@mousemove="onPointerMove"
		@mouseup="onPointerUp"
		@touchstart="onPointerDown"
		@touchmove="onPointerMove"
		@touchend="onPointerUp"
	></canvas>
</template>

<script setup>
	import { useTemplateRef, watch } from 'vue'
	import { storeToRefs } from 'pinia'
	import { rafThrottle } from '@/composables/useRateLimit'
	import { useBoardStore } from '@/stores/BoardStore'

	/* pinia store */
	const boardStore = useBoardStore()
	const { cardClipPath, clearBoard } = storeToRefs(boardStore)

	/* emits */
	const emit = defineEmits(['updatePath'])

	/* props */
	const { scaleX, scaleY, toolMode } = defineProps({
		scaleX: [null, Number],
		scaleY: [null, Number],
		toolMode: [null, String],
	})

	/* 模板ref */
	const canvasRef = useTemplateRef('canvas')

	let pathData = { actions: [] }
	/* 繪製動作 */
	let completePath = null
	let path = null
	let beginDrawing = false
	let oneStep
	let x
	let y
	const penStartStroke = (event) => {
		let eventPositionX
		let eventPositionY
		if (event.type === 'touchstart') {
			eventPositionX = event.touches[0].clientX
			eventPositionY = event.touches[0].clientY
		} else {
			eventPositionX = event.clientX
			eventPositionY = event.clientY
		}

		const ctx = canvasRef.value.getContext('2d')
		ctx.lineWidth = 2
		ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
		const rect = canvasRef.value.getBoundingClientRect()
		x = Math.floor((eventPositionX - rect.left) / scaleX)
		y = Math.floor((eventPositionY - rect.top) / scaleY)
		beginDrawing = true
		path = new Path2D()
		path.moveTo(x, y)

		completePath = new Path2D()
		completePath.moveTo(x, y)
		pathData.actions.push({ x: x, y: y })
		oneStep = true
	}
	const penMoveStroke = rafThrottle((event) => {
		if (beginDrawing) {
			let eventPositionX
			let eventPositionY
			if (event.type === 'touchmove') {
				eventPositionX = event.touches[0].clientX
				eventPositionY = event.touches[0].clientY
			} else {
				eventPositionX = event.clientX
				eventPositionY = event.clientY
			}
			const ctx = canvasRef.value.getContext('2d')
			const rect = canvasRef.value.getBoundingClientRect()
			const currentX = Math.floor((eventPositionX - rect.left) / scaleX)
			const currentY = Math.floor((eventPositionY - rect.top) / scaleY)
			if (Math.abs(currentX - x) > 4 || Math.abs(currentY - y) > 4) {
				completePath.lineTo(currentX, currentY)
				pathData.actions.push({ x: currentX, y: currentY })
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
	})
	const penEndStroke = () => {
		if (beginDrawing) {
			const ctx = canvasRef.value.getContext('2d')
			ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
			completePath.closePath()
			ctx.stroke(completePath)
			cardClipPath.value = completePath
			emit('updatePath', { ...pathData })
			pathData = { actions: [] }
			beginDrawing = false
		}
	}
	const onPointerDown = (event) => {
		if (toolMode === 'pen') {
			penStartStroke(event)
		}
	}
	const onPointerMove = (event) => {
		if (toolMode === 'pen') {
			penMoveStroke(event)
		}
	}
	const onPointerUp = () => {
		if (toolMode === 'pen') {
			penEndStroke()
		}
	}
	watch(clearBoard, (newValue) => {
		if (newValue === 'range') {
			const ctx = canvasRef.value.getContext('2d')
			ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
			clearBoard.value = ''
			cardClipPath.value = null
		}
	})
</script>
