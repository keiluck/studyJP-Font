import adminRequest from "../adminRequest";

interface UploadResponse {
  url: string;
}

async function upload(path: string, file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await adminRequest.post<UploadResponse>(path, form);
  return res.url;
}

/** 上传音频（mp3/m4a/wav，≤50MB），返回可访问 URL */
export const uploadAudio = (file: File) => upload("/api/admin/upload/audio", file);

/** 上传图片（jpg/png/webp，≤5MB），返回可访问 URL */
export const uploadImage = (file: File) => upload("/api/admin/upload/image", file);
