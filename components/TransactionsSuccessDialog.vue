<script setup lang="ts">
const props = withDefaults(defineProps<{
	title: string;
	visible: boolean;
	description?: string;
}>(), {
	description: 'Kayıt başarıyla sisteme işlendi.',
});

const emit = defineEmits<{ close: [] }>();
const router = useRouter();
const { toTenantPath } = useTenant();
const isVisible = ref(false);
const countDown = ref(5);
let timer: ReturnType<typeof setInterval> | null = null;

const clearCountdown = () => {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
};

const goHome = async () => {
	clearCountdown();
	isVisible.value = false;
	emit('close');
	await router.push(toTenantPath('/mobile'));
};

const startCountdown = () => {
	clearCountdown();
	countDown.value = 5;
	timer = setInterval(() => {
		if (countDown.value > 1) {
			countDown.value -= 1;
		}
		else {
			void goHome();
		}
	}, 1000);
};

watch(() => props.visible, (visible) => {
	isVisible.value = visible;
	if (visible) startCountdown();
	else clearCountdown();
}, { immediate: true });

onUnmounted(clearCountdown);
</script>

<template>
	<Dialog
		v-model:visible="isVisible"
		:show-header="false"
		modal
		:closable="false"
		class="mobile-dialog"
		:style="{ width: 'min(24rem, calc(100vw - 2rem))' }"
	>
		<div class="px-1 pb-1 pt-3 text-center">
			<span class="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-3xl text-emerald-600">
				<i class="ri-check-line" />
			</span>
			<p class="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-600">
				İşlem tamamlandı
			</p>
			<h2 class="mt-1 text-xl font-bold tracking-[-0.02em] text-slate-950">
				{{ title }}
			</h2>
			<p class="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
				{{ description }}
			</p>
			<Button
				label="Kontrol listesine dön"
				icon="ri-arrow-left-line"
				class="mt-6 w-full"
				size="large"
				@click="goHome"
			/>
			<p class="mt-3 text-[11px] text-slate-400">
				{{ countDown }} saniye sonra otomatik olarak dönülecek.
			</p>
		</div>
	</Dialog>
</template>
