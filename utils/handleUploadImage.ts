import { useSupabaseClient } from "#imports";

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

  return result?.filePath || "";
}
