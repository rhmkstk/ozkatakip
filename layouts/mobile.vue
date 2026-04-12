<script setup lang="ts">
const { isOnline } = useMobileOfflineState();
</script>

<template>
	<div class="min-h-dvh bg-slate-100 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)]">
		<ClientOnly>
			<PwaInstallPrompt class="mb-4" />
		</ClientOnly>
		<div class="mx-auto max-w-screen-sm">
			<div v-if="!isOnline" class="mb-3 flex justify-start">
				<span class="rounded-full bg-slate-300 px-3 py-1 text-xs font-medium text-slate-700">
					Offline Mod
				</span>
			</div>
			<slot />
		</div>
	</div>
</template>
