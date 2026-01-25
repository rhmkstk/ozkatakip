import { customCellFields, userDetails } from "~/constants";

export { generateLabelsPng } from "./generateLabelsPng";
export { handleUploadImage } from "./handleUploadImage";

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

export function getUserDetail(userId: string) {
  const user = userDetails.find((user) => user.id === userId);
  return user || null;
}
export function getUserName(userId: string) {
  const user = getUserDetail(userId) || null;
  return user ? `${user.name} ${user.surname}` : userId;
}

export function generateQrCodeUrl(locationId: string) {
  return `${window.location.origin}/inspections/${locationId}`;
}
