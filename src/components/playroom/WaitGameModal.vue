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
	import { useTemplateRef, onMounted, onBeforeUnmount } from 'vue'

	/* emits */
	const emit = defineEmits(['delayDispose'])
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
	const delayDispose = () => {
		emit('delayDispose')
	}
	onMounted(() => {
		loadingGameModalRef.value.addEventListener('show.bs.modal', delayDispose)
		loadingGameModalRef.value.addEventListener('hide.bs.modal', delayDispose)
	})
	onBeforeUnmount(() => {
		loadingGameModalRef.value.removeEventListener('show.bs.modal', delayDispose)
		loadingGameModalRef.value.removeEventListener('hide.bs.modal', delayDispose)
	})
</script>
