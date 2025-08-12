import { customCellFields } from "~/constants";
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
  return result?.signedUrl || "";
}
