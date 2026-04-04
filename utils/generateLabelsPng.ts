import QRCode from 'qrcode';
import { generateQrCodeUrl } from './index';

type Product = {
	unit?: string | null;
	model_type?: string | null;
	serial_number?: string | number | null;
	brand?: string | null;
	manufacture_year?: string | number | Date | null;
	locations?: {
		location_id?: string;
	} | null;
};

function formatManufactureYear(value: Product['manufacture_year']) {
	if (!value) return '-';
	if (value instanceof Date && !isNaN(value.getTime())) {
		return String(value.getFullYear());
	}
	if (typeof value === 'number') {
		return String(value);
	}
	const raw = String(value);
	const date = new Date(raw);
	if (!isNaN(date.getTime())) {
		return String(date.getFullYear());
	}
	return raw.slice(0, 4);
}

function fitTextWithEllipsis(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
) {
	if (ctx.measureText(text).width <= maxWidth) return text;
	const ellipsis = '...';
	let end = text.length;
	while (end > 0) {
		const candidate = `${text.slice(0, end)}${ellipsis}`;
		if (ctx.measureText(candidate).width <= maxWidth) return candidate;
		end -= 1;
	}
	return ellipsis;
}

function loadImage(src: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`Image could not be loaded: ${src}`));
		img.src = src;
	});
}

export async function generateLabelsPng(products: Product[], tenantSlug: string) {
	const MM_TO_PX = 300 / 25.4; // 300 DPI
	// Yazici kafa genisligi sinirina uyum icin etiket uzun kenari feed yonunde kullaniliyor.
	const LABEL_WIDTH_MM = 48.26;
	const LABEL_HEIGHT_MM = 76.2;
	const LABEL_WIDTH_PX = Math.round(LABEL_WIDTH_MM * MM_TO_PX); // 570 px
	const LABEL_HEIGHT_PX = Math.round(LABEL_HEIGHT_MM * MM_TO_PX); // 900 px
	const SAFE_MARGIN_PX = 24;

	let providerLogo: HTMLImageElement | null = null;
	let tupragLogo: HTMLImageElement | null = null;

	try {
		[providerLogo, tupragLogo] = await Promise.all([
			loadImage('/assets/logo/provider-logo.jpeg'),
			loadImage('/assets/logo/tuprag-logo.jpeg'),
		]);
	}
	catch (error) {
		console.warn('Logolar yuklenemedi, etikete logosuz devam edilecek:', error);
	}

	const blobs: string[] = [];

	for (let i = 0; i < products.length; i++) {
		const p = products[i];

		const canvas = document.createElement('canvas');
		canvas.width = LABEL_WIDTH_PX;
		canvas.height = LABEL_HEIGHT_PX;

		const ctx = canvas.getContext('2d');
		if (!ctx) continue;

		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, LABEL_WIDTH_PX, LABEL_HEIGHT_PX);

		const INFO_BLOCK_HEIGHT_PX = 152;
		const logosRowHeightPx = providerLogo && tupragLogo ? 126 : 0;
		const qrMaxWidth = LABEL_WIDTH_PX - SAFE_MARGIN_PX * 2;
		const qrMaxHeight
			= LABEL_HEIGHT_PX
				- SAFE_MARGIN_PX * 4
				- INFO_BLOCK_HEIGHT_PX
				- logosRowHeightPx;
		const qrSizePx = Math.max(1, Math.min(qrMaxWidth, qrMaxHeight));

		const qrData = generateQrCodeUrl(tenantSlug, p.locations?.location_id ?? '-');
		const qr = await QRCode.toDataURL(qrData, {
			type: 'image/png',
			margin: 1,
			errorCorrectionLevel: 'M',
			width: qrSizePx,
		});

		const img = new Image();
		await new Promise<void>((resolve) => {
			img.onload = () => resolve();
			img.src = qr;
		});

		const qrX = Math.round((LABEL_WIDTH_PX - qrSizePx) / 2);
		const qrY = SAFE_MARGIN_PX;
		ctx.drawImage(img, qrX, qrY, qrSizePx, qrSizePx);

		const source = p;
		const modelTip = `${source?.unit ?? ''} ${source?.model_type ?? ''}`.trim() || '-';
		const seriNo = String(source?.serial_number ?? '-');
		const marka = source?.brand ?? '-';
		const uretimYili = formatManufactureYear(source?.manufacture_year);

		const textX = SAFE_MARGIN_PX;
		const textY = qrY + qrSizePx + 16;
		const textMaxWidth = LABEL_WIDTH_PX - SAFE_MARGIN_PX * 2;
		const lineHeight = 36;
		const fontSize = 24;

		ctx.fillStyle = '#000';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		ctx.font = `bold ${fontSize}px Arial`;

		const lines = [
			`Model / Tip: ${modelTip}`,
			`Seri No: ${seriNo}`,
			`Marka: ${marka}`,
			`Üretim Yılı: ${uretimYili}`,
		];

		lines.forEach((line, lineIndex) => {
			const fitted = fitTextWithEllipsis(ctx, line, textMaxWidth);
			ctx.fillText(fitted, textX, textY + lineIndex * lineHeight);
		});

		if (providerLogo && tupragLogo) {
			const logosX = SAFE_MARGIN_PX;
			const logosY = textY + INFO_BLOCK_HEIGHT_PX;
			const logosWidth = LABEL_WIDTH_PX - SAFE_MARGIN_PX * 2;
			const logosHeight = LABEL_HEIGHT_PX - logosY - SAFE_MARGIN_PX;
			const gapPx = 16;
			const singleLogoWidth = Math.floor((logosWidth - gapPx) / 2);

			const drawContain = (
				image: HTMLImageElement,
				x: number,
				y: number,
				boxWidth: number,
				boxHeight: number,
			) => {
				const scale = Math.min(boxWidth / image.width, boxHeight / image.height);
				const drawWidth = Math.round(image.width * scale);
				const drawHeight = Math.round(image.height * scale);
				const drawX = x + Math.round((boxWidth - drawWidth) / 2);
				const drawY = y + Math.round((boxHeight - drawHeight) / 2);
				ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
			};

			drawContain(
				tupragLogo,
				logosX,
				logosY,
				singleLogoWidth,
				logosHeight,
			);
			drawContain(
				providerLogo,
				logosX + singleLogoWidth + gapPx,
				logosY,
				singleLogoWidth,
				logosHeight,
			);

		}

		const blob = await new Promise<Blob>(resolve =>
			canvas.toBlob(b => resolve(b!), 'image/png'),
		);

		blobs.push(URL.createObjectURL(blob));
	}

	return blobs;
}
