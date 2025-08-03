<template>
	<div ref="btnGroup" id="board-toggle" role="group" aria-labal="切換繪製項目">
		<input
			v-model="boardMode"
			value="range"
			type="radio"
			class="btn-check"
			name="drawTask"
			id="drawTask1"
			autocomplete="off"
			required
		/>
		<label
			class="btn toggle-board-btn"
			ref="boardToolitipTrigger1"
			for="drawTask1"
			data-bs-toggle="tooltip"
			:data-bs-placement="tooltipPlacement"
			data-bs-custom-class="board-btn-tooltip"
			data-bs-title="制定塗層範圍"
			data-bs-trigger="hover"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				version="1.1"
				viewBox="0 0 48 48"
				width="36"
				height="36"
			>
				<polygon
					fill="none"
					stroke="currentColor"
					stroke-linejoin="round"
					stroke-width="1"
					points="24 18.08 27.71 25.6 36 26.8 30 32.65 31.42 40.91 24 37.01 16.58 40.91 18 32.65 12 26.8 20.29 25.6 24 18.08"
				/>
				<path
					fill="currentColor"
					d="M42.95,4.62c-1.2-.87-2.88-.61-3.75.59l-10.12,13.93-.98,5.92,5.32-2.76,10.12-13.93c.87-1.2.61-2.88-.59-3.75Z"
				/>
				<rect
					stroke-miterlimit="10"
					fill="none"
					stroke="currentColor"
					x="2.4"
					y="15.1"
					width="43.2"
					height="28.8"
				/>
			</svg>
		</label>
		<input
			v-model="boardMode"
			value="inner"
			type="radio"
			class="btn-check"
			name="drawTask"
			id="drawTask2"
			autocomplete="off"
			:disabled="drawnRange"
		/>
		<label
			class="btn toggle-board-btn"
			ref="boardToolitipTrigger2"
			for="drawTask2"
			data-bs-toggle="tooltip"
			:data-bs-placement="tooltipPlacement"
			data-bs-custom-class="board-btn-tooltip"
			data-bs-title="繪製塗層下外觀"
			data-bs-trigger="hover"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				version="1.1"
				viewBox="0 0 48 48"
				width="36"
				height="36"
			>
				<polygon
					fill="currentColor"
					stroke-linejoin="round"
					points="24 18.08 27.71 25.6 36 26.8 30 32.65 31.42 40.91 24 37.01 16.58 40.91 18 32.65 12 26.8 20.29 25.6 24 18.08"
				/>
				<path
					fill="currentColor"
					d="M42.95,4.62c-1.2-.87-2.88-.61-3.75.59l-10.12,13.93-.98,5.92,5.32-2.76,10.12-13.93c.87-1.2.61-2.88-.59-3.75Z"
				/>
				<rect
					fill="none"
					stroke-miterlimit="10"
					stroke="currentColor"
					x="2.4"
					y="15.1"
					width="43.2"
					height="28.8"
				/>
			</svg>
		</label>
		<input
			v-model="boardMode"
			value="outer"
			type="radio"
			class="btn-check"
			name="drawTask"
			id="drawTask3"
			autocomplete="off"
			:disabled="drawnRange"
		/>
		<label
			class="btn toggle-board-btn"
			for="drawTask3"
			ref="boardToolitipTrigger3"
			data-bs-toggle="tooltip"
			:data-bs-placement="tooltipPlacement"
			data-bs-custom-class="board-btn-tooltip"
			data-bs-title="繪製塗層上外觀"
			data-bs-trigger="hover"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				version="1.1"
				viewBox="0 0 48 48"
				width="36"
				height="36"
				fill="currentColor"
			>
				<polygon
					points="31.08 24.67 30.91 24.9 30.66 25.03 25.34 27.79 23.21 28.9 23.6 26.53 24.59 20.62 24.63 20.34 24.8 20.11 29.63 13.46 2.4 13.46 2.4 42.26 45.6 42.26 45.6 13.46 39.23 13.46 31.08 24.67"
				/>
				<path
					d="M39.64,6.26c-1.2-.87-2.88-.61-3.75.59l-10.12,13.93-.98,5.92,5.32-2.76,10.12-13.93c.87-1.2.61-2.88-.59-3.75Z"
				/>
			</svg>
		</label>
	</div>
</template>
<script setup>
	import { ref, computed, onMounted, useTemplateRef, watch, onBeforeUnmount } from 'vue'
	import { storeToRefs } from 'pinia'
	import { Tooltip } from 'bootstrap'
	import { useBoardStore } from '@/stores/BoardStore'
	import { useWindowStore } from '@/stores/WindowStore'
	import { debounce } from '@/composables/useRateLimit'
	import { Mutex } from '@/composables/useLock'

	/* pinia store */
	const boardStore = useBoardStore()
	const { cardClipPath } = storeToRefs(boardStore)
	const windowStore = useWindowStore()
	const { deviceRatioChange } = storeToRefs(windowStore)

	/* 組件Model */
	const boardMode = defineModel({ required: true, default: 'range' })

	/* 模板ref */
	const boardToolitipTrigger1Ref = useTemplateRef('boardToolitipTrigger1')
	const boardToolitipTrigger2Ref = useTemplateRef('boardToolitipTrigger2')
	const boardToolitipTrigger3Ref = useTemplateRef('boardToolitipTrigger3')
	const boardToolitipTriggerRefList = [
		boardToolitipTrigger1Ref,
		boardToolitipTrigger2Ref,
		boardToolitipTrigger3Ref,
	]

	const drawnRange = ref(true)
	const tooltipPlacement = computed(() => (deviceRatioChange.value ? 'left' : 'top'))
	let isCancelled = false

	const tooltipMutex = new Mutex()
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
	const delayTooltipDispose = () => {
		delayBsInstanceDispose(300, tooltipMutex)
	}
	onMounted(() => {
		boardToolitipTriggerRefList.forEach((boardToolitipTriggerRef) => {
			boardToolitipTriggerRef.value.addEventListener('show.bs.tooltip', delayTooltipDispose)
			boardToolitipTriggerRef.value.addEventListener('hide.bs.tooltip', delayTooltipDispose)
			new Tooltip(boardToolitipTriggerRef.value)
		})
	})
	const disposeBsInstances = async (mutex, type, ...templateRefs) => {
		const bsInstances = templateRefs.map((templateRef) => {
			return type.getInstance(templateRef.value)
		})
		await mutex.acquire()
		try {
			bsInstances.forEach((bsInstance) => {
				if (bsInstance) {
					bsInstance.dispose()
				}
			})
		} finally {
			mutex.release()
		}
	}
	onBeforeUnmount(() => {
		isCancelled = true
		boardToolitipTriggerRefList.forEach((boardToolitipTriggerRef) => {
			boardToolitipTriggerRef.value.removeEventListener(
				'show.bs.tooltip',
				delayTooltipDispose,
			)
			boardToolitipTriggerRef.value.removeEventListener(
				'hide.bs.tooltip',
				delayTooltipDispose,
			)
		})
		disposeBsInstances(tooltipMutex, Tooltip, ...boardToolitipTriggerRefList)
	})

	const tooltipsRemake = async (mutex, ...templateRefs) => {
		if (isCancelled) return
		await mutex.acquire()
		try {
			for (const templateRef of templateRefs) {
				if (templateRef.value) {
					if (isCancelled) return
					const tooltip = Tooltip.getInstance(templateRef.value)
					if (tooltip) {
						tooltip.dispose()
					}
					if (isCancelled) return
					new Tooltip(templateRef.value)
				}
			}
		} finally {
			mutex.release()
		}
	}
	watch(
		deviceRatioChange,
		debounce(() => {
			tooltipsRemake(tooltipMutex, ...boardToolitipTriggerRefList)
		}, 500),
	)
	watch(cardClipPath, (newValue) => {
		if (newValue) {
			drawnRange.value = false
		} else if (newValue === null) {
			drawnRange.value = true
		}
	})
</script>
