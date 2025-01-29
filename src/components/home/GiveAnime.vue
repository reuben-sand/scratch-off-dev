<template>
	<canvas ref="canvas"></canvas>
</template>

<script setup>
	import { watch, onMounted, useTemplateRef } from 'vue'
	import { storeToRefs } from 'pinia'
	import { createPathObj, speakIcon, hand, card } from '@/composables/useCanvasUtils'
	import { useStoryStore } from '@/stores/StoryStore'

	/* pinia store */
	const storyStore = useStoryStore()
	const { dialogContent, dialogOrder, key, isAnimating } = storeToRefs(storyStore)

	/* emits */
	const emit = defineEmits(['animationEnded'])

	/* props */
	const { swatcher, lilMan, bigMan } = defineProps({
		swatcher: Object,
		lilMan: Object,
		bigMan: Object,
	})

	/* 模板ref */
	const canvasRef = useTemplateRef('canvas')

	const startAnimation = function () {
		const ctx = canvasRef.value.getContext('2d')
		/* 重置ctx */
		ctx.setTransform(1, 0, 0, 1, 0, 0)

		/* 將路徑座標原點移置中間的底部 */
		const canvasCenterX = canvasRef.value.width / 2
		const canvasBottomY = canvasRef.value.height
		ctx.translate(canvasCenterX, canvasBottomY)
		/* 創造填充左大人手臂的漸層 */
		const leftBigManGradient = swatcher.createCanvasGradient(
			ctx,
			bigMan.x.left,
			bigMan.y,
			bigMan.r,
			swatcher.blue,
		)
		/* 創造填充右大人手臂的漸層 */
		const rightBigManGradient = swatcher.createCanvasGradient(
			ctx,
			bigMan.x.right,
			bigMan.y,
			bigMan.r,
			swatcher.purple,
		)
		/* 設定要填充對話輔助圖示的筆畫 */
		ctx.lineWidth = (bigMan.r * 1) / 10
		ctx.lineCap = 'round'
		/* 創建左大人說話時的圖示路徑，路徑原點基於大人頭中心偏右+leftBigMan.r * 3/5 */
		const leftSpeakIconPath1 = createPathObj(
			speakIcon,
			bigMan.r,
			bigMan.x.left + (bigMan.r * 3) / 5,
			bigMan.y,
			20,
		)
		const leftSpeakIconPath2 = createPathObj(
			speakIcon,
			bigMan.r,
			bigMan.x.left + (bigMan.r * 3) / 5,
			bigMan.y,
			-20,
		)
		/* 創建右大人說話時的圖示路徑，路徑原點基於大人頭中心（左大人的反邊）偏左-leftBigMan.r * 3/5 */
		const rightSpeakIconPath1 = createPathObj(
			speakIcon,
			bigMan.r,
			bigMan.x.right - (bigMan.r * 3) / 5,
			bigMan.y,
			20,
			true,
		)
		const rightSpeakIconPath2 = createPathObj(
			speakIcon,
			bigMan.r,
			bigMan.x.right - (bigMan.r * 3) / 5,
			bigMan.y,
			-20,
			true,
		)
		/* 紀錄動畫開始時間 */
		const startTime = performance.now()
		/* 該條件使六秒過後只執行一次手部動畫 */
		let executeHandAnimation = true
		/* 繪製動畫 */
		const draw = (timestamp) => {
			/* 紀錄動畫經過時間 */
			let elapsedTime

			/* 如果點擊跳過動畫的按鈕，將跳過動畫 */
			if (isAnimating.value) {
				elapsedTime = Math.floor(timestamp - startTime)
			} else {
				elapsedTime = 25000
			}
			/* 手臂和卡片的動畫部分 */
			if (executeHandAnimation) {
				/* 在3秒內讓手臂向上60deg 所以開始動作時 角度- (elapsedTime * 60/3000) */
				/* 手臂和卡片的動畫為6秒，左邊人前3秒舉起手，右邊人後3秒鐘舉起手 */
				/* 設置每次繪製手臂的角度，一個是前3秒固定角度，一個是後3秒固定角度，左邊人和右邊人的手臂的路徑座標軸起始都在-20度，最後變成40度 */
				let leftManAngle
				let rightManAngle
				if (elapsedTime <= 3000) {
					/* 前3秒左邊手臂角度變化，右邊手臂不變 */
					leftManAngle = 40 - (elapsedTime * 60) / 3000
					rightManAngle = 40
				} else if (elapsedTime > 3000 && elapsedTime < 6000) {
					/* 後3秒右邊手臂角度變化，左邊手臂不變 */
					leftManAngle = -20
					rightManAngle = 40 - ((elapsedTime - 3000) * 60) / 3000
				} else if (elapsedTime >= 6000) {
					/* 超過6秒後停止手臂和卡片的動畫。 */
					leftManAngle = -20
					rightManAngle = -20
					executeHandAnimation = !executeHandAnimation
				}
				/* 清除上一幀手臂和卡片，只清除頭部以下的矩形 */
				ctx.clearRect(
					bigMan.x.left - bigMan.r,
					bigMan.y + bigMan.r,
					-(bigMan.x.left - bigMan.r) - (bigMan.x.left - bigMan.r),
					-(bigMan.y + bigMan.r),
				)
				/* 創建左小人的手臂路徑，將座標中心x設定為身體中心，y設定為頭中心往下18/5r，並添加動態旋轉角度 */
				const leftLilManHandPath = createPathObj(
					hand,
					lilMan.r,
					lilMan.x.left,
					lilMan.y + (lilMan.r * 18) / 5,
					leftManAngle,
				)
				/* 填充左小人的手臂 */
				ctx.fillStyle = swatcher.blue
				ctx.fill(leftLilManHandPath)
				/* 創建左大人的手臂路徑，將座標中心x設定為身體中心，y設定為頭中心往下18/5r，並添加動態旋轉角度 */
				const leftBigManHandPath = createPathObj(
					hand,
					bigMan.r,
					bigMan.x.left,
					bigMan.y + (bigMan.r * 18) / 5,
					leftManAngle,
				)
				/* 填充左大人手臂 */
				ctx.fillStyle = leftBigManGradient
				ctx.fill(leftBigManHandPath)
				/* 清除與身體重疊的左大人手臂，不然會疊加帶有透明度的顏色 */
				ctx.clearRect(
					bigMan.x.left - bigMan.r,
					bigMan.y + bigMan.r * 2,
					bigMan.r * 2,
					bigMan.r * 4,
				)
				/* 創建右小人的手臂路徑，將座標中心x設定為身體中心（與左小人相反位置），y設定為頭中心往下18/5r，並添加動態旋轉角度，旋轉後必須翻轉繪製座標 */
				const rightLilManHandPath = createPathObj(
					hand,
					lilMan.r,
					lilMan.x.right,
					lilMan.y + (lilMan.r * 18) / 5,
					rightManAngle,
					true,
				)
				/* 填充右小人的手臂 */
				ctx.fillStyle = swatcher.purple
				ctx.fill(rightLilManHandPath)
				/* 創建右大人的手臂路徑，將座標中心x設定為身體中心（與左大人的相反），y設定為頭中心往下18/5r，並添加動態旋轉角度，旋轉後必須翻轉繪製座標 */
				const rightBigManHandPath = createPathObj(
					hand,
					bigMan.r,
					bigMan.x.right,
					bigMan.y + (bigMan.r * 18) / 5,
					rightManAngle,
					true,
				)
				/* 填充右大人手臂 */
				ctx.fillStyle = rightBigManGradient
				ctx.fill(rightBigManHandPath)
				/* 清除身體重疊的右大人手臂，不然會疊加帶有透明度的顏色 */
				ctx.clearRect(
					bigMan.x.right - bigMan.r,
					bigMan.y + bigMan.r * 2,
					bigMan.r * 2,
					bigMan.r * 4,
				)
				/* 創造小刮刮樂路徑，路徑中心座標如同手臂 */
				const lilCardPath = createPathObj(
					card,
					lilMan.r,
					lilMan.x.left,
					lilMan.y + (lilMan.r * 18) / 5,
					leftManAngle,
				)
				/* 填充小刮刮樂 */
				ctx.fillStyle = swatcher.peach
				ctx.fill(lilCardPath)
				/* 左大人動作一半時，讓刮刮樂現形。 */
				if (elapsedTime > 1500) {
					/* 創造大刮刮樂的路徑 */
					const bigCardPath = createPathObj(
						card,
						bigMan.r,
						bigMan.x.left,
						bigMan.y + (bigMan.r * 18) / 5,
						leftManAngle,
					)
					let opacity = ''
					if (elapsedTime <= 3000) {
						const decimical = ((elapsedTime - 1500) * 253) / 1500 + 1
						opacity = Math.floor(decimical).toString(16).padStart(2, '0')
					}
					/* 填充大刮刮樂 */
					ctx.fillStyle = swatcher.peach + opacity
					ctx.fill(bigCardPath)
				}
			}

			/* 人物對話的動畫部分，三秒前都讓其為對話index為0 */
			/* 這裡的邏輯是要根據經歷時間，顯示相對應的index對話，而不是根據上次對話時間，相隔兩秒，因為在使用其他頁面標籤時，requestAnimationFrame不會執行，但是時間會正常計算 */
			let newDialogOrder = Math.floor((elapsedTime - 3000) / 1000 / 2) + 1
			if (newDialogOrder < 0) {
				newDialogOrder = 0
			} else if (newDialogOrder >= dialogContent.value.length) {
				newDialogOrder = dialogContent.value.length - 1
			}
			/* 如果對話index有變化才執行 */
			if (dialogOrder.value !== newDialogOrder) {
				dialogOrder.value = newDialogOrder

				/* 清除上一個對話圖示 */
				ctx.clearRect(
					bigMan.x.left + bigMan.r,
					bigMan.y - bigMan.r,
					bigMan.x.right - bigMan.r - (bigMan.x.left + bigMan.r),
					bigMan.r * 2,
				)
				if (key.value === 'blue') {
					/* 填充左人物對話圖示 */
					ctx.strokeStyle = swatcher.blue
					ctx.stroke(leftSpeakIconPath1)
					ctx.stroke(leftSpeakIconPath2)
				} else if (key.value === 'purple') {
					/* 填充右人物對話圖示 */
					ctx.strokeStyle = swatcher.purple
					ctx.stroke(rightSpeakIconPath1)
					ctx.stroke(rightSpeakIconPath2)
				}
			}
			/* 講完話後停止動畫 */
			if (elapsedTime < 25000) {
				requestAnimationFrame(draw)
			} else {
				ctx.clearRect(
					bigMan.x.left + bigMan.r,
					bigMan.y - bigMan.r,
					bigMan.x.right - bigMan.r - (bigMan.x.left + bigMan.r),
					bigMan.r * 2,
				)
				dialogOrder.value = dialogContent.value.length - 1
				emit('animationEnded')
			}
		}
		/* 第一幀動畫 */
		requestAnimationFrame(draw)
	}
	onMounted(() => {
		startAnimation()
	})
	watch(isAnimating, (newValue) => {
		if (newValue) {
			startAnimation()
		}
	})
</script>
