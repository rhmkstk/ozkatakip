<script setup lang="ts">
type MenuItem = { name: string; path: string; icon: string };
type MenuGroup = { label: string; items: MenuItem[] };

defineProps<{
	menuGroups: MenuGroup[];
	currentUser: null | {
		first_name: string;
		last_name: string;
		role: string;
		activeTenant?: { name: string } | null;
	};
	initials: string;
	collapsed: boolean;
}>();
defineEmits<{ logout: []; toggle: [] }>();
</script>

<template>
	<div
		class="flex h-full flex-col px-3 pb-4 pt-5"
	>
		<div
			class="relative flex items-center px-2 pb-9"
		>
			<div class="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-blue-600 text-xl text-white shadow-sm shadow-blue-200">
				<i class="ri-shield-check-line" />
			</div>
			<div
				class="ml-3 overflow-hidden whitespace-nowrap transition-[width,opacity] duration-300 ease-in-out"
				:class="collapsed ? 'w-0 opacity-0' : 'w-36 opacity-100'"
			>
				<p class="text-base font-bold leading-tight tracking-[-0.01em] text-slate-950">
					Özka Takip
				</p>
				<p class="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
					Periyodik kontrol
				</p>
			</div>
			<button
				type="button"
				class="absolute left-[196px] top-0 hidden size-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-500 transition-[left,background-color,border-color,color,box-shadow] duration-300 ease-in-out hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 lg:flex"
				:class="collapsed ? '!left-[50px] bg-white shadow-sm' : ''"
				:title="collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'"
				:aria-label="collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'"
				@click="$emit('toggle')"
			>
				<i :class="collapsed ? 'ri-arrow-right-s-line' : 'ri-arrow-left-s-line'" />
			</button>
		</div>

		<nav class="min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden pb-4">
			<section
				v-for="group in menuGroups"
				:key="group.label"
			>
				<p
					class="mb-1.5 h-4 overflow-hidden whitespace-nowrap px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 transition-opacity duration-200"
					:class="collapsed ? 'opacity-0' : 'opacity-100'"
				>
					{{ group.label }}
				</p>
				<ul class="space-y-1">
					<li
						v-for="item in group.items"
						:key="item.name"
					>
						<NuxtLink
							:to="item.path"
							class="group ml-2 grid h-10 w-[232px] grid-cols-[40px_192px] items-center overflow-hidden rounded-lg text-[13px] font-medium text-slate-600 transition-[width,grid-template-columns,background-color,color] duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-950"
							:class="collapsed ? '!w-10 !grid-cols-[40px_0px]' : ''"
							active-class="!bg-blue-50 !font-semibold !text-blue-700"
							:title="collapsed ? item.name : undefined"
						>
							<i
								:class="item.icon"
								class="justify-self-center text-[18px] text-slate-400 transition-[color,transform] group-hover:text-slate-700 group-[.router-link-active]:scale-105 group-[.router-link-active]:text-blue-700"
							/>
							<span
								class="overflow-hidden whitespace-nowrap transition-opacity duration-200"
								:class="collapsed ? 'opacity-0' : 'opacity-100'"
							>{{ item.name }}</span>
						</NuxtLink>
					</li>
				</ul>
			</section>
		</nav>

		<div
			v-if="currentUser"
			class="border-t border-slate-200 pt-4"
		>
			<div
				class="flex items-center rounded-xl bg-slate-50"
				:class="collapsed ? 'flex-col gap-2 p-2' : 'gap-3 p-3'"
			>
				<div class="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
					{{ initials }}
				</div>
				<div
					v-if="!collapsed"
					class="min-w-0 flex-1"
				>
					<p class="truncate text-xs font-semibold text-slate-900">
						{{ currentUser.first_name }} {{ currentUser.last_name }}
					</p>
					<p class="truncate text-[10px] text-slate-500">
						{{ currentUser.activeTenant?.name || (currentUser.role === 'admin' ? 'Yönetici' : 'Çalışan') }}
					</p>
				</div>
				<button
					type="button"
					class="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-transparent text-[22px] text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
					title="Çıkış yap"
					@click="$emit('logout')"
				>
					<i class="ri-logout-box-r-line" />
				</button>
			</div>
		</div>
	</div>
</template>
