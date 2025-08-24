import { customCellFields, userDetails } from "~/constants";
import { useSupabaseClient } from "#imports";

export function isCellCustom(cell: string): boolean {
  return customCellFields.includes(cell);
}

export function addYearToDate(date: Date, year: number): Date {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + year);
  return newDate;
}

export async function handleUploadImage(
  compressedImage: File
): Promise<string> {
  const { data } = await useSupabaseClient().auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("User is not authenticated");
  }
  const formData = new FormData();
  formData.append("file", compressedImage);
  const uploadImageResponse = await fetch("/api/upload/inspection-photo", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const result = await uploadImageResponse.json();

  console.log("Upload result:", result);
  return result?.filePath || "";
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