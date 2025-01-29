<template>
	<canvas
		v-bind="$attrs"
		ref="canvas"
		@mousedown="canvasMousedown"
		@mousemove="canvasMousemove"
		@mouseup="canvasMouseup"
		@click="canvasClick"
	></canvas>
	<div v-if="textBoxShowing" :style="transformTextBox" id="text-box" class="position-absolute">
		<button
			@click="closeTextBtnClick"
			id="text-close-btn"
			type="button"
			class="btn btn-sm text-box-btn border border-dark rounded-circle position-absolute"
		>
			<i class="bi bi-x-lg"></i>
		</button>
		<div
			tabindex="0"
			ref="textBoxContent"
			id="text-box-content"
			class="d-inline-block border border-dark"
			@click="AddClickCount"
			@blur="resetClickCount"
			@mousedown="clickCount === 1 ? startTextMove($event) : null"
			@mousemove="clickCount === 1 ? textMoving($event) : null"
			@mouseup="clickCount === 1 ? endTextMove() : null"
			:contenteditable="clickCount === 2 ? 'plaintext-only' : null"
			:style="{
				color: currentColor.hex8 || null,
				cursor: textBoxContentCursor,
				padding: clickCount === 0 ? '7px' : '5px',
			}"
			:class="clickCount === 0 ? 'border-1' : 'border-3'"
			role="textbox"
		></div>
		<button
			@click="okTextBtnClick"
			id="text-ok-btn"
			type="button"
			class="btn btn-sm text-box-btn border border-dark rounded-circle position-absolute"
		>
			<i class="bi bi-check-lg"></i>
		</button>
	</div>
</template>
<script setup>
	import { ref, computed, onMounted, onUnmounted, watch, useTemplateRef, nextTick } from 'vue'
	import { storeToRefs } from 'pinia'
	import { useBoardStore } from '@/stores/BoardStore'
	import { debounce, rafThrottle } from '@/composables/useRateLimit'

	/* pinia store */
	const boardStore = useBoardStore()
	const { clearBoard, cardClipPath, currentColor, fillBoard } = storeToRefs(boardStore)

	/* emits */
	const emit = defineEmits(['updatePath'])

	/* props */
	const { scaleX, scaleY, toolMode, boardMode } = defineProps({
		scaleX: [null, Number],
		scaleY: [null, Number],
		toolMode: [null, String],
		boardMode: [null, String],
	})

	/* 模板ref */
	const canvasRef = useTemplateRef('canvas')
	const textBoxContentRef = useTemplateRef('textBoxContent')

	/* 文字方塊狀態 */
	const clickCount = ref(0)
	const cancelClick = ref(false)
	const AddClickCount = async () => {
		if (clickCount.value === 1) {
			if (cancelClick.value === false) {
				clickCount.value++
				await nextTick()
				textBoxContentRef.value.focus()
			} else {
				cancelClick.value = false
			}
		} else if (clickCount.value === 0) {
			clickCount.value++
		}
	}
	const resetClickCount = () => {
		clickCount.value = 0
	}
	/* 文字方塊移動 */
	let moveLastPointX
	let moveLastPointY
	let textBoxContentMovingWidth
	let textBoxContentMovingHeight
	const startTextMove = (event) => {
		allowTextBoxMove.value = true
		moveLastPointX = Math.floor(event.clientX)
		moveLastPointY = Math.floor(event.clientY)
		const textBoxRect = textBoxContentRef.value.getBoundingClientRect()
		textBoxContentMovingWidth = textBoxRect.width
		textBoxContentMovingHeight = textBoxRect.height
	}
	const textBoxX = ref(0)
	const textBoxY = ref(0)
	const textMoving = rafThrottle((event) => {
		if (allowTextBoxMove.value) {
			const mouseMoveX = Math.floor(event.clientX) - moveLastPointX
			const mouseMoveY = Math.floor(event.clientY) - moveLastPointY
			if (Math.abs(mouseMoveX) > 1 || Math.abs(mouseMoveY) > 1) {
				const textBoxXCalculate = textBoxX.value + mouseMoveX
				const textBoxYCalculate = textBoxY.value + mouseMoveY

				if (
					textBoxXCalculate >
					canvasRef.value.width * scaleX + 1.6 - textBoxContentMovingWidth
				) {
					textBoxX.value =
						canvasRef.value.width * scaleX + 1.6 - textBoxContentMovingWidth
				} else if (textBoxXCalculate < 0) {
					textBoxX.value = 0
				} else {
					textBoxX.value = textBoxXCalculate
					moveLastPointX = Math.floor(event.clientX)
				}

				if (
					textBoxYCalculate >
					canvasRef.value.height * scaleY + 1.6 - textBoxContentMovingHeight
				) {
					textBoxY.value =
						canvasRef.value.height * scaleY + 1.6 - textBoxContentMovingHeight
				} else if (textBoxYCalculate < 0) {
					textBoxY.value = 0
				} else {
					textBoxY.value = textBoxYCalculate
					moveLastPointY = Math.floor(event.clientY)
				}
				if (!cancelClick.value) {
					cancelClick.value = true
				}
			}
		}
	})
	const endTextMove = () => {
		allowTextBoxMove.value = false
	}
	let pathData = { actions: [] }
	/* canvas繪製 */
	let path = null
	let beginDrawing = false
	let oneStep
	let x
	let y
	const canvasMousedownPen = (event) => {
		pathData.tool = 'pen'
		const ctx = canvasRef.value.getContext('2d')
		ctx.lineWidth = 2
		ctx.strokeStyle = currentColor.value.hex8
		pathData.color = currentColor.value.hex8
		const rect = canvasRef.value.getBoundingClientRect()
		x = Math.floor((event.clientX - rect.left) / scaleX)
		y = Math.floor((event.clientY - rect.top) / scaleY)
		beginDrawing = true
		path = new Path2D()
		path.moveTo(x, y)
		pathData.actions.push({ x: x, y: y })
		oneStep = true
	}
	const canvasMousemovePen = rafThrottle((event) => {
		if (beginDrawing) {
			const ctx = canvasRef.value.getContext('2d')
			const rect = canvasRef.value.getBoundingClientRect()
			const currentX = Math.floor((event.clientX - rect.left) / scaleX)
			const currentY = Math.floor((event.clientY - rect.top) / scaleY)
			if (Math.abs(currentX - x) > 4 || Math.abs(currentY - y) > 4) {
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
	const canvasMouseupPen = () => {
		emit('updatePath', { ...pathData })
		pathData = { actions: [] }
		beginDrawing = false
	}
	const canvasMousedownEraser = (event) => {
		pathData.tool = 'eraser'
		const ctx = canvasRef.value.getContext('2d')
		ctx.save()
		ctx.lineWidth = 10
		ctx.globalCompositeOperation = 'destination-out'
		const rect = canvasRef.value.getBoundingClientRect()
		x = Math.floor((event.clientX - rect.left) / scaleX)
		y = Math.floor((event.clientY - rect.top).scaleY)
		beginDrawing = true
		path = new Path2D()
		path.moveTo(x, y)
		pathData.actions.push({ x: x, y: y })
		oneStep = true
	}
	const canvasMousemoveEraser = rafThrottle((event) => {
		if (beginDrawing) {
			const ctx = canvasRef.value.getContext('2d')
			const rect = canvasRef.value.getBoundingClientRect()
			const currentX = Math.floor((event.clientX - rect.left) / scaleX)
			const currentY = Math.floor((event.clientY - rect.top) / scaleY)
			if (Math.abs(currentX - x) > 4 || Math.abs(currentY - y) > 4) {
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
	const canvasMouseupEraser = () => {
		const ctx = canvasRef.value.getContext('2d')
		emit('updatePath', { ...pathData })
		pathData = { actions: [] }
		beginDrawing = false
		ctx.restore()
	}
	const allowTextBoxMove = ref(false)
	const canvasMouseupFonts = () => {
		allowTextBoxMove.value = false
	}
	const canvasMousedown = (event) => {
		if (toolMode === 'pen') {
			canvasMousedownPen(event)
		} else if (toolMode === 'eraser') {
			canvasMousedownEraser(event)
		}
	}
	const canvasMousemove = (event) => {
		if (toolMode === 'pen') {
			canvasMousemovePen(event)
		} else if (toolMode === 'eraser') {
			canvasMousemoveEraser(event)
		} else if (toolMode === 'fonts') {
			textMoving(event)
		}
	}
	const canvasMouseup = () => {
		if (toolMode === 'pen') {
			canvasMouseupPen()
		} else if (toolMode === 'eraser') {
			canvasMouseupEraser()
		} else if (toolMode === 'fonts') {
			canvasMouseupFonts()
		}
	}
	const textBoxShowing = ref(false)
	let lastScaleX
	let lastScaleY
	const canvasClick = (event) => {
		if (toolMode === 'fonts' && !textBoxShowing.value) {
			textBoxShowing.value = true
			const rect = canvasRef.value.getBoundingClientRect()
			textBoxX.value = Math.floor(event.clientX) - Math.floor(rect.left)
			lastScaleX = scaleX
			textBoxY.value = Math.floor(event.clientY) - Math.floor(rect.top)
			lastScaleY = scaleY
		}
	}
	const closeTextBtnClick = () => {
		textBoxShowing.value = false
		resetClickCount()
	}
	const okTextBtnClick = () => {
		if (textBoxContentRef.value.textContent) {
			pathData.tool = 'fonts'
			const ctx = canvasRef.value.getContext('2d')
			const textBoxRect = textBoxContentRef.value.getBoundingClientRect()
			const canvasRect = canvasRef.value.getBoundingClientRect()
			const printPlaceX = Math.floor((textBoxRect.left - canvasRect.left) / scaleX)
			const printPlaceY = Math.floor((textBoxRect.top - canvasRect.top) / scaleY)
			ctx.fillStyle = currentColor.value.hex8
			pathData.color = currentColor.value.hex8
			ctx.fillText(textBoxContentRef.value.textContent, printPlaceX + 8, printPlaceY + 12)
			pathData.textContent = textBoxContentRef.value.textContent
			pathData.actions.push({ x: printPlaceX + 8, y: printPlaceY + 12 })
			emit('updatePath', { ...pathData })
			pathData = { actions: [] }
			textBoxShowing.value = false
		}
	}
	/* 元素樣式 */
	const transformTextBox = computed(() => {
		if (canvasRef.value) {
			return {
				transform: `scaleX(${scaleX}) scaleY(${scaleY}) translate(${canvasRef.value.width / 30 + textBoxX.value / scaleX}px,${canvasRef.value.height / 20 + textBoxY.value / scaleY}px)`,
			}
		} else {
			return null
		}
	})
	const textBoxContentCursor = computed(() => {
		if (clickCount.value === 2) {
			return 'auto'
		} else if (allowTextBoxMove.value && cancelClick.value) {
			return 'move'
		} else {
			return 'default'
		}
	})
	/* 視窗調整時，更新textbox位置 */
	const updateTextBox = debounce(() => {
		if (textBoxShowing.value) {
			textBoxX.value = (textBoxX.value / lastScaleX) * scaleX
			lastScaleX = scaleX
			textBoxY.value = (textBoxY.value / lastScaleY) * scaleY
			lastScaleY = scaleY
		}
	}, 200)
	onMounted(() => {
		window.addEventListener('resize', updateTextBox)
		const ctx = canvasRef.value.getContext('2d')
		ctx.textBaseline = 'top'
		ctx.font = "16px 'Noto Sans TC', sans-serif"
	})
	onUnmounted(() => {
		window.removeEventListener('resize', updateTextBox)
	})
	watch(cardClipPath, (newValue, oldValue) => {
		if (newValue) {
			const ctx = canvasRef.value.getContext('2d')
			ctx.restore()
			/* 儲存clip前的狀態 */
			ctx.save()
			if (oldValue !== null) {
				const path = new Path2D()
				path.rect(0, 0, canvasRef.value.width, canvasRef.value.height)
				path.addPath(newValue)
				ctx.clip(path, 'evenodd')
				ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
				/* 恢復到clip前的狀態 */
				ctx.restore()
				ctx.save()
			}
			ctx.clip(newValue)
		} else {
			const ctx = canvasRef.value.getContext('2d')
			/* 恢復到clip前的狀態 */
			ctx.restore()
			ctx.save()
			ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
		}
	})
	watch(clearBoard, (newValue) => {
		if (newValue === 'inner') {
			const ctx = canvasRef.value.getContext('2d')
			/* 恢復到clip前的狀態 */
			ctx.restore()
			ctx.save()
			ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
			clearBoard.value = ''
			ctx.clip(cardClipPath.value)
		}
	})
	watch(
		() => toolMode,
		(newValue) => {
			if (textBoxShowing.value && newValue !== 'fonts') {
				textBoxShowing.value = false
				resetClickCount()
			}
		},
	)
	watch(
		() => boardMode,
		(newValue) => {
			if (textBoxShowing.value && newValue !== 'inner') {
				textBoxShowing.value = false
				resetClickCount()
			}
		},
	)
	watch(fillBoard, (newValue) => {
		if (newValue === 'inner') {
			const ctx = canvasRef.value.getContext('2d')
			ctx.fillStyle = currentColor.value.hex8
			ctx.fill(cardClipPath.value)
			fillBoard.value = ''
		}
	})
</script>
