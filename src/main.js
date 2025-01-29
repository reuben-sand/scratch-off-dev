import { createApp } from 'vue'
import { createPinia, storeToRefs } from 'pinia'

import App from './App.vue'
import router from './router'

import { auth } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'

import { useUserStore } from '@/stores/UserStore'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
onAuthStateChanged(auth, async (user) => {
	const userStore = useUserStore()
	const { isLoggedIn } = storeToRefs(userStore)
	if (user) {
		isLoggedIn.value = true
	} else {
		isLoggedIn.value = false
	}

	if (!app._mounted) {
		app.use(router)
		app.mount('#app')
		app._mounted = true
	}
})
