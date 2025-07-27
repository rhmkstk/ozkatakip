import { customCellFields } from '~/constants';

export function isCellCustom(cell: string): boolean {
	return customCellFields.includes(cell);
}

export function addYearToDate(date: Date, year: number): Date {
	const newDate = new Date(date);
	newDate.setFullYear(newDate.getFullYear() + year);
	return newDate;
}
