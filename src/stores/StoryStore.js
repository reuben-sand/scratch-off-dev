import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
export const useStoryStore = defineStore('story', () => {
	/* 對話內容 */
	const dialogContent = ref([
		{ start: '' },
		{ blue: '女神\n這是我的心意' },
		{ blue: '請你收下' },
		{ purple: '工具man\n這是你用GPT\n寫的情詩?' },
		{ blue: '不\n這更好' },
		{ purple: '這是\n台積電的股票\n轉讓申請書?' },
		{ blue: '不\n這更好' },
		{ purple: '這是\n油魚遊戲的\n邀請函?' },
		{ blue: '不\n這不難看' },
		{ blue: '這是\n反黑箱刮刮樂' },
		{ purple: '我ㄔㄠ' },
		{ purple: '我超愛' },
		{ end: '' },
	])
	/* 對話數列的執行序數 */
	const dialogOrder = ref(0)
	const key = computed(() => {
		return Object.keys(dialogContent.value[dialogOrder.value])[0]
	})
	const isAnimating = ref(true)
	return { dialogContent, dialogOrder, key, isAnimating }
})
