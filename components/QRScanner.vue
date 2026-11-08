<script lang="ts" setup>
import { Html5Qrcode } from 'html5-qrcode';
import { normalizeAssetUid } from '~/utils/assetUid';

type Emits = {
	(e: 'close'): void;
	(e: 'scanComplete', scannedNumber: string): void;
};

const emit = defineEmits<Emits>();

let scanner: Html5Qrcode | null = null;
const qrRegionId = 'qr-reader';

const handleQrScan = async () => {
	try {
		scanner = new Html5Qrcode(qrRegionId);
		await scanner.start(
			{ facingMode: 'environment' },
			{
				fps: 10,
				qrbox: 250,
			},
			(decodedText: string) => {
				scanner?.stop().then(() => {
					scanner?.clear();

					const scannedValue = decodedText.trim();
					if (!scannedValue) {
						console.warn('Scanned number is empty or invalid.');
						return;
					}

					try {
						const parsedUrl = new URL(scannedValue, window.location.origin);
						const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
						const assetUid = normalizeAssetUid(
							decodeURIComponent(pathSegments.at(-1) ?? ''),
						);
						if (!assetUid) {
							throw new Error('Geçerli bir tüp QR kodu bulunamadı.');
						}
						emit('scanComplete', assetUid);
					}
					catch (error) {
						console.warn('QR kodu çözümlenemedi:', error);
					}
				});
			},
			(errorMessage) => {
				console.warn(errorMessage);
			},
		);
	}
	catch (err) {
		console.error('Camera access or scanner error:', err);
		emit('close');
	}
};

onMounted(async () => {
	await nextTick(); // ✅ Wait for <div id="qr-reader"> to be rendered
	await handleQrScan();
});

onUnmounted(() => {
	scanner?.stop().then(() => {
		scanner = null;
	});
});
</script>

<template>
	<div class="fixed inset-0 z-[70] flex h-dvh flex-col bg-slate-950 text-white">
		<header class="flex items-center border-b border-white/10 bg-slate-950/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur">
			<button
				type="button"
				class="flex size-10 items-center justify-center rounded-lg text-xl active:bg-white/10"
				aria-label="Tarayıcıyı kapat"
				@click="$emit('close')"
			>
				<i class="ri-close-line" />
			</button>
			<div class="ml-3">
				<p class="text-sm font-bold">
					QR kodu tara
				</p>
				<p class="text-[11px] text-slate-400">
					Kodu çerçevenin içine hizalayın
				</p>
			</div>
		</header>
		<div class="flex flex-1 flex-col items-center justify-center p-4">
			<div
				id="qr-reader"
				class="w-full max-w-md overflow-hidden rounded-xl bg-black"
			/>
			<p class="mt-5 max-w-xs text-center text-xs leading-5 text-slate-400">
				Kamera izni istendiğinde onaylayın. Kod algılandığında ekran otomatik kapanır.
			</p>
		</div>
	</div>
</template>
