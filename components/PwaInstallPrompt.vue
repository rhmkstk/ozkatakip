<script setup lang="ts">
const DISMISS_KEY = 'pwa-install-prompt-dismissed';

const { $pwa } = useNuxtApp();

const dismissed = ref(false);
const isStandalone = ref(false);
const isIos = ref(false);

const showAndroidPrompt = computed(() => (
	!dismissed.value
	&& !isStandalone.value
	&& !$pwa?.isPWAInstalled?.value
	&& !!$pwa?.showInstallPrompt?.value
));

const showIosPrompt = computed(() => (
	!dismissed.value
	&& !isStandalone.value
	&& !$pwa?.isPWAInstalled?.value
	&& !showAndroidPrompt.value
	&& isIos.value
));

const showPrompt = computed(() => showAndroidPrompt.value || showIosPrompt.value);
const showUpdatePrompt = computed(() => !!$pwa?.needRefresh?.value);

const dismiss = () => {
	dismissed.value = true;
	localStorage.setItem(DISMISS_KEY, '1');
	$pwa?.cancelInstall?.();
};

const install = async () => {
	await $pwa?.install?.();
};

const refreshApp = async () => {
	await $pwa?.updateServiceWorker?.(true);
};

onMounted(() => {
	const userAgent = window.navigator.userAgent;

	isStandalone.value = window.matchMedia('(display-mode: standalone)').matches
		|| (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
	isIos.value = /iphone|ipad|ipod/i.test(userAgent);
	dismissed.value = localStorage.getItem(DISMISS_KEY) === '1';
});
</script>

<template>
	<div
		v-if="showPrompt || showUpdatePrompt"
		class="space-y-3"
	>
		<section
			v-if="showPrompt"
			class="rounded-2xl border border-blue-200 bg-white px-4 py-3 shadow-sm"
		>
			<div class="flex items-start gap-3">
				<div class="flex-1">
					<p class="text-sm font-semibold text-slate-900">
						Uygulamayi yukle
					</p>
					<p
						v-if="showAndroidPrompt"
						class="mt-1 text-sm leading-6 text-slate-600"
					>
						ozkatakip'i bu cihazda uygulama gibi acmak icin yukleyebilirsin.
					</p>
					<p
						v-else
						class="mt-1 text-sm leading-6 text-slate-600"
					>
						iPhone veya iPad'de tarayici menusundeki Paylas seciminden Ana Ekrana Ekle adimini kullan.
					</p>
				</div>
				<Button
					text
					severity="secondary"
					label="Kapat"
					size="small"
					@click="dismiss"
				/>
			</div>

			<div class="mt-3 flex flex-wrap gap-2">
				<Button
					v-if="showAndroidPrompt"
					label="Yukle"
					size="small"
					@click="install"
				/>
				<Button
					v-else
					label="Anladim"
					size="small"
					@click="dismiss"
				/>
			</div>
		</section>

		<section
			v-if="showUpdatePrompt"
			class="rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm"
		>
			<div class="flex items-start gap-3">
				<div class="flex-1">
					<p class="text-sm font-semibold text-slate-900">
						Yeni surum hazir
					</p>
					<p class="mt-1 text-sm leading-6 text-slate-600">
						Guncel surume gecmek icin uygulamayi yenile.
					</p>
				</div>
				<Button
					label="Yenile"
					size="small"
					@click="refreshApp"
				/>
			</div>
		</section>
	</div>
</template>
