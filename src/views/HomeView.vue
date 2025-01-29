<template>
	<AppHeader id="home-header" v-if="!isAnimating" />
	<div id="story-section" class="position-relative">
		<HoverAnime
			class="position-absolute start-50"
			:style="animeCanvasStyle"
			:width="allCanvasSize"
			:height="allCanvasSize"
			:swatcher="swatcher"
			:lil-man="lilMan"
			:big-man="bigMan"
			:scale-canvas-ratio="scaleCanvasRatio"
		/>
		<GiveAnime
			class="position-absolute start-50"
			@animation-ended="isAnimating = false"
			:style="animeCanvasStyle"
			:width="allCanvasSize"
			:height="allCanvasSize"
			:swatcher="swatcher"
			:lil-man="lilMan"
			:big-man="bigMan"
		/>
		<HeartAnime
			class="position-absolute start-50"
			:style="animeCanvasStyle"
			:width="allCanvasSize"
			:height="allCanvasSize"
			:swatcher="swatcher"
			:lil-man="lilMan"
			:big-man="bigMan"
		/>
		<template v-if="isAnimating">
			<DialogAnime :swatcher="swatcher" />
			<button
				@click="isAnimating = !isAnimating"
				id="skip-btn"
				class="btn position-absolute"
				type="button"
			>
				<i class="bi bi-skip-end-fill"></i>&nbsp;跳過動畫
			</button>
		</template>
		<template v-else-if="!isAnimating">
			<button
				@click="isAnimating = !isAnimating"
				id="replay-btn"
				class="btn position-absolute"
				type="button"
			>
				<i class="bi bi-arrow-counterclockwise"></i>&nbsp;重播動畫
			</button>
			<p
				id="make-game-tip"
				class="game-tip position-absolute text-center m-0 lh-sm"
				aria-label="點擊下方進入製作頁面"
			>
				製作<br /><i class="bi bi-caret-down-fill"></i>
			</p>
			<p
				id="play-game-tip"
				class="game-tip position-absolute text-center m-0 lh-sm"
				aria-label="點擊下方進入遊玩頁面"
			>
				遊玩<br /><i class="bi bi-caret-down-fill"></i>
			</p>
		</template>
	</div>
	<InviteCodeModal class="modal fade" />
	<UserModal class="modal fade" />
</template>
<script setup>
	import { computed, onMounted, onUnmounted } from 'vue'
	import { storeToRefs } from 'pinia'
	import AppHeader from '@/components/common/AppHeader.vue'
	import HoverAnime from '@/components/home/HoverAnime.vue'
	import GiveAnime from '@/components/home/GiveAnime.vue'
	import HeartAnime from '@/components/home/HeartAnime.vue'
	import DialogAnime from '@/components/home/DialogAnime.vue'
	import InviteCodeModal from '@/components/home/InviteCodeModal.vue'
	import UserModal from '@/components/home/UserModal.vue'
	import { debounce } from '@/composables/useRateLimit'
	import { useStoryStore } from '@/stores/StoryStore'
	import { useWindowStore } from '@/stores/WindowStore'

	/* pinia store */
	const storyStore = useStoryStore()
	const { isAnimating } = storeToRefs(storyStore)
	const windowStore = useWindowStore()
	const { deviceRatio, dpi } = storeToRefs(windowStore)
	const { updateDeviceRatio } = windowStore

	const allCanvasSize = computed(() => {
		return 320 * dpi.value
	})
	const scaleCanvasRatio = computed(() => {
		/*
			在MAC上的元素寬度，不會計算到滾動條，且滾動條會自動隱藏，所以不需使用會扣掉滾動條寬度的document.documentElement.clientHeight or document.documentElement，該比例在鼠標位置改變canvas內部繪製時會用到
			在resize window時，變化deviceRatio.value，所以能正常運作。
		*/

		if (deviceRatio.value >= 1) {
			return window.innerHeight / allCanvasSize.value
		} else {
			return window.innerWidth / allCanvasSize.value
		}
	})

	const animeCanvasStyle = computed(() => {
		return {
			transform: ` translateX(-50%)`,
			width: deviceRatio.value >= 1 ? '100vh' : '100vw',
		}
	})

	/* 用來儲存canvas用到的顏色、創造canvas用到的漸層的物件 */
	const swatcher = {
		blue: '#232266',
		purple: '#531560',
		peach: '#EE7296',
		red: '#FA344D',
		createCanvasGradient(ctx, x, y, r, color) {
			const gradient = ctx.createLinearGradient(-x, y + r * 6, -x, y + r)
			gradient.addColorStop(0.2, color + '00')
			gradient.addColorStop(0.5, color + '20')
			gradient.addColorStop(1, color)
			return gradient
		},
	}
	/* 存放繪製小人和大人路徑的基本比例和參考半徑 */
	const lilMan = {
		/* 半徑，用來形成身體以及當作繪製路徑的比例尺 */
		r: 5 * dpi.value,

		/* 人物的頭中心座標 */
		get x() {
			return {
				left: this.r * -4,
				right: this.r * 4,
			}
		},
		get y() {
			return this.r * -10
		},
	}
	const bigMan = {
		/* 半徑，用來形成身體以及當作繪製路徑的比例尺 */
		r: 30 * dpi.value,

		/* 人物的頭中心座標 */
		get x() {
			return {
				left: this.r * -4,
				right: this.r * 4,
			}
		},
		get y() {
			return this.r * -7
		},
	}

	const debouncedUpdateRatio = debounce(() => {
		updateDeviceRatio()
	}, 300)
	onMounted(() => {
		window.addEventListener('resize', debouncedUpdateRatio)
	})
	onUnmounted(() => {
		window.removeEventListener('resize', debouncedUpdateRatio)
	})
</script>
