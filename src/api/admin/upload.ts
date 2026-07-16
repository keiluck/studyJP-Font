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

/** 音声をアップロードする（mp3/m4a/wav、50MB以下）。アクセス可能な URL を返す */
export const uploadAudio = (file: File) => upload("/api/admin/upload/audio", file);

/** 画像をアップロードする（jpg/png/webp、5MB以下）。アクセス可能な URL を返す */
export const uploadImage = (file: File) => upload("/api/admin/upload/image", file);
