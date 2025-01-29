<template>
	<div ref="templatesBtnGroup">
		<div
			ref="saveToolitipTriggers"
			class="d-inline-block me-1"
			tabindex="0"
			data-bs-toggle="tooltip"
			:data-bs-title="isTemplateEnabled ? '點擊可儲存' : '需繪製內容才可儲存'"
			data-bs-custom-class="templates-btn-tooltip"
		>
			<button
				@click="clickSaveBtn"
				id="save-btn"
				type="button"
				class="btn templates-btn"
				:disabled="!isTemplateEnabled"
			>
				儲存模板
			</button>
		</div>
		<div
			ref="createToolitipTriggers"
			class="d-inline-block"
			tabindex="0"
			data-bs-toggle="tooltip"
			:data-bs-title="isGameEnabled ? '點擊可創建遊戲' : '至少儲存2個模板才可創建遊戲'"
			data-bs-custom-class="templates-btn-tooltip"
		>
			<button
				@click="clickCreateBtn"
				id="create-game-btn"
				type="button"
				class="btn templates-btn"
				:disabled="!isGameEnabled"
				data-bs-toggle="modal"
				data-bs-target="#create-room-modal"
			>
				創建遊戲
			</button>
		</div>
		<Teleport to="body">
			<div
				ref="createRoomModal"
				id="create-room-modal"
				class="modal fade"
				tabindex="-1"
				data-bs-backdrop="static"
				data-bs-keyboard="false"
				aria-label="創建房間中"
				aria-hidden="true"
			>
				<div class="modal-dialog modal-dialog-centered">
					<div class="modal-content">
						<div class="modal-body d-flex align-items-center">
							創建房間中&nbsp;
							<div class="spinner-border">
								<span class="visuall-hidden"></span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div
				ref="toast"
				id="save-info-toast"
				class="toast text-center position-absolute top-50 start-50 translate-middle"
				role="alert"
				aria-live="assertive"
				aria-atomic="true"
			>
				<div class="toast-body">{{ toastInfo }}</div>
			</div>
		</Teleport>
	</div>
</template>
<script setup>
	import { ref, computed, useTemplateRef, onMounted, onUnmounted, watch } from 'vue'
	import { useRouter } from 'vue-router'
	import { storeToRefs } from 'pinia'
	import { Toast, Tooltip, Modal } from 'bootstrap'
	import { updateDoc, doc, getDoc, arrayUnion } from 'firebase/firestore'
	import { auth, firestoreDB, functions } from '@/firebase'
	import { debounce } from '@/composables/useRateLimit'
	import { useUserStore } from '@/stores/UserStore'
	import { httpsCallable } from 'firebase/functions'

	/* pinia store*/
	const userStore = useUserStore()
	const { updateUserTemplates } = userStore
	const { waitRoute, isRoomOwner, userTemplatesList } = storeToRefs(userStore)

	/* router */
	const router = useRouter()

	/* props */
	const { rangeCanvasPath, innerCanvasPath, outerCanvasPath } = defineProps({
		rangeCanvasPath: [null, Object],
		innerCanvasPath: Array,
		outerCanvasPath: Array,
	})

	/* 模板ref */
	const templatesBtnGroupRef = useTemplateRef('templatesBtnGroup')
	const createToolitipTriggersRef = useTemplateRef('createToolitipTriggers')
	const saveToolitipTriggersRef = useTemplateRef('saveToolitipTriggers')
	const createRoomModalRef = useTemplateRef('createRoomModal')
	const toastRef = useTemplateRef('toast')

	const isTemplateEnabled = computed(() =>
		innerCanvasPath.length > 0 && outerCanvasPath.length > 0 && rangeCanvasPath ? true : false,
	)
	const isGameEnabled = computed(() => userTemplatesList.value.length >= 2)
	const toastInfo = ref('')
	const clickSaveBtn = async () => {
		if (innerCanvasPath.length > 0 && outerCanvasPath.length > 0 && rangeCanvasPath) {
			const user = auth.currentUser
			const docRef = doc(firestoreDB, 'users', user.uid)
			const docSnap = await getDoc(docRef)
			if (docSnap.exists() && docSnap.data().templates.length <= 4) {
				const templateId = Date.now().toString()
				await updateDoc(docRef, {
					templates: arrayUnion({
						id: templateId,
						range: rangeCanvasPath,
						inner: innerCanvasPath,
						outer: outerCanvasPath,
					}),
				})
				toastInfo.value = '儲存成功'
				updateUserTemplates({
					id: templateId,
					range: rangeCanvasPath,
					inner: innerCanvasPath,
					outer: outerCanvasPath,
				})
			} else {
				toastInfo.value = '儲存失敗，儲存模板限制5個'
			}
			const toast = new Toast(toastRef.value)
			toast.show()
		}
	}
	const createRoom = httpsCallable(functions, 'createRoom')
	const clickCreateBtn = async () => {
		try {
			const result = await createRoom({})
			const roomId = result.data.roomId
			await new Promise((resolve) => {
				setTimeout(resolve, 500)
			})
			const modal = Modal.getOrCreateInstance(createRoomModalRef.value)
			modal.hide()
			waitRoute.value = roomId
			isRoomOwner.value = true
			router.push(`/playroom/${roomId}`)
		} catch (error) {
			if (error.message) {
				toastInfo.value = error.message ? error.message : '未知的錯誤，請稍後再試'
			}
			const toast = new Toast(toastRef.value)
			toast.show()
			await new Promise((resolve) => {
				setTimeout(resolve, 500)
			})
			const modal = Modal.getOrCreateInstance(createRoomModalRef.value)
			modal.hide()
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
	onMounted(() => {
		const tooltipTriggerList = [].slice.call(
			templatesBtnGroupRef.value.querySelectorAll('[data-bs-toggle="tooltip"]'),
		)
		tooltipTriggerList.forEach(function (tooltipTriggerEl) {
			return new Tooltip(tooltipTriggerEl)
		})
		templatesBtnGroupRef.value.addEventListener('shown.bs.tooltip', autoHide)
	})
	onUnmounted(() => {
		if (templatesBtnGroupRef.value) {
			templatesBtnGroupRef.value.removeEventListener('shown.bs.tooltip', autoHide)
		}
	})
	watch(isTemplateEnabled, () => {
		const tooltip = Tooltip.getInstance(saveToolitipTriggersRef.value)
		if (tooltip) {
			tooltip.hide()
			setTimeout(() => {
				tooltip.dispose()
			}, 100)
			setTimeout(() => {
				new Tooltip(saveToolitipTriggersRef.value)
			}, 200)
		} else {
			new Tooltip(saveToolitipTriggersRef.value)
		}
	})
	watch(isGameEnabled, () => {
		const tooltip = Tooltip.getOrCreateInstance(createToolitipTriggersRef.value)
		if (tooltip) {
			tooltip.hide()
			setTimeout(() => {
				tooltip.dispose()
			}, 100)
			setTimeout(() => {
				new Tooltip(createToolitipTriggersRef.value)
			}, 200)
		} else {
			new Tooltip(createToolitipTriggersRef.value)
		}
	})
</script>
