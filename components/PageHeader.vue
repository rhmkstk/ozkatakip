<script lang="ts" setup>
type Props = {
	title?: string;
};
const props = defineProps<Props>();
</script>

<template>
	<div class="flex items-center space-x-4 mb-6 p-6 -m-6 shadow-sm">
		<slot />
		<h2
			v-if="props.title"
			class="text-gray-500"
		>
			{{ props.title }}
		</h2>
		<div class="ml-auto flex items-center space-x-2 shrink-0">
			<slot name="right"/>
		</div>
	</div>
</template>
