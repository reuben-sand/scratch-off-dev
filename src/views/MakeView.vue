<template>
	<AppHeader id="make-header" ref="appHeader" />
	<main
		id="drawing-area"
		class="mx-auto d-flex flex-column align-items-center"
		:style="{ 'margin-top': headerHeight ? headerHeight + 'px' : null }"
	>
		<h2 class="h6 align-self-start page-subtitle" :class="deviceRatioChange ? null : 'mt-5'">
			繪製你的刮刮樂
		</h2>
		<h1 class="h3 mb-3 align-self-center page-title">{{ headline }}</h1>
		<div id="tool-and-board" class="d-flex flex-wrap align-items-start justify-content-evenly">
			<ToolbarBtn v-model="toolMode" :boardMode="boardMode" @update-path="clearOrFillPath" />
			<div ref="draw-boards" id="draw-boards" class="bg-white rounded position-relative mb-1">
				<RangeBoard
					:width="boardCanvasWidth"
					:height="boardCanvasHeight"
					:style="boardMode === 'range' ? currentBoardSty : { opacity: 0.5 }"
					class="position-absolute border border-1"
					:scale-x="scaleX"
					:scale-y="scaleY"
					:tool-mode="toolMode"
					@update-path="updateRangePath"
				/>
				<InnerBoard
					:width="boardCanvasWidth"
					:height="boardCanvasHeight"
					:scale-x="scaleX"
					:scale-y="scaleY"
					:tool-mode="toolMode"
					:board-mode="boardMode"
					:style="boardMode === 'inner' ? currentBoardSty : { opacity: 0 }"
					class="position-absolute border border-1"
					@update-path="updateInnerPath"
				/>
				<OuterBoard
					:width="boardCanvasWidth"
					:height="boardCanvasHeight"
					:scale-x="scaleX"
					:scale-y="scaleY"
					:tool-mode="toolMode"
					:board-mode="boardMode"
					:style="boardMode === 'outer' ? currentBoardSty : { opacity: 0 }"
					class="position-absolute border border-1"
					@update-path="updateOuterPath"
				/>
			</div>
			<BoardModeBtn
				class="text-center"
				:class="deviceRatioChange ? ['btn-group-vertical', 'ms-1'] : ['btn-group', 'mt-1']"
				v-model="boardMode"
			/>
		</div>
		<BoradStateBtn
			:range-canvas-path="rangeCanvasPath"
			:inner-canvas-path="innerCanvasPath"
			:outer-canvas-path="outerCanvasPath"
		/>
	</main>
	<TemplatesOffcanvas />
</template>
<script setup>
	import { ref, computed, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
	import { storeToRefs } from 'pinia'
	import AppHeader from '@/components/common/AppHeader.vue'
	import BoardModeBtn from '@/components/make/BoardModeBtn.vue'
	import ToolbarBtn from '@/components/make/ToolbarBtn.vue'
	import RangeBoard from '@/components/make/RangeBoard.vue'
	import InnerBoard from '@/components/make/InnerBoard.vue'
	import OuterBoard from '@/components/make/OuterBoard.vue'
	import BoradStateBtn from '@/components/make/BoardStateBtn.vue'
	import TemplatesOffcanvas from '@/components/make/TemplatesOffcanvas.vue'
	import penSvgPath from '@/assets/pen.svg'
	import eraserSvgPath from '@/assets/eraser.svg'
	import fontsSvgPath from '@/assets/fonts.svg'
	import { debounce } from '@/composables/useRateLimit'
	import { useWindowStore } from '@/stores/WindowStore'
	import { useBoardStore } from '@/stores/BoardStore'

	/* 模板ref */
	const appHeaderRef = useTemplateRef('appHeader')
	const drawBoardsRef = useTemplateRef('draw-boards')
	/* pinia store */
	const windowStore = useWindowStore()
	const { deviceRatioChange } = storeToRefs(windowStore)
	const { updateDeviceRatio } = windowStore
	const boardStore = useBoardStore()
	const { cardClipPath, boardCanvasWidth, boardCanvasHeight } = storeToRefs(boardStore)

	const headerHeight = ref(null)
	const rangeCanvasPath = ref(null)
	const innerCanvasPath = ref([])
	const outerCanvasPath = ref([])
	const updateRangePath = (path) => {
		rangeCanvasPath.value = path
	}
	const updateInnerPath = (path) => {
		innerCanvasPath.value.push(path)
	}
	const updateOuterPath = (path) => {
		outerCanvasPath.value.push(path)
	}
	const clearOrFillPath = (path) => {
		if (boardMode.value === 'inner' && path) {
			innerCanvasPath.value.push(path)
		} else if (boardMode.value === 'outer' && path) {
			outerCanvasPath.value.push(path)
		} else if (boardMode.value === 'inner') {
			innerCanvasPath.value.length = 0
		} else if (boardMode.value === 'outer') {
			outerCanvasPath.value.length = 0
		} else if (boardMode.value === 'range') {
			rangeCanvasPath.value = null
		}
	}
	const boardMode = ref('range')
	const toolMode = ref('pen')
	const scaleX = ref(null)
	const scaleY = ref(null)
	const updateScaleX = () => {
		scaleX.value =
			((drawBoardsRef.value.getBoundingClientRect().width / boardCanvasWidth.value) * 15) / 16
	}
	const updateScaleY = () => {
		scaleY.value =
			((drawBoardsRef.value.getBoundingClientRect().height / boardCanvasHeight.value) * 10) /
			11
	}
	const cursorSvgPath = computed(() => {
		switch (toolMode.value) {
			case 'pen':
				return penSvgPath
			case 'eraser':
				return eraserSvgPath
			case 'fonts':
				return fontsSvgPath
			default:
				return penSvgPath
		}
	})
	const currentBoardSty = computed(() => {
		return { 'z-index': 1, cursor: `url("${cursorSvgPath.value}") 0 16, auto` }
	})
	const debouncedScaleCanvas = debounce(() => {
		updateDeviceRatio()
		updateScaleX()
		updateScaleY()
	}, 300)
	const headline = ref('設置要刮開內容形狀')
	onMounted(() => {
		const headerRect = appHeaderRef.value.headerRef.getBoundingClientRect()
		headerHeight.value = headerRect.height
		updateScaleX()
		updateScaleY()
		window.addEventListener('resize', debouncedScaleCanvas)
	})
	onUnmounted(() => {
		window.removeEventListener('resize', debouncedScaleCanvas)
	})
	watch(boardMode, (newValue) => {
		if (newValue === 'range' && toolMode.value === 'fonts') {
			toolMode.value = 'pen'
		}
	})
	watch(cardClipPath, (newValue) => {
		if (newValue) {
			headline.value = '請繪製刮刮樂內容'
		} else {
			headline.value = '設置要刮開的內容範圍'
		}
	})
</script>
