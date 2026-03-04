import { customCellFields } from "~/constants";

export { generateLabelsPng } from "./generateLabelsPng";
export { handleUploadImage } from "./handleUploadImage";

export function formatTurkishDate(dateInput?: string | null): string {
  if (!dateInput) {
    return "-"; 
  }

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    console.warn("Invalid date:", dateInput);
    return "-"; 
  }

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTurkishDateTime(dateInput?: string | null): string {
  if (!dateInput) {
    return "-";
  }

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    console.warn("Invalid date:", dateInput);
    return "-";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  // Common, compact TR display: 20.02.2026 23:58
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function formatTurkishMonthYear(dateInput?: string | null): string {
  if (!dateInput) {
    return "-";
  }

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    console.warn("Invalid date:", dateInput);
    return "-";
  }

  return date.toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });
}

export function formatTurkishYear(dateInput?: string | null): string {
  if (!dateInput) {
    return "-";
  }

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    console.warn("Invalid date:", dateInput);
    return "-";
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

export function generateQrCodeUrl(locationId: string) {
  return `${window.location.origin}/inspections/${locationId}`;
}
