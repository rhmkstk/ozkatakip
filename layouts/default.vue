<script setup lang="ts">
const supabase = useSupabaseClient();
const route = useRoute();
const { currentUser, loadCurrentUser } = useCurrentAppUser();
const { loadUserDirectory } = useUserDirectory();
const { toTenantPath } = useTenant();
const mobileMenuOpen = ref(false);
const sidebarCollapsed = ref(false);

const toggleSidebar = () => {
	sidebarCollapsed.value = !sidebarCollapsed.value;
	localStorage.setItem('dashboard-sidebar-collapsed', String(sidebarCollapsed.value));
};

const logout = async () => {
	const { error } = await supabase.auth.signOut();
	if (error) {
		console.error('Logout error:', error.message);
		return;
	}
	currentUser.value = null;
	await navigateTo('/login');
};

onMounted(async () => {
	sidebarCollapsed.value = localStorage.getItem('dashboard-sidebar-collapsed') === 'true';
	await Promise.all([loadCurrentUser(true), loadUserDirectory(true)]);
});

watch(() => route.fullPath, () => {
	mobileMenuOpen.value = false;
});

const allMenuGroups = [
	{ label: 'Kayıtlar', items: [
		{ name: 'Bakım kayıtları', path: '/', icon: 'ri-shield-check-line' },
		{ name: 'Dolum kayıtları', path: '/fill-records', icon: 'ri-archive-drawer-line' },
		{ name: 'İşlem geçmişi', path: '/history', icon: 'ri-history-line' },
	] },
	{ label: 'Yönetim', items: [
		{ name: 'Planlama', path: '/planning', icon: 'ri-calendar-check-line' },
		{ name: 'YSC envanteri', path: '/products', icon: 'ri-fire-line' },
		{ name: 'Veri girişi', path: '/insert-data', icon: 'ri-add-box-line' },
		{ name: 'Kullanıcılar', path: '/users', icon: 'ri-group-line', adminOnly: true },
	] },
	{ label: 'Saha', items: [
		{ name: 'Mobil uygulama', path: '/mobile', icon: 'ri-qr-scan-2-line' },
	] },
];

const menuGroups = computed(() => allMenuGroups.map(group => ({
	...group,
	items: group.items
		.filter(item => !item.adminOnly || currentUser.value?.role === 'admin')
		.map(item => ({ ...item, path: toTenantPath(item.path) })),
})));

const initials = computed(() => {
	const first = currentUser.value?.first_name?.[0] ?? '';
	const last = currentUser.value?.last_name?.[0] ?? '';
	return `${first}${last}`.toLocaleUpperCase('tr-TR') || 'OT';
});
</script>

<template>
	<div class="min-h-dvh bg-[#f3f5f7] text-slate-800">
		<header class="sticky top-0 z-40 flex h-16 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
			<button
				type="button"
				class="mr-3 inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 text-xl text-slate-700"
				aria-label="Menüyü aç"
				@click="mobileMenuOpen = true"
			>
				<i class="ri-menu-line" />
			</button>
			<div class="flex items-center gap-2.5">
				<div class="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-lg text-white">
					<i class="ri-shield-check-line" />
				</div>
				<div>
					<p class="text-sm font-bold leading-tight text-slate-900">
						Özka Takip
					</p>
					<p class="text-[10px] font-medium uppercase tracking-wider text-slate-500">
						Periyodik kontrol
					</p>
				</div>
			</div>
		</header>

		<div
			v-if="mobileMenuOpen"
			class="fixed inset-0 z-50 lg:hidden"
		>
			<button
				class="absolute inset-0 bg-slate-950/35"
				aria-label="Menüyü kapat"
				@click="mobileMenuOpen = false"
			/>
			<aside class="relative h-full w-[min(86vw,300px)] bg-white shadow-2xl">
				<button
					class="absolute right-3 top-3 flex size-9 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100"
					aria-label="Menüyü kapat"
					@click="mobileMenuOpen = false"
				>
					<i class="ri-close-line" />
				</button>
				<AppSidebarContent
					:menu-groups="menuGroups"
					:current-user="currentUser"
					:initials="initials"
					:collapsed="false"
					@logout="logout"
				/>
			</aside>
		</div>

		<aside
			class="fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-[width] duration-300 ease-in-out lg:block"
			:class="sidebarCollapsed ? 'w-[80px]' : 'w-[272px]'"
		>
			<AppSidebarContent
				:menu-groups="menuGroups"
				:current-user="currentUser"
				:initials="initials"
				:collapsed="sidebarCollapsed"
				@logout="logout"
				@toggle="toggleSidebar"
			/>
		</aside>

		<main
			class="min-w-0 transition-[padding] duration-300 ease-in-out"
			:class="sidebarCollapsed ? 'lg:pl-[80px]' : 'lg:pl-[272px]'"
		>
			<div class="mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:min-h-dvh lg:px-8 lg:py-7">
				<slot />
			</div>
		</main>
	</div>
</template>
