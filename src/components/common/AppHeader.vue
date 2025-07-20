<template>
	<header ref="header" class="fixed-top">
		<nav class="navbar navbar-expand mt-2 py-0">
			<div class="container-fluid">
				<RouterLink to="/" class="navbar-brand p-2 m-0 lh-1 rounded-2">
					<img
						id="navbar-logo"
						src="@/assets/logo.svg"
						role="presentation"
						alt="刮刮Hot+logo"
					/>
				</RouterLink>
				<div v-if="!isLoggedIn" class="d-flex">
					<a
						@click="clickLoginBtn"
						id="login-btn"
						class="border-anime-btn btn pt-1 pb-0 rounded-0 position-relative"
						href="#user-modal"
						data-bs-toggle="modal"
						role="button"
						>登入</a
					>
					<a
						@click="clickRegisterBtn"
						id="register-btn"
						class="border-anime-btn btn pt-1 pb-0 position-relative"
						href="#user-modal"
						data-bs-toggle="modal"
						role="button"
						>註冊</a
					>
				</div>
				<div v-else-if="isLoggedIn" class="d-flex align-items-center">
					<a
						:data-bs-toggle="noOffcanvas ? null : 'offcanvas'"
						:href="noOffcanvas ? null : '#templates-offcanvas'"
						id="user-btn"
						class="border-anime-btn btn pt-1 pb-0 rounded-0 position-relative"
						role="button"
						>{{ userName }}</a
					>
					<a
						@click="clickSignoutBtn"
						id="signout-btn"
						class="border-anime-btn btn pt-1 pb-0 position-relative"
						role="button"
						>登出</a
					>
				</div>
			</div>
		</nav>
	</header>
</template>

<script setup>
	import { computed, useTemplateRef } from 'vue'
	import { RouterLink, useRouter } from 'vue-router'
	import { storeToRefs } from 'pinia'
	import { signOut } from 'firebase/auth'
	import { auth } from '@/firebase'
	import { useUserStore } from '@/stores/UserStore'

	/* pinia store */
	const userStore = useUserStore()
	const { isLoggedIn, userNameState, userModalType } = storeToRefs(userStore)

	/* router */
	const router = useRouter()

	/* props */
	const { noOffcanvas } = defineProps({
		noOffcanvas: Boolean,
	})

	/* 模板ref */
	const headerRef = useTemplateRef('header')

	/* expose */
	defineExpose({ headerRef })

	const userName = computed(() => {
		return userNameState.value ? userNameState.value : ''
	})
	const clickLoginBtn = () => {
		userModalType.value = 'login'
	}
	const clickRegisterBtn = () => {
		userModalType.value = 'register'
	}
	const clickSignoutBtn = () => {
		signOut(auth)
		router.push('/')
	}
</script>
