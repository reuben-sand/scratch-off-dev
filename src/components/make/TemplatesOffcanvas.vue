<template>
	<div
		id="templates-offcanvas"
		class="offcanvas offcanvas-end border-0"
		tabindex="-1"
		data-bs-scroll="true"
		data-bs-backdrop="false"
	>
		<div class="offcanvas-header justify-content-between position-relative">
			<h4 class="offcanvas-title h5">個人資訊</h4>
			<button
				type="button"
				class="btn offcanvas-btn"
				data-bs-dismiss="offcanvas"
				aria-label="close"
			>
				<i class="bi bi-arrow-bar-right fs-5"></i>
			</button>
		</div>
		<div class="offcanvas-body">
			<div class="d-flex align-items-center justify-content-between pb-2">
				<h5 class="h6 m-0">你的模板</h5>
				<button @click="clickDeleteBtn" type="button" class="btn btn-sm offcanvas-btn">
					<i class="bi bi-trash3-fill"></i>
				</button>
			</div>

			<ul class="list-group list-group-flush">
				<li
					v-for="userTemplate in userTemplatesList"
					class="list-group-item"
					:key="userTemplate.id"
				>
					<input
						class="form-check-input mt-0 me-3"
						type="checkbox"
						:value="userTemplate.id"
						v-model="selectedTemplate"
					/>
					<div class="template-bg bg-white d-inline-block text-center">
						<TemplateThumbnail :canvas-template="userTemplate" />
					</div>
				</li>
			</ul>
		</div>
	</div>
</template>

<script setup>
	import { ref } from 'vue'
	import { storeToRefs } from 'pinia'
	import { auth, firestoreDB } from '@/firebase'
	import { updateDoc, doc } from 'firebase/firestore'
	import TemplateThumbnail from '@/components/common/TemplateThumbnail.vue'
	import { useUserStore } from '@/stores/UserStore'

	/* pinia store */
	const userStore = useUserStore()
	const { userTemplatesList } = storeToRefs(userStore)

	const selectedTemplate = ref([])
	const clickDeleteBtn = async () => {
		const selectedSet = new Set(selectedTemplate.value)
		userTemplatesList.value = userTemplatesList.value.filter(
			(item) => !selectedSet.has(item.id),
		)
		const user = auth.currentUser
		const docRef = doc(firestoreDB, 'users', user.uid)
		await updateDoc(docRef, {
			templates: userTemplatesList.value,
		})
	}
</script>
