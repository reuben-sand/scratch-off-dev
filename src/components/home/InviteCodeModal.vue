<template>
	<div
		id="invite-code-modal"
		class="home-modal modal"
		ref="inviteCodeModal"
		tabindex="-1"
		aria-labelledby="invite-code-modal-title"
		aria-hidden="false"
	>
		<div class="modal-dialog modal-sm modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-header">
					<h5 id="invite-code-modal-title" class="modal-title">輸入邀請碼，與朋友遊玩</h5>
					<button
						type="button"
						class="btn-close"
						data-bs-dismiss="modal"
						aria-label="關閉"
					></button>
				</div>
				<div class="modal-body">
					<form
						@submit.prevent="submitInviteCode"
						id="invite-code-form"
						:class="{ 'was-validated': showValidation }"
						novalidate
					>
						<div class="mb-3">
							<label for="invite-code-input" class="form-label">邀請碼</label>
							<input
								ref="inviteCodeInput"
								v-model="inviteCode"
								id="invite-code-input"
								:class="inputisInvalid ? 'is-invalid' : ''"
								class="form-control"
								type="text"
								minlength="6"
								maxlength="6"
								pattern="[a-zA-Z0-9]+"
								required
							/>
							<div class="invalid-feedback">
								{{ inviteCodeInvalid }}
							</div>
						</div>
						<button type="submit" class="btn swing-anime-btn w-100">確認</button>
					</form>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
	import { ref, useTemplateRef, onMounted, watch, onBeforeUnmount } from 'vue'
	import { useRouter } from 'vue-router'
	import { Modal } from 'bootstrap'
	import { storeToRefs } from 'pinia'
	import { httpsCallable } from 'firebase/functions'
	import { functions } from '@/firebase'
	import { useUserStore } from '@/stores/UserStore'
	import { Mutex } from '@/composables/useLock'

	/* pinia store */
	const userStore = useUserStore()
	const { openInviteCodeModal, waitRoute } = storeToRefs(userStore)

	/* router */
	const router = useRouter()

	/* 模板ref */
	const inviteCodeModalRef = useTemplateRef('inviteCodeModal')
	const inviteCodeInputRef = useTemplateRef('inviteCodeInput')
	const inviteCode = ref('')
	const inviteCodeInvalid = ref('')
	const showValidation = ref(false)
	const inputisInvalid = ref(false)
	const hiddenModalAction = () => {
		openInviteCodeModal.value = false
		showValidation.value = false
	}
	const enterRoom = httpsCallable(functions, 'enterRoom')
	const submitInviteCode = async (event) => {
		inputisInvalid.value = false
		inviteCodeInvalid.value = ''
		if (event.target.checkValidity()) {
			try {
				await enterRoom({ inviteCode: inviteCode.value })
				/* 路由守衛會根據此值，判定是否通往遊戲室 */
				waitRoute.value = inviteCode.value
				const modal = Modal.getOrCreateInstance(inviteCodeModalRef.value)
				modal.hide()
				router.push(`/playroom/${inviteCode.value}`)
			} catch (error) {
				inputisInvalid.value = true
				inviteCodeInvalid.value = error.message
			}
		} else {
			showValidation.value = true
			if (inviteCodeInputRef.value.validity.valueMissing) {
				inviteCodeInvalid.value = '請輸入邀請碼'
			} else if (inviteCodeInputRef.value.validity.patternMismatch) {
				inviteCodeInvalid.value = '邀請碼為英文和數字組成'
			} else if (
				inviteCodeInputRef.value.validity.tooLong ||
				inviteCodeInputRef.value.validity.tooShort
			) {
				inviteCodeInvalid.value = '邀請碼字數為6字'
			}
		}
	}
	let isCancelled = false
	const modalMutex = new Mutex()
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
	onMounted(() => {
		inviteCodeModalRef.value.addEventListener('show.bs.modal', delayModalDispose)
		inviteCodeModalRef.value.addEventListener('hide.bs.modal', delayModalDispose)
		inviteCodeModalRef.value.addEventListener('hidden.bs.modal', hiddenModalAction)
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
		isCancelled = true
		inviteCodeModalRef.value.removeEventListener('show.bs.modal', delayModalDispose)
		inviteCodeModalRef.value.removeEventListener('hide.bs.modal', delayModalDispose)
		inviteCodeModalRef.value.removeEventListener('hidden.bs.modal', hiddenModalAction)
		disposeBsInstance(modalMutex, Modal, inviteCodeModalRef.value)
	})

	watch(openInviteCodeModal, (newValue) => {
		if (newValue && !isCancelled) {
			const modal = Modal.getOrCreateInstance(inviteCodeModalRef.value)
			modal.show()
		}
	})
</script>
