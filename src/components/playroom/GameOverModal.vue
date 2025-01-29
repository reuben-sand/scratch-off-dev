<template>
	<div
		id="game-over-modal"
		ref="gameOverModal"
		class="modal fade"
		tabindex="-1"
		data-bs-backdrop="static"
	>
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<div class="modal-title">遊戲結果</div>
				</div>
				<div class="modal-body">
					<div v-if="gameResult" class="winning-anime">win</div>
					<div v-else class="losing-anime">lose</div>
				</div>
				<div class="modal-footer">
					<RouterLink to="/" class="btn swing-anime-btn">關閉遊戲</RouterLink>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { Modal } from 'bootstrap'
	import { useTemplateRef } from 'vue'

	/* props */
	const { gameResult } = defineProps({
		gameResult: Boolean,
	})

	/* 模板ref */
	const gameOverModalRef = useTemplateRef('gameOverModal')

	const getModal = () => {
		return Modal.getInstance(gameOverModalRef.value)
	}

	const getOrCreateModal = () => {
		return Modal.getOrCreateInstance(gameOverModalRef.value)
	}

	defineExpose({
		getModal,
		getOrCreateModal,
	})
</script>
