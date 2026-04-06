<template>
	<div>
		<NuxtPwaManifest />
		<NuxtLoadingIndicator
			color="#0ea5e9"
			:height="3"
		/>
		<NuxtLayout>
			<Toast />
			<NuxtPage />
		</NuxtLayout>
	</div>
</template>

<style>
.page-enter-active,
.page-leave-active {
	transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from,
.page-leave-to {
	opacity: 0;
	transform: translateY(6px);
}
</style>
