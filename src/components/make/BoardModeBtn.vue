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
			for="drawTask1"
			data-bs-toggle="tooltip"
			:data-bs-placement="tooltipPlacement"
			data-bs-custom-class="board-btn-tooltip"
			data-bs-title="制定塗層範圍"
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
			for="drawTask2"
			data-bs-toggle="tooltip"
			:data-bs-placement="tooltipPlacement"
			data-bs-custom-class="board-btn-tooltip"
			data-bs-title="繪製塗層下外觀"
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
			data-bs-toggle="tooltip"
			:data-bs-placement="tooltipPlacement"
			data-bs-custom-class="board-btn-tooltip"
			data-bs-title="繪製塗層上外觀"
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
	import { ref, computed, onMounted, useTemplateRef, watch } from 'vue'
	import { storeToRefs } from 'pinia'
	import { Tooltip } from 'bootstrap'
	import { useBoardStore } from '@/stores/BoardStore'
	import { useWindowStore } from '@/stores/WindowStore'

	/* pinia store */
	const boardStore = useBoardStore()
	const { cardClipPath } = storeToRefs(boardStore)
	const windowStore = useWindowStore()
	const { deviceRatioChange } = storeToRefs(windowStore)

	/* 組件Model */
	const boardMode = defineModel({ required: true, default: 'range' })

	/* 模板ref */
	const btnGroupRef = useTemplateRef('btnGroup')

	const drawnRange = ref(true)
	const tooltipPlacement = computed(() => (deviceRatioChange.value ? 'left' : 'top'))
	onMounted(() => {
		const tooltipTriggerList = [].slice.call(
			btnGroupRef.value.querySelectorAll('[data-bs-toggle="tooltip"]'),
		)
		tooltipTriggerList.forEach(function (tooltipTriggerEl) {
			return new Tooltip(tooltipTriggerEl)
		})
	})
	watch(deviceRatioChange, () => {
		const tooltipTriggers = btnGroupRef.value.querySelectorAll('[data-bs-toggle="tooltip"]')
		tooltipTriggers.forEach((trigger) => {
			const tooltipInstance = Tooltip.getInstance(trigger)
			if (tooltipInstance) {
				tooltipInstance.dispose()
			}
			setTimeout(() => {
				new Tooltip(trigger)
			}, 100)
		})
	})
	watch(cardClipPath, (newValue) => {
		if (newValue) {
			drawnRange.value = false
		} else if (newValue === null) {
			drawnRange.value = true
		}
	})
</script>
