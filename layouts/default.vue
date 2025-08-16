<script setup lang="ts">

import { userDetails } from '~/constants';

// No additional setup needed
const supabase = useSupabaseClient();
const currentUserDetails=ref<typeof userDetails[0] | null>(null);
const logout = async () => {
	const { error } = await supabase.auth.signOut();
	if (error) {
		console.error('Logout error:', error.message);
	}
	else {
		await navigateTo('/login');
	}
};
onMounted(async () => {
	const { data } = await supabase.auth.getUser();
	const id = data?.user?.id;
	currentUserDetails.value = userDetails.find(user => user.id === id) || null
	console.log('User details:', currentUserDetails.value);
});

const menuItems = [
	{ name: 'Bakım kayıtları', path: '/', icon: 'ri-booklet-line' },
	{ name: 'Dolum kayıtları', path: '/fill-records', icon: 'ri-book-open-line' },
	{ name: 'İşlem geçmişi', path: '/history', icon: 'ri-history-fill' },
	{ name: 'Planlama', path: '/planning', icon: 'ri-calendar-todo-line' },
	{ name: 'YSC genel liste', path: '/products', icon: 'ri-fire-line' },
	// { name: 'Kullanıcılar', path: '/users', icon: 'ri-group-line' },
	{ name: 'YSC Veri girişi', path: '/insert-data', icon: 'ri-booklet-line' },
	{ name: 'Mobil', path: '/mobile', icon: 'ri-cellphone-line' },
];

const supportItems = [
	{ name: 'Yardım', path: '/help' },
	{ name: 'İletişim', path: '/contact' },
	{ name: 'Çıkış yap', path: '/logout', action: logout },
];

const sidebarExpanded = ref(true);
// const toggleSidebar = () => {
// 	sidebarExpanded.value = !sidebarExpanded.value;
// };
</script>

<template>
	<div class="flex w-full max-w-full h-screen bg-slate-100">
		<div
			v-show="sidebarExpanded"
			class="sidebar py-14 px-12 text-gray-950 flex flex-col"
		>
			<div class="border-b pb-6 border-slate-300 flex justify-between">
				<div v-if="currentUserDetails" class="flex items-center space-x-3">
					<span class="size-11 bg-blue-400 rounded-full shrink-0" />
					<div>
						<span class="text-[10px] text-gray-500">{{ currentUserDetails.role ==="admin" ? 'YÖNETİCİ': 'KULLANICI' }}</span>
						<p class="font-bold  text-sm">
							{{ currentUserDetails.name }} {{ currentUserDetails.surname }}
						</p>
					</div>
				</div>
			</div>

			<!-- <div class="user">
        <img
          :src="profileImg"
          alt="profile image"
          class="size-14 rounded-xl object-cover"
        />
        <p class="text-2xl mt-5 mb-0.5">Samantha</p>
        <p class="text-gray-400">samantha@email.com</p>
      </div> -->
			<nav class="mt-8">
				<ul class=" text-gray-950">
					<li
						v-for="item in menuItems"
						:key="item.name"
					>
						<NuxtLink
							:to="item.path"
							class="flex items-center px-2 py-2 space-x-1.5 border rounded-lg border-slate-100"
							active-class="!text-blue-500 !border-blue-500 rounded-lg shadow-sm"
						>
							<i
								:class="item.icon"
								class="text-lg"
							/>
							<span>{{ item.name }}</span>
						</NuxtLink>
					</li>
				</ul>
			</nav>
			<nav class="mt-auto">
				<ul class="space-y-4">
					<li
						v-for="item in supportItems"
						:key="item.name"
						@click="item.action ? item.action() : null"
					>
						<NuxtLink
							:to="item.path"
							class="flex items-center gap-2"
						>
							{{ item.name }}
						</NuxtLink>
					</li>
				</ul>
			</nav>
		</div>
		<div class="content flex-1 h-full p-2.5 overflow-x-auto">
			<div class="py-6 w-full relative z-50 px-4 md:px-6 h-full max-h-full min-h-full overflow-y-auto border border-slate-300 rounded-xl bg-white">
				<!-- <button
					class="absolute top-6 -left-4 z-[99] flex size-8 rounded-full border border-slate-300 bg-white shadow-md"
					@click="toggleSidebar"
				>
					<i class="ri-arrow-left-s-line text-2xl text-blue-500 m-auto" />
				</button> -->
				<slot />
			</div>
		</div>
	</div>
</template>
