import { createClient } from "@/db/supabase/client";

/**
 * Uploads a file to a specified Supabase storage bucket.
 *
 * Bucket pre-reqs (apply once in the Supabase dashboard SQL editor — see
 * the comment block at the bottom of this file for the exact policy SQL):
 *   1. Buckets `builder-logos` and `builder-previews` must exist.
 *   2. INSERT policy on storage.objects allowing the `anon` role to upload
 *      to those bucket_ids.
 *   3. SELECT policy (or `public: true` on the bucket) so getPublicUrl()
 *      returns a fetchable URL.
 *
 * Without (2), the client gets a vague "row-level security" / "timed out"
 * error — the dev-mode toast surfaces the raw Supabase code/message so the
 * cause is obvious during development.
 */
async function uploadToBucket(
  bucketName: string,
  file: File | Blob,
  fileExt: string
): Promise<string> {
  const supabase = createClient();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  if (process.env.NODE_ENV === "development") {
    // TEMP DEBUG: print enough to diagnose timeout / RLS / wrong-bucket.
    // Remove once upload is verified working.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(unset)";
    const urlHost = url.startsWith("http") ? new URL(url).host : url;
    console.log("[builder-storage] uploadToBucket", {
      bucket: bucketName,
      fileName,
      type: file.type,
      size: file.size,
      ext: fileExt,
      projectHost: urlHost,
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    });
  }

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    // Surface the raw error in dev — `error` from supabase-js may carry
    // .message, .name, .statusCode (StorageApiError) depending on what
    // failed (RLS / 404 / network).
    const detail = JSON.stringify(
      {
        name: error.name,
        message: error.message,
        statusCode: (error as { statusCode?: string | number }).statusCode,
      },
      null,
      2
    );
    console.error(`[builder-storage] upload to ${bucketName} failed`, detail);
    if (process.env.NODE_ENV === "development") {
      throw new Error(`Upload failed: ${error.message}`);
    }
    throw new Error("Не вдалося завантажити файл. Спробуйте ще раз.");
  }

  const { data: publicData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  if (process.env.NODE_ENV === "development") {
    console.log("[builder-storage] uploaded:", data.path, "→", publicData.publicUrl);
  }

  return publicData.publicUrl;
}

export async function uploadBuilderLogo(file: File): Promise<string> {
  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error("Дозволені лише формати PNG, JPG або WEBP.");
  }
  
  // Validate size (10 MB max)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Файл занадто великий. Максимальний розмір 10 МБ.");
  }

  const ext = file.name.split('.').pop() || 'png';
  return uploadToBucket("builder-logos", file, ext);
}

export async function uploadBuilderPreview(blob: Blob): Promise<string> {
  return uploadToBucket("builder-previews", blob, "png");
}

/* -----------------------------------------------------------------------
 * Supabase Storage RLS — SQL to run once in the dashboard SQL editor.
 *
 * Buckets:
 *   1. Create buckets `builder-logos` and `builder-previews` (Storage tab).
 *      Toggle `Public bucket` ON for both — that auto-creates a SELECT
 *      policy so getPublicUrl() returns a fetchable URL.
 *
 * INSERT policies (browser uploads use the anon key — without these the
 * client sees "new row violates row-level security policy" or an opaque
 * timeout):
 *
 *   create policy "Public can upload builder logos"
 *   on storage.objects
 *   for insert
 *   to anon, authenticated
 *   with check (bucket_id = 'builder-logos');
 *
 *   create policy "Public can upload builder previews"
 *   on storage.objects
 *   for insert
 *   to anon, authenticated
 *   with check (bucket_id = 'builder-previews');
 *
 * If the buckets are NOT marked public, also add SELECT policies:
 *
 *   create policy "Public can read builder logos"
 *   on storage.objects
 *   for select
 *   to anon, authenticated
 *   using (bucket_id = 'builder-logos');
 *
 *   create policy "Public can read builder previews"
 *   on storage.objects
 *   for select
 *   to anon, authenticated
 *   using (bucket_id = 'builder-previews');
 * --------------------------------------------------------------------- */