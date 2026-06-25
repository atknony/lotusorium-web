import { signUpload } from "@/lib/api/admin";

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
}

/**
 * Signed direct browser->Cloudinary upload. Gets short-lived signed params from
 * our BFF (`/admin/media/sign`, which throws 503 until the API's CLOUDINARY_*
 * env vars are set), then POSTs the file straight to Cloudinary so large files
 * never touch our server. Pass `folder` to namespace the asset (defaults to the
 * API's `lotusorium/products`).
 */
export async function uploadToCloudinary(
  file: File,
  folder?: string,
): Promise<CloudinaryUploadResult> {
  const sig = await signUpload(folder);
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  if (!res.ok) throw new Error("Cloudinary yüklemesi başarısız oldu");
  return res.json() as Promise<CloudinaryUploadResult>;
}
