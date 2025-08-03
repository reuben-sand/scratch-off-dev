<template>
	<AppHeader ref="appHeader" :no-offcanvas="true" />
	<main id="game-content" class="w-100 mx-auto d-flex flex-column text-center" :style="mainStyle">
		<h2
			class="ms-2 h6 page-subtitle mb-3 align-self-start"
			:class="deviceRatioChange ? null : 'mt-5'"
		>
			{{ subtitle }}
		</h2>
		<h1 class="h3 page-title mb-3">
			{{ title }}
		</h1>
		<div id="game-body" class="rounded">
			<form
				@submit.prevent
				v-if="isRoomFull && !lotteryCompleted"
				id="play-form"
				class="mt-3"
			>
				<div class="row mb-3 justify-content-center justify-content-lg-start">
					<label
						for="chance-of-winning"
						class="col-lg-3 col-12 col-form-label text-center fs-6"
						>設置中獎機率：</label
					>
					<div class="col-lg-3 col-6">
						<select
							v-model="selectedWinningRate"
							:ref="setObserver"
							:disabled="!isRoomOwner"
							@change="changeWinningRate"
							id="chance-of-winning"
							class="form-select"
						>
							<option v-for="n in 10" :key="n" :value="n">{{ n * 10 + '%' }}</option>
						</select>
					</div>
				</div>
				<fieldset class="row mb-3 align-items-center">
					<legend class="fs-6 col-lg-3 col-12 mb-3">選擇中獎樣式：</legend>
					<div class="col-lg-9 col-12 text-start">
						<div class="overflow-auto" style="white-space: nowrap">
							<div
								v-for="(roomerTemplate, index) in roomerTemplatesList"
								:key="roomerTemplate.id"
								class="ms-1 form-check form-check-inline mb-2"
							>
								<input
									:ref="setObserver"
									:disabled="!isRoomOwner"
									v-model="selectedWinningTemplate"
									@change="changeWinningTemplate"
									:id="`winning-template-${index}`"
									type="radio"
									class="form-check-input"
									name="winningTemplateRadios"
									:value="index"
								/>
								<label
									:for="`winning-template-${index}`"
									class="form-check-label template-bg bg-white rounded-2"
								>
									<TemplateThumbnail :canvas-template="roomerTemplate" />
								</label>
							</div>
						</div>
					</div>
				</fieldset>
				<fieldset class="row align-items-center">
					<legend class="fs-6 col-lg-3 col-12 mb-3">選擇槓龜樣式：</legend>
					<div class="col-lg-9 col-12 text-start mb-3">
						<div class="overflow-auto" style="white-space: nowrap">
							<div
								v-for="(roomerTemplate, index) in roomerTemplatesList"
								:key="roomerTemplate.id"
								class="ms-1 form-check form-check-inline mb-2"
							>
								<input
									:ref="setObserver"
									:disabled="!isRoomOwner"
									v-model="selectedLosingTemplate"
									@change="changeLosingTemplate"
									:id="`losing-template-${index}`"
									type="radio"
									class="form-check-input"
									name="losingTemplateRadios"
									:value="index"
								/>
								<label
									for="`losing-template-${index}`"
									class="form-check-label template-bg bg-white rounded-2"
								>
									<TemplateThumbnail :canvas-template="roomerTemplate" />
								</label>
							</div>
						</div>
					</div>
				</fieldset>
				<div class="row justify-content-center mb-3">
					<button
						@click="openLoadingGameModal"
						:ref="setObserver"
						class="btn col-2"
						type="submit"
						:disabled="!isRoomOwner"
					>
						完成設定
					</button>
				</div>
			</form>
			<div
				v-else-if="lotteryCompleted"
				id="canvas-group"
				class="mx-auto d-grid align-items-center bg-white rounded mt-3 mb-3"
			>
				<ScratchOff :scratch-off-template="scratchOffTemplate" :game-result="gameResult" />
			</div>
		</div>
	</main>
	<WaitGameModal
		@delay-dispose="delayModalDispose"
		ref="waitGameModal"
		:is-room-full="isRoomFull"
		:is-room-Owner="isRoomOwner"
		:set-completed="setCompleted"
	/>
</template>

<script setup>
	import {
		ref,
		computed,
		useTemplateRef,
		onMounted,
		onUnmounted,
		watch,
		onBeforeUnmount,
	} from 'vue'
	import { storeToRefs } from 'pinia'
	import { useRoute, useRouter } from 'vue-router'
	import { auth, realtimeDB, functions } from '@/firebase'
	import { onValue, ref as realtimeRef, update, remove, onDisconnect } from 'firebase/database'
	import { httpsCallable } from 'firebase/functions'
	import AppHeader from '@/components/common/AppHeader.vue'
	import TemplateThumbnail from '@/components/common/TemplateThumbnail.vue'
	import WaitGameModal from '@/components/playroom/WaitGameModal.vue'
	import ScratchOff from '@/components/playroom/ScratchOff.vue'
	import { debounce } from '@/composables/useRateLimit'
	import { useUserStore } from '@/stores/UserStore'
	import { useWindowStore } from '@/stores/WindowStore'
	import { Mutex } from '@/composables/useLock'

	/* router */
	const route = useRoute()
	const router = useRouter()
	const roomId = route.params.roomId

	/* pinia store */
	const userStore = useUserStore()
	const { isRoomOwner } = storeToRefs(userStore)
	const windowStore = useWindowStore()
	const { deviceRatioChange } = storeToRefs(windowStore)
	const { updateDeviceRatio } = windowStore

	/* props */
	/* eslint-disable no-unused-vars */
	const { canvasTemplate } = defineProps({
		canvasTemplate: [null, Object],
	})
	/* eslint-enable no-unused-vars */

	/* 模板ref */
	const appHeaderRef = useTemplateRef('appHeader')
	const waitGameModalRef = useTemplateRef('waitGameModal')

	const isRoomFull = ref(false)
	const lotteryCompleted = ref(false)
	const title = computed(() => {
		if (isRoomFull.value) {
			if (isRoomOwner.value && !lotteryCompleted.value) {
				return '設置刮刮樂遊戲'
			} else if (isRoomOwner.value && lotteryCompleted.value) {
				return '等待玩家遊戲'
			} else if (lotteryCompleted.value) {
				return '刮刮你的刮刮樂'
			} else {
				return '等待房主設置'
			}
		} else {
			return '遊戲開始前\n請邀請朋友加入遊戲'
		}
	})
	const subtitle = computed(() => {
		if (isRoomFull.value) {
			return '遊戲進行中'
		} else {
			return `房間邀請碼：${route.params.roomId}`
		}
	})
	const headerHeight = ref(null)
	const mainHeight = ref(null)
	const mainStyle = computed(() => ({
		'margin-top': headerHeight.value ? headerHeight.value + 'px' : null,
		height: mainHeight.value ? mainHeight.value + 'px' : null,
	}))
	const updateMainHeight = () => {
		const headerRect = appHeaderRef.value.headerRef.getBoundingClientRect()
		headerHeight.value = headerRect.height
		mainHeight.value = document.documentElement.clientHeight - headerRect.height
	}
	const debounceResizeAction = debounce(() => {
		updateDeviceRatio()
		updateMainHeight()
	}, 300)

	const roomerTemplatesList = ref([])
	const getRoomerTemplatesList = httpsCallable(functions, 'getRoomerTemplatesList')

	const selectedWinningTemplate = ref(0)
	const selectedLosingTemplate = ref(0)
	const selectedWinningRate = ref(1)
	const changeWinningTemplate = () => {
		if (isRoomOwner.value) {
			const roomRef = realtimeRef(realtimeDB, 'rooms/' + roomId)
			update(roomRef, {
				winningTemplate: selectedWinningTemplate.value,
			})
		}
	}
	const changeLosingTemplate = () => {
		if (isRoomOwner.value) {
			const roomRef = realtimeRef(realtimeDB, 'rooms/' + roomId)
			update(roomRef, {
				losingTemplate: selectedLosingTemplate.value,
			})
		}
	}
	const changeWinningRate = () => {
		if (isRoomOwner.value) {
			const roomRef = realtimeRef(realtimeDB, 'rooms/' + roomId)
			update(roomRef, {
				winningRate: selectedWinningRate.value,
			})
		}
	}
	const makeLotteryResult = httpsCallable(functions, 'makeLotteryResult')
	const setCompleted = ref(false)
	const gameResult = ref(false)
	const openScratchOff = (lotteryResult) => {
		if (lotteryResult) {
			scratchOffTemplate.value = roomerTemplatesList.value[selectedWinningTemplate.value]
			gameResult.value = true
		} else {
			scratchOffTemplate.value = roomerTemplatesList.value[selectedLosingTemplate.value]
		}
	}
	let timeoutId = null
	const delay = (ms) => {
		return new Promise((resolve) => {
			timeoutId = setTimeout(() => {
				timeoutId = null
				resolve()
			}, ms)
		})
	}
	let isCancelled = false
	const openLoadingGameModal = async () => {
		if (isRoomOwner.value) {
			const roomRef = realtimeRef(realtimeDB, 'rooms/' + roomId)
			await update(roomRef, {
				setCompleted: true,
			})
			if (isCancelled) return
			waitGameModalRef.value.getOrCreateModal().show()
			setCompleted.value = true
			const lotteryResult = await makeLotteryResult({})
			openScratchOff(lotteryResult.data.lotteryResult)
			/* 我只是想要展示一下動畫，所以加上個延遲 */
			await delay(1000)
			if (isCancelled) return
			if (waitGameModalRef.value.getModal()) {
				waitGameModalRef.value.getModal().hide()
			}
			lotteryCompleted.value = true
		}
	}
	const scratchOffTemplate = ref({})

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
	const disposeModal = async () => {
		isCancelled = true
		if (waitGameModalRef.value.getModal()) {
			const bsInstance = waitGameModalRef.value.getModal()
			await modalMutex.acquire()
			try {
				bsInstance.dispose()
			} finally {
				modalMutex.release()
			}
		}
	}
	const observer = new MutationObserver((mutationsList) => {
		for (const mutation of mutationsList) {
			if (mutation.attributeName === 'disabled' && mutation.target.disabled === false) {
				mutation.target.disabled = true
			}
		}
	})
	const setObserver = (el) => {
		if (el) {
			observer.observe(el, {
				attributes: true,
			})
		}
	}
	const allUnsubscribes = []
	onMounted(async () => {
		const headerRect = appHeaderRef.value.headerRef.getBoundingClientRect()
		headerHeight.value = headerRect.height
		mainHeight.value = document.documentElement.clientHeight - headerRect.height
		window.addEventListener('resize', debounceResizeAction)

		const fullRef = realtimeRef(realtimeDB, 'rooms/' + roomId + '/full')
		const unsubscribeFull = onValue(fullRef, (snapshot) => {
			const data = snapshot.val()
			if (data) {
				isRoomFull.value = true
				/* 房間滿了，第二個玩家進來，才寫入需要同步的資料 */
				if (isRoomOwner.value) {
					const roomRef = realtimeRef(realtimeDB, 'rooms/' + roomId)
					update(roomRef, {
						losingTemplate: selectedLosingTemplate.value,
						winningTemplate: selectedWinningTemplate.value,
						winningRate: selectedWinningRate.value,
					})
				}
			} else {
				/*  當其中一個玩家離開時，full的節點會刪除，所以動作會觸發，導致回到首頁 */
				isRoomFull.value = false
			}
		})
		allUnsubscribes.push(unsubscribeFull)
		if (!isRoomOwner.value) {
			const winningTemplateRef = realtimeRef(
				realtimeDB,
				'rooms/' + roomId + '/winningTemplate',
			)
			const unsubscribeWinningTemplate = onValue(winningTemplateRef, (snapshot) => {
				const data = snapshot.val()
				if (data) {
					selectedWinningTemplate.value = data
				}
			})
			allUnsubscribes.push(unsubscribeWinningTemplate)
			const losingTemplateRef = realtimeRef(realtimeDB, 'rooms/' + roomId + '/losingTemplate')
			const unsubscribeLosingTemplate = onValue(losingTemplateRef, (snapshot) => {
				const data = snapshot.val()
				if (data) {
					selectedLosingTemplate.value = data
				}
			})
			allUnsubscribes.push(unsubscribeLosingTemplate)
			const winningRateRef = realtimeRef(realtimeDB, 'rooms/' + roomId + '/winningRate')
			const unsubscribeWinningRate = onValue(winningRateRef, (snapshot) => {
				const data = snapshot.val()
				if (data) {
					selectedWinningRate.value = data
				}
			})
			allUnsubscribes.push(unsubscribeWinningRate)
			const setCompletedRef = realtimeRef(realtimeDB, 'rooms/' + roomId + '/setCompleted')
			const unsubscribeSetCompleted = onValue(setCompletedRef, (snapshot) => {
				const data = snapshot.val()
				if (data === true && !isCancelled) {
					waitGameModalRef.value.getOrCreateModal().show()
				}
			})
			allUnsubscribes.push(unsubscribeSetCompleted)
			const lotteryResultRef = realtimeRef(realtimeDB, `rooms/${roomId}/lotteryResult`)
			const unsubscribeLotteryResult = onValue(lotteryResultRef, async (snapshot) => {
				if (snapshot.exists()) {
					/* 我只是想要展示一下動畫，所以加上個延遲 */
					await delay(1000)
					openScratchOff(snapshot.val())
					if (isCancelled) return
					if (waitGameModalRef.value.getModal()) {
						if (isCancelled) return
						waitGameModalRef.value.getModal().hide()
						lotteryCompleted.value = true
					}
				}
			})
			allUnsubscribes.push(unsubscribeLotteryResult)
		}
		getRoomerTemplatesList().then((result) => {
			roomerTemplatesList.value = result.data
		})
		/* 斷線或是離開該view刪除自己擁有房間的資訊，在cloud function會監控該刪除的動作，連帶刪除所有房間相關資料 */
		const userRoomsUidRef = realtimeRef(realtimeDB, 'userRooms/' + auth.currentUser.uid)
		onDisconnect(userRoomsUidRef).remove()
	})
	onBeforeUnmount(() => {
		disposeModal()
		if (timeoutId !== null) {
			clearTimeout(timeoutId)
			timeoutId = null
		}
	})
	onUnmounted(() => {
		window.removeEventListener('resize', debounceResizeAction)
		allUnsubscribes.forEach((unsubscribe) => {
			unsubscribe()
		})
		const userRoomsUidRef = realtimeRef(realtimeDB, 'userRooms/' + auth.currentUser.uid)
		/* 斷線或是離開該view刪除自己擁有房間的資訊，在cloud function會監控該刪除的動作，連帶刪除所有房間相關資料 */
		onDisconnect(userRoomsUidRef).cancel()
		remove(userRoomsUidRef)
		isRoomOwner.value = false
	})
	watch(isRoomFull, (newValue) => {
		if (!newValue) {
			router.push('/')
		}
	})
</script>
