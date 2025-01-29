import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { doc, getDoc } from 'firebase/firestore'
import { auth, firestoreDB } from '@/firebase'

export const useUserStore = defineStore('user', () => {
	const isLoggedIn = ref(null)
	const openUserModal = ref(false)
	const waitRoute = ref('')
	const openInviteCodeModal = ref(false)

	const userNameState = ref(null)
	const userModalType = ref('login')
	const createdUserDoc = ref(false)
	const userTemplatesList = ref([])
	const templateQuantity = ref(0)
	const updateUserTemplates = (item) => {
		userTemplatesList.value.push(item)
	}
	const isRoomOwner = ref(false)
	watch(isLoggedIn, async (newValue) => {
		if (newValue) {
			const user = auth.currentUser
			userNameState.value = user.displayName
			const docRef = doc(firestoreDB, 'users', user.uid)
			let docSnap = await getDoc(docRef)
			let tries = 0
			while (!docSnap.exists() && tries <= 10) {
				await new Promise((resolve) => setTimeout(resolve, 1000))
				docSnap = await getDoc(docRef)
				tries++
			}
			userTemplatesList.value = docSnap.data().templates
		} else {
			userNameState.value = null
			userTemplatesList.value = []
		}
	})

	return {
		isLoggedIn,
		openUserModal,
		waitRoute,
		openInviteCodeModal,
		userNameState,
		userModalType,
		createdUserDoc,
		userTemplatesList,
		templateQuantity,
		isRoomOwner,
		updateUserTemplates,
	}
})
