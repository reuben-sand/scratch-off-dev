<template>
	<img class="border-1 border template-img border-dark" :src="imageSrc" />
</template>

<script setup>
	import { ref, onMounted } from 'vue'
	import { storeToRefs } from 'pinia'
	import { useBoardStore } from '@/stores/BoardStore'

	/* pinia store */
	const boardStore = useBoardStore()
	const { boardCanvasWidth, boardCanvasHeight } = storeToRefs(boardStore)

	/* props */
	const { canvasTemplate } = defineProps({
		canvasTemplate: Object,
	})

	const imageSrc = ref('')
	const makeThumbnail = async () => {
		const offscreenCanvas = new OffscreenCanvas(boardCanvasWidth.value, boardCanvasHeight.value)
		const ctx = offscreenCanvas.getContext('2d')
		/* 儲存上下文初始狀態 */
		ctx.save()
		const clipPath = new Path2D()
		const rangeActions = canvasTemplate.range.actions
		let subPathData = rangeActions[0]
		if (rangeActions.length > 0) {
			clipPath.moveTo(subPathData.x, subPathData.y)
		}
		for (let i = 1; i < rangeActions.length; i++) {
			subPathData = rangeActions[i]
			clipPath.lineTo(subPathData.x, subPathData.y)
		}
		clipPath.closePath()
		ctx.lineWidth = 2
		ctx.stroke(clipPath)
		/* 恢復上下文初始狀態 */
		ctx.restore()

		/* 儲存上下文初始狀態 */
		ctx.save()
		ctx.clip(clipPath)
		canvasTemplate.inner.forEach((pathData) => {
			/* 每次步驟前，儲存上下文狀態，保持clip */
			ctx.save()
			ctx.beginPath()
			if (pathData.tool === 'pen') {
				//以下更改中
				subPathData = pathData.actions[0]
				if (pathData.actions.length > 0) {
					ctx.moveTo(subPathData.x, subPathData.y)
				}
				for (let i = 1; i < pathData.actions.length; i++) {
					subPathData = pathData.actions[i]
					ctx.lineTo(subPathData.x, subPathData.y)
				}

				ctx.strokeStyle = pathData.color
				ctx.lineWidth = 2
				ctx.stroke()
			} else if (pathData.tool === 'eraser') {
				subPathData = pathData.actions[0]
				if (pathData.actions.length > 0) {
					ctx.moveTo(subPathData.x, subPathData.y)
				}
				for (let i = 1; i < pathData.actions.length; i++) {
					subPathData = pathData.actions[i]
					ctx.lineTo(subPathData.x, subPathData.y)
				}
				ctx.lineWidth = 10
				ctx.globalCompositeOperation = 'destination-out'
				ctx.stroke()
			} else if (pathData.tool === 'fonts') {
				ctx.fillStyle = pathData.color
				ctx.fillText(pathData.textContent, pathData.actions[0].x, pathData.actions[0].y)
			} else if (pathData.tool === 'fill') {
				ctx.fillStyle = pathData.color
				ctx.fillRect(0, 0, boardCanvasWidth.value, boardCanvasHeight.value)
			}
			/* 每次步驟完成，恢復上下文狀態，保持clip */
			ctx.restore()
		})
		/* 恢復上下文初始狀態 */
		ctx.restore()
		canvasTemplate.outer.forEach((pathData) => {
			/* 每次步驟前，恢復上下文狀態 */
			ctx.save()
			ctx.beginPath()
			if (pathData.tool === 'pen') {
				subPathData = pathData.actions[0]
				if (pathData.actions.length > 0) {
					ctx.moveTo(subPathData.x, subPathData.y)
				}
				for (let i = 1; i < pathData.actions.length; i++) {
					subPathData = pathData.actions[i]
					ctx.lineTo(subPathData.x, subPathData.y)
				}
				ctx.strokeStyle = pathData.color
				ctx.lineWidth = 2
				ctx.stroke()
			} else if (pathData.tool === 'eraser') {
				subPathData = pathData.actions[0]
				if (pathData.actions.length > 0) {
					ctx.moveTo(subPathData.x, subPathData.y)
				}
				for (let i = 1; i < pathData.actions.length; i++) {
					subPathData = pathData.actions[i]
					ctx.lineTo(subPathData.x, subPathData.y)
				}
				ctx.lineWidth = 10
				ctx.globalCompositeOperation = 'destination-out'
				ctx.stroke()
			} else if (pathData.tool === 'fonts') {
				ctx.fillStyle = pathData.color
				ctx.fillText(pathData.textContent, pathData.actions[0].x, pathData.actions[0].y)
			} else if (pathData.tool === 'fill') {
				ctx.fillStyle = pathData.color
				ctx.fillRect(0, 0, boardCanvasWidth.value, boardCanvasHeight.value)
			}
			/* 每次步驟完成，恢復上下文狀態 */
			ctx.restore()
		})

		const blob = await offscreenCanvas.convertToBlob()
		const url = URL.createObjectURL(blob)
		imageSrc.value = url
	}
	onMounted(() => {
		makeThumbnail()
	})
</script>
