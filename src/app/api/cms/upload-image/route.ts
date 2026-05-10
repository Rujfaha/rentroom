import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

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
    const dir = join(process.cwd(), "public", "uploads", folder);

    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), buffer);

    const imageUrl = `/uploads/${folder}/${filename}`;

    const supabase = await createClient();
    await (supabase.from("cms_images") as any).insert({
      hotel_id: session.hotelId,
      image_url: imageUrl,
      alt_text: originalName,
    });

    return NextResponse.json({ url: imageUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
