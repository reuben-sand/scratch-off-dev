<template>
	<div id="btn-toolbar" class="d-flex" ref="btnToolBar" role="toolbar">
		<div
			ref="toolToggle1"
			id="tool-toggle1"
			:class="deviceRatioChange ? ['btn-group-vertical', 'me-1'] : ['btn-group', 'my-1']"
			class="btn-group-sm position-relative"
			role="group"
			aria-label="繪畫工具組"
		>
			<template v-if="boardMode !== 'range'">
				<button
					@click.stop="toggleColorPicker"
					:style="{ color: currentColor.hex8 }"
					style="z-index: 2"
					type="button"
					class="btn toggle-tool-btn"
					data-bs-toggle="tooltip"
					data-bs-custom-class="tool-btn-tooltip"
					:data-bs-placement="tooltipPlacement1"
					data-bs-title="選擇顏色"
				>
					<Chrome
						@click.stop
						v-if="colorPickerOpened"
						id="color-picker"
						class="position-absolute"
						v-model="currentColor"
					/>
					<i class="bi bi-circle-fill"></i>
				</button>
				<button
					@click="clickFillBtn"
					type="button"
					class="btn toggle-tool-btn"
					data-bs-toggle="tooltip"
					data-bs-custom-class="tool-btn-tooltip"
					:data-bs-placement="tooltipPlacement1"
					data-bs-title="填滿空間"
				>
					<i class="bi bi-paint-bucket"></i>
				</button>
			</template>
			<button
				@click="clickClearBtn"
				type="button"
				class="btn toggle-tool-btn"
				data-bs-toggle="tooltip"
				data-bs-custom-class="tool-btn-tooltip"
				:data-bs-placement="tooltipPlacement1"
				data-bs-title="清空畫板"
			>
				<i class="bi bi-arrow-counterclockwise"></i>
			</button>
		</div>
		<div
			id="tool-toggle2"
			:class="deviceRatioChange ? ['btn-group-vertical', 'me-1'] : ['btn-group', 'mb-1']"
			class="btn-group-sm"
		>
			<input
				v-model="toolMode"
				value="pen"
				id="tool-btn1"
				name="tool-btn"
				type="radio"
				class="btn-check"
				autocomplete="off"
				required
			/>
			<label
				for="tool-btn1"
				class="btn toggle-tool-btn"
				data-bs-toggle="tooltip"
				data-bs-custom-class="tool-btn-tooltip"
				:data-bs-placement="tooltipPlacement2"
				data-bs-title="畫筆"
				><i class="bi bi-pen"></i
			></label>
			<template v-if="boardMode !== 'range'">
				<input
					v-model="toolMode"
					value="eraser"
					id="tool-btn2"
					name="tool-btn"
					type="radio"
					class="btn-check"
					autocomplete="off"
				/>
				<label
					for="tool-btn2"
					class="btn toggle-tool-btn"
					data-bs-toggle="tooltip"
					data-bs-custom-class="tool-btn-tooltip"
					:data-bs-placement="tooltipPlacement2"
					data-bs-title="橡皮擦"
				>
					<i class="bi bi-eraser"></i
				></label>
				<input
					v-model="toolMode"
					value="fonts"
					id="tool-btn3"
					name="tool-btn"
					type="radio"
					class="btn-check"
					autocomplete="off"
				/>
				<label
					for="tool-btn3"
					class="btn toggle-tool-btn"
					data-bs-toggle="tooltip"
					data-bs-custom-class="tool-btn-tooltip"
					:data-bs-placement="tooltipPlacement2"
					data-bs-title="文字"
					><i class="bi bi-fonts"></i
				></label>
			</template>
		</div>
	</div>
</template>
<script setup>
	import { ref, computed, onMounted, onUnmounted, useTemplateRef, watch, nextTick } from 'vue'
	import { storeToRefs } from 'pinia'
	import { Tooltip } from 'bootstrap'
	import { Chrome } from '@ckpack/vue-color'
	import { useWindowStore } from '@/stores/WindowStore'
	import { useBoardStore } from '@/stores/BoardStore'
	import { debounce } from '@/composables/useRateLimit.js'

	/* pinia store */
	const windowStore = useWindowStore()
	const { deviceRatioChange } = storeToRefs(windowStore)
	const boardStore = useBoardStore()
	const { fillBoard, clearBoard, currentColor } = storeToRefs(boardStore)

	/* emit */
	const emit = defineEmits(['updatePath'])

	/* props */
	const { boardMode } = defineProps({
		boardMode: String,
	})

	/* 模板ref */
	const toolToggle1Ref = useTemplateRef('toolToggle1')
	const btnToolBarRef = useTemplateRef('btnToolBar')

	const tooltipPlacement1 = computed(() => (deviceRatioChange.value ? 'left' : 'top'))
	const tooltipPlacement2 = computed(() => (deviceRatioChange.value ? 'right' : 'bottom'))
	const toolMode = defineModel({ required: true, default: 'pen' })
	const colorPickerOpened = ref(false)
	const toggleColorPicker = () => {
		colorPickerOpened.value = !colorPickerOpened.value
	}
	const openColorPicker = (event) => {
		if (event.target.id !== 'color-picker' && colorPickerOpened.value) {
			colorPickerOpened.value = false
		}
	}
	const autoHide = debounce((event) => {
		if (Tooltip.getInstance(event.target)) {
			const tooltip = Tooltip.getInstance(event.target)
			setTimeout(() => {
				tooltip.hide()
			}, 1000)
		}
	}, 1000)
	let pathData = { actions: [] }
	const clickClearBtn = () => {
		clearBoard.value = boardMode
		emit('updatePath')
	}
	const clickFillBtn = () => {
		fillBoard.value = boardMode
		pathData.tool = 'fill'
		pathData.color = currentColor.value.hex8
		emit('updatePath', { ...pathData })
		pathData = { actions: [] }
	}
	onMounted(() => {
		document.addEventListener('click', openColorPicker)
		const tooltipTriggerList = [].slice.call(
			btnToolBarRef.value.querySelectorAll('[data-bs-toggle="tooltip"]'),
		)
		tooltipTriggerList.forEach(function (tooltipTriggerEl) {
			return new Tooltip(tooltipTriggerEl)
		})
		toolToggle1Ref.value.addEventListener('shown.bs.tooltip', autoHide)
	})
	onUnmounted(() => {
		document.removeEventListener('click', openColorPicker)
		if (toolToggle1Ref.value) {
			toolToggle1Ref.value.removeEventListener('shown.bs.tooltip', autoHide)
		}
	})
	watch(deviceRatioChange, () => {
		const tooltipTriggers = btnToolBarRef.value.querySelectorAll('[data-bs-toggle="tooltip"]')
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
	watch(
		() => boardMode,
		async () => {
			await nextTick()
			const tooltipTriggers = btnToolBarRef.value.querySelectorAll(
				'[data-bs-toggle="tooltip"]',
			)
			tooltipTriggers.forEach((trigger) => {
				const tooltipInstance = Tooltip.getInstance(trigger)

				if (tooltipInstance) {
					tooltipInstance.hide()
					setTimeout(() => {
						tooltipInstance.dispose()
					}, 100)
					setTimeout(() => {
						new Tooltip(trigger)
					}, 200)
				} else {
					new Tooltip(trigger)
				}
			})
		},
	)
</script>
