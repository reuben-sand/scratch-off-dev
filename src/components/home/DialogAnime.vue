<template>
	<p id="dialogue" class="position-absolute" :style="dialogueStyle">{{ dialogue }}</p>
</template>

<script setup>
	import { computed } from 'vue'
	import { storeToRefs } from 'pinia'
	import { useStoryStore } from '@/stores/StoryStore'

	/* pinia store */
	const storyStore = useStoryStore()
	const { dialogContent, dialogOrder, key } = storeToRefs(storyStore)

	/* props */
	const { swatcher } = defineProps({
		swatcher: Object,
	})

	const dialogue = computed(() => {
		return dialogContent.value[dialogOrder.value][key.value]
	})
	const dialogueStyle = computed(() => {
		switch (key.value) {
			case 'blue':
				return { textAlign: 'left', color: swatcher.blue }
			case 'purple':
				return { textAlign: 'right', color: swatcher.purple }
			default:
				return {}
		}
	})
</script>
