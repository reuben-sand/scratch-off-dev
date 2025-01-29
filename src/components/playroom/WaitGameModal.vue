<template>
	<div
		data-bs-backdrop="static"
		ref="loadingGameModal"
		id="wait-game-modal"
		class="modal"
		tabindex="-1"
	>
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content border-0">
				<div class="modal-body">
					<div class="d-flex">
						<div v-for="n in 10" :key="n" class="scratch-off-unit"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { Modal } from 'bootstrap'
	import { useTemplateRef } from 'vue'

	/* 模板ref */
	const loadingGameModalRef = useTemplateRef('loadingGameModal')

	const getModal = () => {
		return Modal.getInstance(loadingGameModalRef.value)
	}
	const getOrCreateModal = () => {
		return Modal.getOrCreateInstance(loadingGameModalRef.value)
	}
	/* expose */
	defineExpose({
		getModal,
		getOrCreateModal,
	})
</script>
