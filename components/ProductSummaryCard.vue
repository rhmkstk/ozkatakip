<script setup lang="ts">
type Props = {
	data: {
		key: string;
		value: string | number | Date;
	}[];
	header?: string;
};

const { header = 'Ürün özet' } = defineProps<Props>();
</script>

<template>
	<Card
		:header="header"
		:title="header"
	>
		<template #content>
			<ul
				class="space-y-2 list-disc list-inside"
			>
				<li
					v-for="item in data"
					:key="item.key"
					class="flex space-x-1"
				>
					<p class="font-semibold">
						{{ item.key }}:
					</p>
					<p class=" truncate">
						{{ item.value }}
					</p>
				</li>
			</ul>
		</template>
	</Card>
</template>
