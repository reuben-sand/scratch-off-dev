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
			<button
				v-show="boardMode !== 'range'"
				ref="toolToolitipTrigger1"
				@click.stop="toggleColorPicker"
				:style="{ color: currentColor.hex8 }"
				style="z-index: 2"
				type="button"
				class="btn toggle-tool-btn"
				:class="[
					firstButtonNameSet.has(toolToolitipTrigger1Ref) ? 'btnFirst' : null,
					lastButtonNameSet.has(toolToolitipTrigger1Ref) ? 'btnLast' : null,
				]"
				data-bs-toggle="tooltip"
				data-bs-custom-class="tool-btn-tooltip"
				:data-bs-placement="tooltipPlacement1"
				data-bs-title="選擇顏色"
				data-bs-trigger="hover"
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
				v-show="boardMode !== 'range'"
				ref="toolToolitipTrigger2"
				@click="clickFillBtn"
				type="button"
				class="btn toggle-tool-btn"
				:class="[
					firstButtonNameSet.has(toolToolitipTrigger2Ref) ? 'btnFirst' : null,
					lastButtonNameSet.has(toolToolitipTrigger2Ref) ? 'btnLast' : null,
				]"
				data-bs-toggle="tooltip"
				data-bs-custom-class="tool-btn-tooltip"
				:data-bs-placement="tooltipPlacement1"
				data-bs-title="填滿空間"
				data-bs-trigger="hover"
			>
				<i class="bi bi-paint-bucket"></i>
			</button>
			<button
				ref="toolToolitipTrigger3"
				@click="clickClearBtn"
				type="button"
				class="btn toggle-tool-btn"
				:class="[
					firstButtonNameSet.has(toolToolitipTrigger3Ref) ? 'btnFirst' : null,
					lastButtonNameSet.has(toolToolitipTrigger3Ref) ? 'btnLast' : null,
				]"
				data-bs-toggle="tooltip"
				data-bs-custom-class="tool-btn-tooltip"
				:data-bs-placement="tooltipPlacement1"
				data-bs-title="清空畫板"
				data-bs-trigger="hover"
			>
				<i class="bi bi-arrow-counterclockwise"></i>
			</button>
		</div>
		<div
			ref="toolToggle2"
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
				ref="toolToolitipTrigger4"
				for="tool-btn1"
				class="btn toggle-tool-btn"
				:class="[
					firstButtonNameSet.has(toolToolitipTrigger4Ref) ? 'btnFirst' : null,
					lastButtonNameSet.has(toolToolitipTrigger4Ref) ? 'btnLast' : null,
				]"
				data-bs-toggle="tooltip"
				data-bs-custom-class="tool-btn-tooltip"
				:data-bs-placement="tooltipPlacement2"
				data-bs-title="畫筆"
				data-bs-trigger="hover"
				><i class="bi bi-pen"></i
			></label>
			<input
				v-show="boardMode !== 'range'"
				v-model="toolMode"
				value="eraser"
				id="tool-btn2"
				name="tool-btn"
				type="radio"
				class="btn-check"
				autocomplete="off"
			/>
			<label
				v-show="boardMode !== 'range'"
				ref="toolToolitipTrigger5"
				for="tool-btn2"
				class="btn toggle-tool-btn"
				:class="[
					firstButtonNameSet.has(toolToolitipTrigger5Ref) ? 'btnFirst' : null,
					lastButtonNameSet.has(toolToolitipTrigger5Ref) ? 'btnLast' : null,
				]"
				data-bs-toggle="tooltip"
				data-bs-custom-class="tool-btn-tooltip"
				:data-bs-placement="tooltipPlacement2"
				data-bs-title="橡皮擦"
				data-bs-trigger="hover"
			>
				<i class="bi bi-eraser"></i
			></label>
			<input
				v-show="boardMode !== 'range'"
				v-model="toolMode"
				value="fonts"
				id="tool-btn3"
				name="tool-btn"
				type="radio"
				class="btn-check"
				autocomplete="off"
			/>
			<label
				v-show="boardMode !== 'range'"
				ref="toolToolitipTrigger6"
				for="tool-btn3"
				class="btn toggle-tool-btn"
				:class="[
					firstButtonNameSet.has(toolToolitipTrigger6Ref) ? 'btnFirst' : null,
					lastButtonNameSet.has(toolToolitipTrigger6Ref) ? 'btnLast' : null,
				]"
				data-bs-toggle="tooltip"
				data-bs-custom-class="tool-btn-tooltip"
				:data-bs-placement="tooltipPlacement2"
				data-bs-title="文字"
				data-bs-trigger="hover"
				><i class="bi bi-fonts"></i
			></label>
		</div>
	</div>
</template>
<script setup>
	import { ref, computed, onMounted, onBeforeUnmount, useTemplateRef, watch } from 'vue'
	import { storeToRefs } from 'pinia'
	import { Tooltip } from 'bootstrap'
	import { Chrome } from '@ckpack/vue-color'
	import { useWindowStore } from '@/stores/WindowStore'
	import { useBoardStore } from '@/stores/BoardStore'
	import { debounce } from '@/composables/useRateLimit.js'
	import { Mutex } from '@/composables/useLock'

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
	const toolToolitipTrigger1Ref = useTemplateRef('toolToolitipTrigger1')
	const toolToolitipTrigger2Ref = useTemplateRef('toolToolitipTrigger2')
	const toolToolitipTrigger3Ref = useTemplateRef('toolToolitipTrigger3')
	const toolToolitipTrigger4Ref = useTemplateRef('toolToolitipTrigger4')
	const toolToolitipTrigger5Ref = useTemplateRef('toolToolitipTrigger5')
	const toolToolitipTrigger6Ref = useTemplateRef('toolToolitipTrigger6')
	const toolToolitipTriggerRefList1 = [
		toolToolitipTrigger1Ref,
		toolToolitipTrigger2Ref,
		toolToolitipTrigger3Ref,
	]
	const toolToolitipTriggerRefList2 = [
		toolToolitipTrigger4Ref,
		toolToolitipTrigger5Ref,
		toolToolitipTrigger6Ref,
	]
	const firstButtonNameSet = ref(new Set())
	const lastButtonNameSet = ref(new Set())

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
	let isCancelled = false
	const tooltipMutex = new Mutex()
	const tooltipSet = new Set()
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
	const updateButtonClasses = () => {
		const displayedFirstBtn1 = toolToolitipTriggerRefList1.find((toolToolitipTriggerRef) => {
			const styleDisplay = getComputedStyle(toolToolitipTriggerRef.value).display
			return styleDisplay !== 'none'
		})
		firstButtonNameSet.value.add(displayedFirstBtn1.value)
		const displayedLastBtn1 = toolToolitipTriggerRefList1.findLast((toolToolitipTriggerRef) => {
			const styleDisplay = getComputedStyle(toolToolitipTriggerRef.value).display
			return styleDisplay !== 'none'
		})
		lastButtonNameSet.value.add(displayedLastBtn1.value)
		const displayedFirstBtn2 = toolToolitipTriggerRefList2.find((toolToolitipTriggerRef) => {
			const styleDisplay = getComputedStyle(toolToolitipTriggerRef.value).display
			return styleDisplay !== 'none'
		})
		firstButtonNameSet.value.add(displayedFirstBtn2.value)
		const displayedLastBtn2 = toolToolitipTriggerRefList2.findLast((toolToolitipTriggerRef) => {
			const styleDisplay = getComputedStyle(toolToolitipTriggerRef.value).display
			return styleDisplay !== 'none'
		})
		lastButtonNameSet.value.add(displayedLastBtn2.value)
	}
	onMounted(() => {
		document.addEventListener('click', openColorPicker)
		toolToolitipTriggerRefList1.forEach((toolToolitipTriggerRef) => {
			toolToolitipTriggerRef.value.addEventListener('show.bs.tooltip', delayTooltipDispose)
			toolToolitipTriggerRef.value.addEventListener('hide.bs.tooltip', delayTooltipDispose)
			tooltipSet.add(new Tooltip(toolToolitipTriggerRef.value))
		})

		toolToolitipTriggerRefList2.forEach((toolToolitipTriggerRef) => {
			toolToolitipTriggerRef.value.addEventListener('show.bs.tooltip', delayTooltipDispose)
			toolToolitipTriggerRef.value.addEventListener('hide.bs.tooltip', delayTooltipDispose)
			tooltipSet.add(new Tooltip(toolToolitipTriggerRef.value))
		})
		updateButtonClasses()
	})
	const disposeBsInstances = async (mutex) => {
		await mutex.acquire()
		try {
			tooltipSet.forEach((tooltip) => {
				tooltip.dispose()
			})
			tooltipSet.clear()
		} finally {
			mutex.release()
		}
	}
	onBeforeUnmount(() => {
		isCancelled = true
		toolToolitipTriggerRefList1.forEach((toolToolitipTriggerRef) => {
			if (toolToolitipTriggerRef.value) {
				toolToolitipTriggerRef.value.removeEventListener(
					'show.bs.tooltip',
					delayTooltipDispose,
				)
				toolToolitipTriggerRef.value.removeEventListener(
					'hide.bs.tooltip',
					delayTooltipDispose,
				)
			}
		})
		toolToolitipTriggerRefList2.forEach((toolToolitipTriggerRef) => {
			if (toolToolitipTriggerRef.value) {
				toolToolitipTriggerRef.value.removeEventListener(
					'show.bs.tooltip',
					delayTooltipDispose,
				)
				toolToolitipTriggerRef.value.removeEventListener(
					'hide.bs.tooltip',
					delayTooltipDispose,
				)
			}
		})
		disposeBsInstances(
			tooltipMutex,
			Tooltip,
			...toolToolitipTriggerRefList1,
			...toolToolitipTriggerRefList2,
		)
	})
	const tooltipsRemake = async (mutex, ...templateRefs) => {
		if (isCancelled) return
		await mutex.acquire()
		try {
			for (const tooltip of tooltipSet) {
				if (isCancelled) return
				tooltip.dispose()
				tooltipSet.delete(tooltip)
			}
			for (const templateRef of templateRefs) {
				if (isCancelled) return
				if (templateRef.value) {
					tooltipSet.add(new Tooltip(templateRef.value))
				}
			}
		} finally {
			mutex.release()
		}
	}
	watch(
		deviceRatioChange,
		debounce(() => {
			tooltipsRemake(
				tooltipMutex,
				...toolToolitipTriggerRefList1,
				...toolToolitipTriggerRefList2,
			)
		}, 500),
	)
	watch(
		() => boardMode,
		debounce(() => {
			firstButtonNameSet.value.clear()
			lastButtonNameSet.value.clear()
			updateButtonClasses()
		}, 200),
	)
</script>
