<script setup lang="ts">
// import type { Database } from '~/types/database.types';

// const statusBadgeClasses: Record<Database['public']['Enums']['product_status'], string> = {
// 	aktif: 'bg-green-600',
// 	arızalı: 'bg-red-600',
// 	kayıp: 'bg-gray-600',
// 	yedek: 'bg-yellow-600',
// };
</script>

<template>
	<div class="bg-slate-100 p-2 rounded-lg space-x-3 mb-4 flex">
		<img
			src="https://www.capitalsolutions.pk/wp-content/uploads/2021/06/DCP6Kg-ABC-2.jpg"
			alt="fire-estinguisher"
			class="object-cover max-w-full w-1/3 h-[200px] rounded"
		>
		<div class="pt-2 px-2 flex-1 flex flex-col">
			<h4 class="text-sm font-semibold leading-3">
				12 KG
			</h4>
			<h3 class="text-lg font-semibold truncate">
				Karbondioksit gazli
			</h3>

			<div class="flex items-center space-x-1">
				<span class="size-1.5 rounded-full bg-green-600" />
				<span class="text-xs text-slate-500">AKTİF</span>
			</div>
			<div class="flex space-x-1 mt-4">
				<i class="ri-map-pin-line -mt-0.5" />
				<span class="text-sm">MOBİL EKİPMAN BAKIM	, YEDEK , YEDEK225452</span>
			</div>
			<div class="flex space-x-1 mt-2">
				<i class="ri-calendar-line -mt-0.5" />
				<p class="text-sm text-gray-700">
					Dolum tarihi: <b>2027-07-05</b>, Hidrastatik test tarihi: <b>2027-07-05</b>
				</p>
			</div>
		</div>
	</div>
</template>
