<template>
	<canvas
		@mousemove="listeningMousemove"
		@click="isHoveredBigMan ? goToGame() : null"
		@mouseleave="notHoverEffect"
		ref="canvas"
		:style="cursorStyle"
	></canvas>
</template>

<script setup>
	import { ref, computed, watch, onMounted, useTemplateRef } from 'vue'
	import { useRouter } from 'vue-router'
	import { storeToRefs } from 'pinia'
	import {
		createPathObj,
		headAndUpperBody,
		underBody,
		hand,
	} from '@/composables/useCanvasUtils.js'
	import { throttle } from '@/composables/useRateLimit'
	import { useStoryStore } from '@/stores/StoryStore'
	import { useUserStore } from '@/stores/UserStore'

	/* pinia store */
	const storyStore = useStoryStore()
	const { isAnimating } = storeToRefs(storyStore)
	const userStore = useUserStore()
	const { isLoggedIn, openUserModal, waitRoute, openInviteCodeModal } = storeToRefs(userStore)

	/* router */
	const router = useRouter()

	/* props */
	const { swatcher, lilMan, bigMan, scaleCanvasRatio } = defineProps({
		swatcher: Object,
		lilMan: Object,
		bigMan: Object,
		scaleCanvasRatio: Number,
	})

	/* 模板ref */
	const canvasRef = useTemplateRef('canvas')

	/* 製作左小人的頭與上身的路徑物件，並將原點移至左小人的x,y */
	const leftLilManPath1 = createPathObj(headAndUpperBody, lilMan.r, lilMan.x.left, lilMan.y)
	/* 製作左小人的下身的路徑物件，並將原點移至左小人的上身底部，原點x座標移動-3/5r */
	const leftLilManPath2 = createPathObj(
		underBody,
		lilMan.r,
		lilMan.x.left - (lilMan.r * 3) / 5,
		lilMan.y + lilMan.r * 6,
	)
	/* 製作左大人的頭與上身的路徑物件，並將原點移至左大人的x,y */
	const leftBigManHeadAndUpperBodyPath = createPathObj(
		headAndUpperBody,
		bigMan.r,
		bigMan.x.left,
		bigMan.y,
	)
	/* 製作右小人的頭與上身的路徑物件，並將原點移至右小人的x,y，x與左小人的相反，上半身和頭不用翻轉 */
	const rightLilManPath1 = createPathObj(headAndUpperBody, lilMan.r, lilMan.x.right, lilMan.y)
	/* 製作右小人的下身的路徑物件，並將原點移至右小人的上身底部，x位移與左小人相反，原點x座標移動+3/5r，並將x軸翻轉 */
	const rightLilManPath2 = createPathObj(
		underBody,
		lilMan.r,
		lilMan.x.right + (lilMan.r * 3) / 5,
		lilMan.y + lilMan.r * 6,
		undefined,
		true,
	)
	/* 製作右大人的頭與上身的路徑物件，並將原點移至右大人的x,y，x與左大人的相反*/
	const rightBigManHeadAndUpperBodyPath = createPathObj(
		headAndUpperBody,
		bigMan.r,
		bigMan.x.right,
		bigMan.y,
		undefined,
		true,
	)
	/* 創造漸層，用來填充左大人的頭、上身路徑的漸層 */
	const leftBigManGradient = (ctx) =>
		swatcher.createCanvasGradient(ctx, bigMan.x.left, bigMan.y, bigMan.r, swatcher.blue)
	/* 創造漸層，用來填充右大人的頭、上身路徑的漸層 */
	const rightBigManGradient = (ctx) =>
		swatcher.createCanvasGradient(ctx, bigMan.x.right, bigMan.y, bigMan.r, swatcher.purple)
	/* 繪製鼠標不在大人上的樣式 */
	const notHoverEffectLeft = (ctx) => {
		/* 填充左大人的頭、上身路徑 */
		ctx.fillStyle = leftBigManGradient(ctx)
		ctx.fill(leftBigManHeadAndUpperBodyPath)
	}
	const notHoverEffectRight = (ctx) => {
		/* 填充右大人的頭、上身路徑 */
		ctx.fillStyle = rightBigManGradient(ctx)
		ctx.fill(rightBigManHeadAndUpperBodyPath)
	}
	/* 表示鼠標是否在左大人和右大人的變數*/
	const isHoveredLeftBigMan = ref(false)
	const isHoveredRightBigMan = ref(false)
	const isHoveredBigMan = computed(() => isHoveredLeftBigMan.value || isHoveredRightBigMan.value)
	const notHoverEffect = () => {
		const ctx = canvasRef.value.getContext('2d')
		ctx.clearRect(-5 * bigMan.r - 20, -8 * bigMan.r - 20, 2 * bigMan.r + 40, 8 * bigMan.r + 20)
		ctx.clearRect(-3 * bigMan.r, -6 * bigMan.r, 3 * bigMan.r, 3 * bigMan.r)
		ctx.clearRect(3 * bigMan.r - 20, -8 * bigMan.r - 20, 2 * bigMan.r + 40, 8 * bigMan.r + 20)
		ctx.clearRect(0, -6 * bigMan.r, 3 * bigMan.r, 3 * bigMan.r)
		notHoverEffectLeft(ctx)
		notHoverEffectRight(ctx)
		isHoveredLeftBigMan.value = false
		isHoveredRightBigMan.value = false
	}
	const cursorStyle = computed(() => {
		if (isHoveredBigMan.value) {
			return { cursor: 'pointer' }
		} else {
			return null
		}
	})
	const goToGame = () => {
		if (isHoveredLeftBigMan.value) {
			router.push('/make')
		} else if (isHoveredRightBigMan.value) {
			if (!isLoggedIn.value) {
				openUserModal.value = true
				waitRoute.value = 'playroom'
			} else {
				openInviteCodeModal.value = true
			}
		}
	}

	/* 鼠標在大人上hover的效果 */
	const hoverEffect = (event) => {
		const rect = canvasRef.value.getBoundingClientRect()
		const mouseX = Math.floor((event.clientX - rect.left) / scaleCanvasRatio)
		const mouseY = Math.floor((event.clientY - rect.top) / scaleCanvasRatio)
		const leftBigManPath = new Path2D()
		const leftBigManHandPath = createPathObj(
			hand,
			bigMan.r,
			bigMan.x.left,
			bigMan.y + (bigMan.r * 18) / 5,
			-20,
		)
		const leftBigManUnderBodyPath = createPathObj(
			underBody,
			bigMan.r,
			bigMan.x.left - (bigMan.r * 3) / 5,
			bigMan.y + bigMan.r * 6,
		)
		leftBigManPath.addPath(leftBigManHeadAndUpperBodyPath)
		leftBigManPath.addPath(leftBigManUnderBodyPath)
		leftBigManPath.addPath(leftBigManHandPath)
		const rightBigManPath = new Path2D()
		const rightBigManHandPath = createPathObj(
			hand,
			bigMan.r,
			bigMan.x.right,
			bigMan.y + (bigMan.r * 18) / 5,
			-20,
			true,
		)
		const rightBigManUnderBodyPath = createPathObj(
			underBody,
			bigMan.r,
			bigMan.x.right + (bigMan.r * 3) / 5,
			bigMan.y + bigMan.r * 6,
			undefined,
			true,
		)
		rightBigManPath.addPath(rightBigManHeadAndUpperBodyPath)
		rightBigManPath.addPath(rightBigManHandPath)
		rightBigManPath.addPath(rightBigManUnderBodyPath)

		const ctx = canvasRef.value.getContext('2d')
		if (ctx.isPointInPath(leftBigManPath, mouseX, mouseY) && !isHoveredLeftBigMan.value) {
			/* 鼠標從左大人外部移置內部時的動作 */
			ctx.clearRect(
				-5 * bigMan.r - 20,
				-8 * bigMan.r - 20,
				2 * bigMan.r + 40,
				8 * bigMan.r + 20,
			)
			ctx.clearRect(-3 * bigMan.r, -6 * bigMan.r, 3 * bigMan.r, 3 * bigMan.r)
			ctx.save()
			ctx.shadowColor = 'white'
			ctx.shadowBlur = 10
			ctx.fillStyle = swatcher.blue
			ctx.fill(leftBigManPath)
			ctx.restore()
			isHoveredLeftBigMan.value = true
		} else if (
			ctx.isPointInPath(rightBigManPath, mouseX, mouseY) &&
			!isHoveredRightBigMan.value
		) {
			/* 鼠標從右大人外部移置內部時的動作 */
			ctx.clearRect(
				3 * bigMan.r - 20,
				-8 * bigMan.r - 20,
				2 * bigMan.r + 40,
				8 * bigMan.r + 20,
			)
			ctx.clearRect(0, -6 * bigMan.r, 3 * bigMan.r, 3 * bigMan.r)
			ctx.save()
			ctx.shadowColor = 'white'
			ctx.shadowBlur = 10
			ctx.fillStyle = swatcher.purple
			ctx.fill(rightBigManPath)
			ctx.restore()
			isHoveredRightBigMan.value = true
		} else if (
			!ctx.isPointInPath(leftBigManPath, mouseX, mouseY) &&
			isHoveredLeftBigMan.value
		) {
			/* 鼠標從左大人內部移置外部時的動作 */
			ctx.clearRect(
				-5 * bigMan.r - 20,
				-8 * bigMan.r - 20,
				2 * bigMan.r + 40,
				8 * bigMan.r + 20,
			)
			ctx.clearRect(-3 * bigMan.r, -6 * bigMan.r, 3 * bigMan.r, 3 * bigMan.r)
			notHoverEffectLeft(ctx)
			isHoveredLeftBigMan.value = false
		} else if (
			!ctx.isPointInPath(rightBigManPath, mouseX, mouseY) &&
			isHoveredRightBigMan.value
		) {
			/* 鼠標從右大人內部移置外部時的動作 */
			ctx.clearRect(
				3 * bigMan.r - 20,
				-8 * bigMan.r - 20,
				2 * bigMan.r + 40,
				8 * bigMan.r + 20,
			)
			ctx.clearRect(0, -6 * bigMan.r, 3 * bigMan.r, 3 * bigMan.r)

			notHoverEffectRight(ctx)
			isHoveredRightBigMan.value = false
		}
	}
	const throttleHover = throttle(hoverEffect, 100)
	const listeningMousemove = computed(() => (!isAnimating.value ? throttleHover : null))
	onMounted(() => {
		const ctx = canvasRef.value.getContext('2d')
		/* 將路徑座標原點移置中間的底部 */
		const canvasCenterX = canvasRef.value.width / 2
		const canvasBottomY = canvasRef.value.height
		ctx.translate(canvasCenterX, canvasBottomY)
		/* 填充左小人的頭與上身與下身 */
		ctx.fillStyle = swatcher.blue
		ctx.fill(leftLilManPath1)
		ctx.fill(leftLilManPath2)
		/* 填充右小人的頭與上身與下身 */
		ctx.fillStyle = swatcher.purple
		ctx.fill(rightLilManPath1)
		ctx.fill(rightLilManPath2)
		notHoverEffectLeft(ctx)
		notHoverEffectRight(ctx)
	})
	watch(isAnimating, (newValue) => {
		if (newValue && isHoveredBigMan.value) {
			notHoverEffect()
		}
	})
</script>
