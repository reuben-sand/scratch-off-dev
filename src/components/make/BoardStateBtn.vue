<template>
	<div>
		<div
			ref="saveToolitipTriggers"
			class="d-inline-block me-1"
			tabindex="0"
			data-bs-toggle="tooltip"
			:data-bs-title="isTemplateEnabled ? '點擊可儲存' : '需繪製內容才可儲存'"
			data-bs-custom-class="templates-btn-tooltip"
			:data-bs-placement="deviceRatioChange ? 'top' : 'bottom'"
			data-bs-trigger="hover"
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
			:data-bs-placement="deviceRatioChange ? 'top' : 'bottom'"
			data-bs-trigger="hover"
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
	import { ref, computed, useTemplateRef, onMounted, watch, onBeforeUnmount } from 'vue'
	import { useRouter } from 'vue-router'
	import { storeToRefs } from 'pinia'
	import { Toast, Tooltip, Modal } from 'bootstrap'
	import { updateDoc, doc, getDoc, arrayUnion } from 'firebase/firestore'
	import { auth, firestoreDB, functions } from '@/firebase'
	import { debounce } from '@/composables/useRateLimit'
	import { Mutex } from '@/composables/useLock'
	import { useUserStore } from '@/stores/UserStore'
	import { useWindowStore } from '@/stores/WindowStore'
	import { httpsCallable } from 'firebase/functions'

	/* pinia store*/
	const userStore = useUserStore()
	const { updateUserTemplates } = userStore
	const { waitRoute, isRoomOwner, userTemplatesList } = storeToRefs(userStore)
	const windowStore = useWindowStore()
	const { deviceRatioChange } = storeToRefs(windowStore)
	/* router */
	const router = useRouter()

	/* props */
	const { rangeCanvasPath, innerCanvasPath, outerCanvasPath } = defineProps({
		rangeCanvasPath: [null, Object],
		innerCanvasPath: Array,
		outerCanvasPath: Array,
	})

	/* 模板ref */
	const createToolitipTriggersRef = useTemplateRef('createToolitipTriggers')
	const saveToolitipTriggersRef = useTemplateRef('saveToolitipTriggers')
	const createRoomModalRef = useTemplateRef('createRoomModal')
	const toastRef = useTemplateRef('toast')

	const isTemplateEnabled = computed(() =>
		innerCanvasPath.length > 0 && outerCanvasPath.length > 0 && rangeCanvasPath ? true : false,
	)
	const isGameEnabled = computed(() => userTemplatesList.value.length >= 2)
	const toastInfo = ref('')
	const clickSaveBtn = debounce(async () => {
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
			if (isCancelled) return
			Toast.getOrCreateInstance(toastRef.value).show()
		}
	}, 500)
	const createRoom = httpsCallable(functions, 'createRoom')
	const clickCreateBtn = debounce(async () => {
		try {
			const result = await createRoom({})
			const roomId = result.data.roomId
			await new Promise((resolve) => {
				setTimeout(resolve, 500)
			})
			if (isCancelled) return
			const modal = Modal.getOrCreateInstance(createRoomModalRef.value)
			modal.hide()
			waitRoute.value = roomId
			isRoomOwner.value = true
			router.push(`/playroom/${roomId}`)
		} catch (error) {
			if (error.message) {
				toastInfo.value = error.message ? error.message : '未知的錯誤，請稍後再試'
			}
			if (isCancelled) return
			const modal = Modal.getOrCreateInstance(createRoomModalRef.value)
			modal.hide()
			Toast.getOrCreateInstance(toastRef.value).show()
		}
	}, 500)
	let isCancelled = false
	const modalMutex = new Mutex()
	const toastMutex = new Mutex()
	const saveTooltipMutex = new Mutex()
	const createTooltipMutex = new Mutex()
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
	const delayModalDispose = () => {
		delayBsInstanceDispose(500, modalMutex)
	}
	const delayToastDispose = () => {
		delayBsInstanceDispose(300, toastMutex)
	}
	const delayTooltipDispose = () => {
		delayBsInstanceDispose(300, saveTooltipMutex, createTooltipMutex)
	}
	const tooltipRemake = async (mutex, templateRefValue) => {
		if (isCancelled) return
		await mutex.acquire()
		try {
			if (isCancelled) return
			const tooltip = Tooltip.getInstance(templateRefValue)
			if (tooltip) {
				tooltip.dispose()
			}
			if (isCancelled) return
			new Tooltip(templateRefValue)
		} finally {
			mutex.release()
		}
	}
	onMounted(() => {
		new Tooltip(saveToolitipTriggersRef.value)
		if (!isGameEnabled.value) {
			new Tooltip(createToolitipTriggersRef.value)
		}
		createRoomModalRef.value.addEventListener('show.bs.modal', delayModalDispose)
		createRoomModalRef.value.addEventListener('hide.bs.modal', delayModalDispose)
		toastRef.value.addEventListener('show.bs.toast', delayToastDispose)
		toastRef.value.addEventListener('hide.bs.toast', delayToastDispose)
		saveToolitipTriggersRef.value.addEventListener('show.bs.tooltip', delayTooltipDispose)
		saveToolitipTriggersRef.value.addEventListener('hide.bs.tooltip', delayTooltipDispose)
		createToolitipTriggersRef.value.addEventListener('show.bs.tooltip', delayTooltipDispose)
		createToolitipTriggersRef.value.addEventListener('hide.bs.tooltip', delayTooltipDispose)
	})
	const disposeBsInstance = async (mutex, type, templateRefValue) => {
		if (type.getInstance(templateRefValue)) {
			const bsInstance = type.getInstance(templateRefValue)
			await mutex.acquire()
			try {
				bsInstance.dispose()
			} finally {
				mutex.release()
			}
		}
	}
	onBeforeUnmount(() => {
		isCancelled = false
		createRoomModalRef.value.removeEventListener('show.bs.modal', delayModalDispose)
		createRoomModalRef.value.removeEventListener('hide.bs.modal', delayModalDispose)
		toastRef.value.removeEventListener('show.bs.toast', delayToastDispose)
		toastRef.value.removeEventListener('hide.bs.toast', delayToastDispose)
		saveToolitipTriggersRef.value.removeEventListener('show.bs.tooltip', delayTooltipDispose)
		saveToolitipTriggersRef.value.removeEventListener('hide.bs.tooltip', delayTooltipDispose)
		createToolitipTriggersRef.value.removeEventListener('show.bs.tooltip', delayTooltipDispose)
		createToolitipTriggersRef.value.removeEventListener('hide.bs.tooltip', delayTooltipDispose)

		disposeBsInstance(modalMutex, Modal, createRoomModalRef.value)
		disposeBsInstance(toastMutex, Toast, toastRef.value)
		disposeBsInstance(saveTooltipMutex, Tooltip, saveToolitipTriggersRef.value)
		disposeBsInstance(createTooltipMutex, Tooltip, createToolitipTriggersRef.value)
	})
	watch(
		deviceRatioChange,
		debounce(() => {
			tooltipRemake(saveTooltipMutex, saveToolitipTriggersRef.value)
			tooltipRemake(createTooltipMutex, createToolitipTriggersRef.value)
		}, 500),
	)
	watch(
		isTemplateEnabled,
		debounce(() => {
			tooltipRemake(saveTooltipMutex, saveToolitipTriggersRef.value)
		}, 500),
	)
	watch(
		isGameEnabled,
		debounce(async (newValue) => {
			await createTooltipMutex.acquire()
			try {
				if (isCancelled) return
				const tooltip = Tooltip.getInstance(createToolitipTriggersRef.value)
				if (tooltip) {
					if (newValue) {
						tooltip.disable()
					} else {
						tooltip.enable()
					}
				}
			} finally {
				createTooltipMutex.release()
			}
		}, 500),
	)
</script>
