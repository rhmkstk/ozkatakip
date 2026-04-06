<template>
	<div class="min-h-dvh bg-slate-100 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)]">
		<ClientOnly>
			<PwaInstallPrompt class="mb-4" />
		</ClientOnly>
		<div class="mx-auto max-w-screen-sm">
			<slot />
		</div>
	</div>
</template>
