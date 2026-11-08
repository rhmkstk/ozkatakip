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
	<div class="flex flex-col h-full absolute inset-0 size-full z-50 bg-slate-800">
		<header class="flex items-center py-4 px-3 bg-slate-900 text-white">
			<button
				class="flex"
				@click="$emit('close')"
			>
				<i class="ri-arrow-left-line text-xl" />
			</button>
			<p class="font-semibold mx-auto">
				Karekod okut
			</p>
		</header>
		<div
			id="qr-reader"
			style="width: 100%; max-width: 500px; margin: auto"
		/>
	</div>
</template>
