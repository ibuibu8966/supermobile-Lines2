import { createClient } from "@supabase/supabase-js";

// サーバーサイド用（Storage操作 - Service Role Key使用）
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are not set");
  }

  return createClient(supabaseUrl, supabaseKey);
};

// クライアントサイド用（アップロード - Anon Key使用）
export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are not set");
  }

  return createClient(supabaseUrl, supabaseKey);
};

// 署名付きURLを生成（有効期限1時間）
export const getSignedUrl = async (
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> => {
  const supabase = createServerClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }

  return data.signedUrl;
};

// ファイルアップロード（サーバーサイド）
export const uploadFile = async (
  bucket: string,
  path: string,
  file: Buffer | Blob,
  contentType?: string
): Promise<{ path: string } | null> => {
  const supabase = createServerClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error("Error uploading file:", error);
    return null;
  }

  return { path: data.path };
};

// ファイル削除
export const deleteFile = async (
  bucket: string,
  path: string
): Promise<boolean> => {
  const supabase = createServerClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error("Error deleting file:", error);
    return false;
  }

  return true;
};
