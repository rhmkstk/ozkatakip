<script setup lang="ts">
withDefaults(defineProps<{
	modelValue?: string;
	placeholder?: string;
}>(), {
	modelValue: '',
	placeholder: 'Ara',
});

defineEmits<{
	'update:modelValue': [value: string];
	'clear': [];
}>();
</script>

<template>
	<div class="relative h-9 w-60">
		<i class="ri-search-line pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-base text-slate-400" />
		<InputText
			:model-value="modelValue"
			:placeholder="placeholder"
			class="!h-9 !min-h-9 w-full !pl-9 !pr-9 !text-[13px]"
			@update:model-value="$emit('update:modelValue', $event)"
		/>
		<button
			v-if="modelValue"
			type="button"
			class="absolute right-2 top-1/2 z-10 flex size-5 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
			aria-label="Aramayı temizle"
			@click="$emit('clear')"
		>
			<i class="ri-close-line" />
		</button>
	</div>
</template>
