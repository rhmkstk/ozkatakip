import { customCellFields } from '~/constants';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateInput(dateInput?: string | Date | null): Date | null {
	if (!dateInput) {
		return null;
	}

	if (dateInput instanceof Date) {
		return Number.isNaN(dateInput.getTime()) ? null : new Date(dateInput);
	}

	if (DATE_ONLY_PATTERN.test(dateInput)) {
		const [year, month, day] = dateInput.split('-').map(Number);
		return new Date(year, month - 1, day);
	}

	const date = new Date(dateInput);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function parseStoredDate(dateInput?: string | Date | null): Date | null {
	return parseDateInput(dateInput);
}

export function formatDateOnlyForApi(
	dateInput?: string | Date | null,
): string | null {
	if (!dateInput) {
		return null;
	}

	if (typeof dateInput === 'string' && DATE_ONLY_PATTERN.test(dateInput)) {
		return dateInput;
	}

	const date = parseDateInput(dateInput);
	if (!date) {
		return null;
	}

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function formatTurkishDate(dateInput?: string | null): string {
	if (!dateInput) {
		return '-';
	}

	const date = parseDateInput(dateInput);

	if (!date) {
		console.warn('Invalid date:', dateInput);
		return '-';
	}

	return date.toLocaleDateString('tr-TR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
}

export function formatTurkishDateTime(dateInput?: string | null): string {
	if (!dateInput) {
		return '-';
	}

	const date = parseDateInput(dateInput);

	if (!date) {
		console.warn('Invalid date:', dateInput);
		return '-';
	}

	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = String(date.getFullYear());
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');

	// Common, compact TR display: 20.02.2026 23:58
	return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function formatTurkishMonthYear(dateInput?: string | null): string {
	if (!dateInput) {
		return '-';
	}

	const date = parseDateInput(dateInput);

	if (!date) {
		console.warn('Invalid date:', dateInput);
		return '-';
	}

	return date.toLocaleDateString('tr-TR', {
		month: 'long',
		year: 'numeric',
	});
}

export function formatTurkishYear(dateInput?: string | null): string {
	if (!dateInput) {
		return '-';
	}

	const date = parseDateInput(dateInput);

	if (!date) {
		console.warn('Invalid date:', dateInput);
		return '-';
	}

	return String(date.getFullYear());
}

export function isCellCustom(cell: string): boolean {
	return customCellFields.includes(cell);
}

export function addYearToDate(date: Date, year: number): Date {
	const newDate = new Date(date);
	newDate.setFullYear(newDate.getFullYear() + year);
	return newDate;
}

export function getValueByPath(obj, path) {
	return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export function generateQrCodeUrl(tenantSlug: string, locationId: string) {
	return `${window.location.origin}/${tenantSlug}/inspections/${locationId}`;
}
