<script setup lang="ts">
const supabase = useSupabaseClient();
const route = useRoute();
const { currentUser, loadCurrentUser } = useCurrentAppUser();
const { toTenantPath } = useTenant();
const isMobileHome = computed(() => /\/mobile\/?$/.test(route.path));

onMounted(() => loadCurrentUser());

const logout = async () => {
	await supabase.auth.signOut();
	currentUser.value = null;
	await navigateTo('/login');
};
</script>

<template>
	<div class="min-h-dvh bg-slate-100 text-slate-900">
		<header
			v-if="isMobileHome"
			class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur"
		>
			<div class="mx-auto flex h-15 max-w-screen-sm items-center px-4">
				<NuxtLink
					:to="toTenantPath('/mobile')"
					class="flex min-w-0 items-center gap-2.5"
				>
					<div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-lg text-white"><i class="ri-shield-check-line" /></div>
					<div class="min-w-0">
						<p class="text-sm font-bold leading-tight">Özka Takip</p>
						<p class="truncate text-[10px] text-slate-500">{{ currentUser?.activeTenant?.name || 'Saha uygulaması' }}</p>
					</div>
				</NuxtLink>
				<button
					type="button"
					class="ml-auto flex size-10 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100"
					aria-label="Çıkış yap"
					@click="logout"
				>
					<i class="ri-logout-box-r-line" />
				</button>
			</div>
		</header>

		<div
			class="mx-auto max-w-screen-sm px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
			:class="isMobileHome ? 'pt-5' : 'pt-0'"
		>
			<ClientOnly v-if="isMobileHome">
				<PwaInstallPrompt class="mb-4" />
			</ClientOnly>
			<slot />
		</div>
	</div>
</template>
