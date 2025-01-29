<template>
	<canvas ref="canvas"></canvas>
</template>

<script setup>
	import { useTemplateRef, onMounted } from 'vue'
	import { createPathObj, heart } from '@/composables/useCanvasUtils'

	/* props */
	const { swatcher, lilMan, bigMan } = defineProps({
		swatcher: Object,
		lilMan: Object,
		bigMan: Object,
	})

	/* 模板ref */
	const canvasRef = useTemplateRef('canvas')

	onMounted(() => {
		const ctx = canvasRef.value.getContext('2d')
		const canvasCenterX = canvasRef.value.width / 2
		const canvasBottomY = canvasRef.value.height
		ctx.translate(canvasCenterX, canvasBottomY)
		/* 紀錄動畫開始時間 */
		const startTime = performance.now()
		/* 繪製動畫 */
		const draw = () => {
			/* 清除上一幀動畫 */
			ctx.clearRect(bigMan.r * -6, bigMan.r * -6, bigMan.r * 12, bigMan.r * 6)

			/* 紀錄動畫經過時間 */
			const nowTime = performance.now()
			const elapsedTime = Math.floor(nowTime - startTime)

			/* 將經過時間取毫秒整數，對經過的時間取餘數，每2秒(2000毫秒)的第1秒單位放大倍速從1到1.25，第二秒從1.25縮小到1  */
			let scale
			if (elapsedTime % 2000 > 999) {
				scale = 1 + ((elapsedTime % 1000) * 0.25) / 999
			} else {
				scale = 1.25 - ((elapsedTime % 1000) * 0.25) / 999
			}

			/* 創建左小人愛心路徑 */
			const leftLilManHeartPath = createPathObj(
				heart,
				lilMan.r,
				lilMan.x.left,
				lilMan.y + (lilMan.r * 12) / 5,
				undefined,
				undefined,
				scale,
			)

			/* 填充左小人的愛心 */
			ctx.fillStyle = swatcher.red
			ctx.fill(leftLilManHeartPath)

			/* 創建右小人愛心路徑，x為左小人的相反 */
			const rightLilManHeartPath = createPathObj(
				heart,
				lilMan.r,
				lilMan.x.right,
				lilMan.y + (lilMan.r * 12) / 5,
				undefined,
				undefined,
				scale,
			)

			/* 填充右小人的愛心 */
			ctx.fillStyle = swatcher.red
			ctx.fill(rightLilManHeartPath)

			/* 創建左大人愛心路徑 */
			const leftBigManHeartPath = createPathObj(
				heart,
				bigMan.r / 2,
				bigMan.x.left,
				bigMan.y + (bigMan.r * 12) / 5,
				undefined,
				undefined,
				scale,
			)

			/* 填充左大人的愛心 */
			ctx.fillStyle = swatcher.red + 'A0'
			ctx.fill(leftBigManHeartPath)

			/* 創建右大人愛心路徑 */
			const rightBigManHeartPath = createPathObj(
				heart,
				bigMan.r / 2,
				bigMan.x.right,
				bigMan.y + (bigMan.r * 12) / 5,
				undefined,
				undefined,
				scale,
			)

			/* 填充右大人的愛心 */
			ctx.fillStyle = swatcher.red + 'A0'
			ctx.fill(rightBigManHeartPath)

			/* 執行下一幀動畫 */
			requestAnimationFrame(draw)
		}
		requestAnimationFrame(draw)
	})
</script>
