import { createRouter, createWebHistory } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/UserStore'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			name: 'home',
			component: () => import('@/views/HomeView.vue'),
			meta: {
				title: '刮刮HOT+首頁',
				description: '製作刮刮樂，遊玩刮刮樂',
			},
		},

		{
			path: '/make',
			name: 'make',
			component: () => import('@/views/MakeView.vue'),
			meta: {
				title: '刮刮HOT+製作刮刮樂',
				description: '製作刮刮樂',
			},
		},
		{
			path: '/playroom/:roomId',
			name: 'playroom',
			component: () => import('@/views/PlayroomView.vue'),
			meta: {
				title: '刮刮HOT+遊玩刮刮樂',
				description: '遊玩刮刮樂',
			},
		},
	],
})
router.beforeEach((to) => {
	document.title = to.meta.title || '刮刮HOT+'
	const descriptionMeta = document.querySelector('meta[name="description"]')
	if (descriptionMeta) {
		descriptionMeta.setAttribute('content', to.meta.description || '製作刮刮樂，遊玩刮刮樂')
	}
})
router.beforeEach((to) => {
	const userStore = useUserStore()
	const { isLoggedIn, openUserModal, waitRoute, userModalType } = storeToRefs(userStore)
	if (to.name === 'make' && !isLoggedIn.value) {
		openUserModal.value = true
		/* waitRoute.value決定讓modal完成後的操作，要跳轉的頁面 */
		waitRoute.value = 'make'
		userModalType.value = 'login'
		return { name: 'home' }
	}
})
router.beforeEach((to) => {
	const userStore = useUserStore()
	const { waitRoute } = storeToRefs(userStore)
	if (to.name === 'playroom') {
		if (waitRoute.value !== to.params.roomId) {
			return { name: 'home' }
		}
	} else {
		waitRoute.value = ''
	}
})
export default router
