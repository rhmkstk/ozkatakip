import { customCellFields, fieldMap } from '~/constants';
import type { Database } from '~/types/database.types';

interface ExcelRow {
	[key: string]: string | number;
}

const dateFields = ['manufacture_year', 'refill_date', 'next_refill_date', 'hydrostatic_test_date', 'next_hydrostatic_test_date'];

export function mapExcelData(excelData: ExcelRow[]) {
	return excelData.map(row => replaceKeys(fieldMap, row));
}

function replaceKeys(obj1: ExcelRow, obj2: ExcelRow) {
	const keys = Object.keys(obj1);
	const values = Object.values(obj2);
	return keys.reduce((acc, key, index) => {
		acc[key as keyof typeof acc] = parseValues(key, values[index]);
		return acc;
	}, {} as Record<string, string | number>);
}

function excelSerialToDate(serial: number) {
	const excelEpoch = new Date(1899, 11, 30); // Excel starts from 1900-01-01, but there's an off-by-one issue
	const date = new Date(excelEpoch.getTime() + serial * 86400000);
	return date.toISOString().split('T')[0];
}

function parseValues(key: string, value: string | number): string | number {
	if (dateFields.includes(key) && typeof value === 'number')
		return excelSerialToDate(value);
	if (typeof value === 'string')
		return value.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim();
	return value;
}
export function isCellCustom(cell: string): boolean {
	return customCellFields.includes(cell);
}

export function addYearToDate(date: Date, year: number): Date {
	const newDate = new Date(date);
	newDate.setFullYear(newDate.getFullYear() + year);
	return newDate;
}

export function getTransactionDetails(type: Database['public']['Enums']['transaction_types']): string {
	switch (type) {
		case 'bakım':
			return 'Purchase';
		default:
			return 'Unknown';
	}
}
