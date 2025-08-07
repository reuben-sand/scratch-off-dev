<template>
	<div
		id="user-modal"
		class="home-modal modal"
		tabindex="-1"
		aria-labelledby="user-modal-title"
		aria-hidden="false"
		ref="userModal"
	>
		<div class="modal-dialog modal-sm modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-header">
					<h5 id="user-modal-title" class="modal-title">
						刮刮HOT+會員{{ modalTypeInfo }}
					</h5>
				</div>
				<div class="modal-body">
					<form
						@submit.prevent="clickSubmitBtn"
						:class="{ 'was-validated': showValidation }"
						id="user-form"
						novalidate
					>
						<div class="mb-3">
							<label class="form-label" for="email">電子郵件</label>
							<input
								ref="emailInput"
								v-model="email"
								id="email"
								class="form-control"
								:class="inputisInvalid ? 'is-invalid' : ''"
								type="email"
								required
							/>
							<div class="invalid-feedback text-rule">{{ emailInvalid }}</div>
						</div>
						<div class="mb-3">
							<label class="form-label" for="password">密碼</label>
							<input
								ref="passwordInput"
								v-model="password"
								id="password"
								class="form-control"
								:class="inputisInvalid ? 'is-invalid' : ''"
								type="password"
								minlength="6"
								maxlength="12"
								pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$"
								required
							/>
							<div class="invalid-feedback text-rule">{{ passwordInvalid }}</div>
							<template v-if="userModalType === 'register'">
								<div class="text-rule text-muted">
									密碼長度最少需為6個字元，最多為12個字元，須包含至少1個小寫英文字母、1個大寫英文字母、1個數字。
								</div>
							</template>
						</div>
						<div v-if="userModalType === 'register'" class="mb-3">
							<label class="form-label" for="user-name">使用者名稱</label>
							<input
								ref="userNameInput"
								v-model="userName"
								id="user-name"
								:class="inputisInvalid ? 'is-invalid' : ''"
								class="form-control"
								type="text"
								pattern="^[a-zA-Z0-9][\w\-]*[a-zA-Z0-9]?$"
								maxlength="20"
								required
							/>
							<div class="invalid-feedback text-rule">{{ userNameInvalid }}</div>
							<div class="text-rule text-muted">
								使用者名稱長度須為20個字元內，只能包含英文字母或數字或單一連字符，且不能以連字符開頭或結尾。
							</div>
						</div>
						<button id="submit-btn" class="btn swing-anime-btn w-100" type="submit">
							{{ modalTypeInfo }}
						</button>
					</form>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref, computed, watch, onMounted, useTemplateRef, onBeforeUnmount } from 'vue'
	import { useRouter } from 'vue-router'
	import { storeToRefs } from 'pinia'
	import { Modal } from 'bootstrap'
	import {
		createUserWithEmailAndPassword,
		updateProfile,
		signInWithEmailAndPassword,
	} from 'firebase/auth'
	import { doc, setDoc } from 'firebase/firestore'
	import { auth, firestoreDB } from '@/firebase'
	import { useUserStore } from '@/stores/UserStore'
	import { Mutex } from '@/composables/useLock'

	/* pinia store */
	const userStore = useUserStore()
	const { openUserModal, userNameState, userModalType, waitRoute, openInviteCodeModal } =
		storeToRefs(userStore)

	/* router */
	const router = useRouter()

	/* 模板ref */
	const emailInputRef = useTemplateRef('emailInput')
	const passwordInputRef = useTemplateRef('passwordInput')
	const userNameInputRef = useTemplateRef('userNameInput')
	const userModalRef = useTemplateRef('userModal')

	const emailInvalid = ref('')
	const passwordInvalid = ref('')
	const userNameInvalid = ref('')
	const showValidation = ref(false)
	const inputisInvalid = ref(false)
	const userName = ref('')
	const email = ref('')
	const password = ref('')
	const modalTypeInfo = computed(() => {
		if (userModalType.value === 'login') {
			return '登入'
		} else if (userModalType.value === 'register') {
			return '註冊'
		} else {
			return undefined
		}
	})
	const register = async (event) => {
		showValidation.value = true
		emailInvalid.value = ''
		passwordInvalid.value = ''
		userNameInvalid.value = ''
		if (event.target.checkValidity()) {
			try {
				const credential = await createUserWithEmailAndPassword(
					auth,
					email.value,
					password.value,
				)
				const user = credential.user
				await updateProfile(user, {
					displayName: userName.value,
				})
				userNameState.value = user.displayName
				const modal = Modal.getOrCreateInstance(userModalRef.value)
				modal.hide()
				await setDoc(doc(firestoreDB, 'users', user.uid), {
					displayName: user.displayName,
					email: user.email,
					templates: [],
				})
			} catch (error) {
				showValidation.value = false
				inputisInvalid.value = true
				switch (error.code) {
					case 'auth/email-already-in-use':
						emailInvalid.value = '該信箱已註冊'
						break
					default:
						emailInvalid.value = '註冊錯誤'
						passwordInvalid.value = '註冊錯誤'
						userNameInvalid.value = '註冊錯誤'
				}
			}
		} else {
			if (emailInputRef.value.validity.valueMissing) {
				emailInvalid.value = '電子郵件為必填欄位'
			} else if (emailInputRef.value.validity.typeMismatch) {
				emailInvalid.value = '電子郵件格式錯誤'
			}
			if (passwordInputRef.value.validity.valueMissing) {
				passwordInvalid.value = '密碼為必填欄位'
			} else if (passwordInputRef.value.validity.patternMismatch) {
				passwordInvalid.value = '密碼需包含至少1個數字和1個大寫字母、1個小寫字母'
			} else if (passwordInputRef.value.validity.tooLong) {
				passwordInvalid.value = '密碼超過12個字元'
			} else if (passwordInputRef.value.validity.tooShort) {
				passwordInvalid.value = '密碼小於6個字元'
			}
			if (userNameInputRef.value.validity.valueMissing) {
				userNameInvalid.value = '使用者名稱為必填欄位'
			} else if (userNameInputRef.value.validity.patternMismatch) {
				userNameInvalid.value =
					'使用者名稱只能包含英文字母或數字或單一連字符，且不能以連字符開頭或結尾'
			} else if (userNameInputRef.value.validity.tooLong) {
				passwordInvalid.value = '使用者名稱超過20個字元'
			}
		}
	}
	const login = async () => {
		emailInvalid.value = ''
		passwordInvalid.value = ''
		userNameInvalid.value = ''
		showValidation.value = true
		try {
			await signInWithEmailAndPassword(auth, email.value, password.value)
			const modal = Modal.getOrCreateInstance(userModalRef.value)
			modal.hide()
			if (waitRoute.value === 'playroom') {
				openInviteCodeModal.value = true
			} else if (waitRoute.value !== '') {
				router.push(`/${waitRoute.value}`)
			}
		} catch (error) {
			switch (error.code) {
				case 'auth/invalid-email':
					emailInvalid.value = '電子郵件格式錯誤'
					break
				case 'auth/wrong-password':
					passwordInvalid.value = '密碼錯誤'
					break
				case 'auth/missing-password':
					passwordInvalid.value = '尚未輸入密碼'
					break
				case 'auth/user-not-found':
					emailInvalid.value = '尚未註冊'
					break
				default:
					emailInvalid.value = '登入失敗，請稍後再試'
					passwordInvalid.value = '登入失敗，請稍後再試'
			}
		}
	}
	const clickSubmitBtn = (event) => {
		if (userModalType.value === 'login') {
			login()
		} else if (userModalType.value === 'register') {
			register(event)
		}
	}
	const hiddenModalAction = () => {
		openUserModal.value = false
		showValidation.value = false
		inputisInvalid.value = false
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
		userModalRef.value.addEventListener('show.bs.modal', delayModalDispose)
		userModalRef.value.addEventListener('hide.bs.modal', delayModalDispose)
		userModalRef.value.addEventListener('hidden.bs.modal', hiddenModalAction)
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
		userModalRef.value.removeEventListener('show.bs.modal', delayModalDispose)
		userModalRef.value.removeEventListener('hide.bs.modal', delayModalDispose)
		userModalRef.value.removeEventListener('hidden.bs.modal', hiddenModalAction)
		disposeBsInstance(modalMutex, Modal, userModalRef.value)
	})
	watch(openUserModal, (newValue) => {
		if (newValue && !isCancelled) {
			const modal = Modal.getOrCreateInstance(userModalRef.value)
			modal.show()
		}
	})
</script>
