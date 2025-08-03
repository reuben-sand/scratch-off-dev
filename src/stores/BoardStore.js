import { ref, computed } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useWindowStore } from '@/stores/WindowStore'
export const useBoardStore = defineStore('board', () => {
	const windowStore = useWindowStore()
	const { dpi } = storeToRefs(windowStore)

	const cardClipPath = ref(null)
	const clearBoard = ref('')
	const fillBoard = ref('')
	const currentColor = ref({ hex8: 'black' })
	const boardCanvasWidth = computed(() => {
		return 300 * dpi.value
	})
	const boardCanvasHeight = computed(() => {
		return 200 * dpi.value
	})
	return {
		cardClipPath,
		clearBoard,
		currentColor,
		fillBoard,
		boardCanvasWidth,
		boardCanvasHeight,
	}
})
