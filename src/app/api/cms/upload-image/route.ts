import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";

const BUCKET_NAME = "cms-uploads";

interface CmsImageInsert {
  hotel_id: string;
  image_url: string;
  alt_text: string | null;
}

interface InsertOnlyTable<TInsert> {
  insert(value: TInsert): Promise<{ error: { message?: string } | null }>;
}

async function downloadExternalImage(imageUrl: string): Promise<{ buffer: Buffer; ext: string }> {
  try {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    // ตรวจสอบ content-type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      throw new Error("URL does not point to an image");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    
    // ดึง extension จาก content-type หรือ URL
    let ext = "jpg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("jpeg")) ext = "jpg";
    else if (contentType.includes("gif")) ext = "gif";
    else if (contentType.includes("webp")) ext = "webp";
    else {
      // พยายามดึงจาก URL path
      const urlPath = new URL(imageUrl).pathname;
      const urlExt = urlPath.split(".").pop();
      if (urlExt && urlExt.length < 6) ext = urlExt;
    }

    return { buffer, ext };
  } catch (error) {
    throw new Error(`Cannot download image from URL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return map[ext] || "image/jpeg";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.hotelId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const externalUrl = formData.get("url") as string | null;
    const folder = (formData.get("folder") as string) || "hero";

    let buffer: Buffer;
    let ext: string;
    let originalName: string;

    if (file && file.size > 0) {
      // Mode: Upload file
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      ext = file.name.split(".").pop() || "jpg";
      originalName = file.name;
    } else if (externalUrl) {
      // Mode: Download from external URL
      const result = await downloadExternalImage(externalUrl);
      buffer = result.buffer;
      ext = result.ext;
      originalName = externalUrl;
    } else {
      return NextResponse.json({ error: "No file or URL provided" }, { status: 400 });
    }

    const filename = `${session.hotelId}_${Date.now()}.${ext}`;
    const storagePath = `${folder}/${filename}`;

    const supabase = await createServiceClient();

    // Ensure bucket exists (idempotent)
    await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
    });

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: getContentType(ext),
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return NextResponse.json({ error: "Unable to upload image" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const imageUrl = urlData.publicUrl;

    // Save to cms_images table
    const { createClient } = await import("@/lib/supabase/server");
    const supabaseServer = await createClient();
    const cmsImagesTable = supabaseServer.from("cms_images") as unknown as InsertOnlyTable<CmsImageInsert>;
    await cmsImagesTable.insert({
      hotel_id: session.hotelId,
      image_url: imageUrl,
      alt_text: originalName,
    });

    return NextResponse.json({ url: imageUrl });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload image" }, { status: 500 });
  }
}
