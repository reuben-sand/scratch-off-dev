<template>
	<canvas
		ref="canvas"
		@mousedown="mousedownAction"
		@mousemove="mousemoveAction"
		@mouseup="mouseupAction"
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
	const mousedownActionPen = (event) => {
		// pathData.tool = 'pen'
		const ctx = canvasRef.value.getContext('2d')
		ctx.lineWidth = 2
		ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
		const rect = canvasRef.value.getBoundingClientRect()
		x = Math.floor((event.clientX - rect.left) / scaleX)
		y = Math.floor((event.clientY - rect.top) / scaleY)
		beginDrawing = true
		path = new Path2D()
		path.moveTo(x, y)

		completePath = new Path2D()
		completePath.moveTo(x, y)
		pathData.actions.push({ x: x, y: y })
		oneStep = true
	}
	const mousemoveActionPen = rafThrottle((event) => {
		if (beginDrawing) {
			const ctx = canvasRef.value.getContext('2d')
			const rect = canvasRef.value.getBoundingClientRect()
			const currentX = Math.floor((event.clientX - rect.left) / scaleX)
			const currentY = Math.floor((event.clientY - rect.top) / scaleY)
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
	const mouseupActionPen = () => {
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
	const mousedownAction = (event) => {
		if (toolMode === 'pen') {
			mousedownActionPen(event)
		}
	}
	const mousemoveAction = (event) => {
		if (toolMode === 'pen') {
			mousemoveActionPen(event)
		}
	}
	const mouseupAction = () => {
		if (toolMode === 'pen') {
			mouseupActionPen()
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
