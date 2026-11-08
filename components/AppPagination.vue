<script setup lang="ts">
const props = withDefaults(defineProps<{
	total?: number;
	itemLabel?: string;
}>(), {
	total: 0,
	itemLabel: 'kayıt',
});

const activePage = ref(1);
const pageCount = computed(() => Math.max(1, Math.min(5, Math.ceil(props.total / 10))));
const shownEnd = computed(() => Math.min(10, props.total));
</script>

<template>
	<footer
		class="app-pagination"
		aria-label="Sayfalama"
	>
		<p class="text-xs text-slate-500">
			<span class="font-semibold text-slate-700">{{ total }}</span>
			{{ itemLabel }} içinden
			<span
				v-if="total"
				class="font-medium text-slate-700"
			>1–{{ shownEnd }}</span>
			<span v-else>0</span>
			gösteriliyor
		</p>

		<div class="flex items-center gap-1">
			<button
				type="button"
				class="app-pagination-button"
				:disabled="activePage === 1"
				aria-label="Önceki sayfa"
				@click="activePage = Math.max(1, activePage - 1)"
			>
				<i class="ri-arrow-left-s-line" />
			</button>
			<button
				v-for="page in pageCount"
				:key="page"
				type="button"
				class="app-pagination-button"
				:class="{ 'app-pagination-button-active': activePage === page }"
				:aria-current="activePage === page ? 'page' : undefined"
				@click="activePage = page"
			>
				{{ page }}
			</button>
			<button
				type="button"
				class="app-pagination-button"
				:disabled="activePage === pageCount"
				aria-label="Sonraki sayfa"
				@click="activePage = Math.min(pageCount, activePage + 1)"
			>
				<i class="ri-arrow-right-s-line" />
			</button>
		</div>
	</footer>
</template>
