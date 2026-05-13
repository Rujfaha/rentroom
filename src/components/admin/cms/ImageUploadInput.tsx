"use client";

import { useState, useRef } from "react";
import { Link, Upload, X } from "lucide-react";

interface ImageUploadInputProps {
  folder: string;
  onUploadSuccess: (url: string) => void;
  onUploadMultipleSuccess?: (urls: string[]) => void;
  defaultUrl?: string | null;
  multiple?: boolean;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function ImageUploadInput({ folder, onUploadSuccess, onUploadMultipleSuccess, defaultUrl = "", multiple = false }: ImageUploadInputProps) {
  const safeDefaultUrl = safeString(defaultUrl);
  const [tab, setTab] = useState<"url" | "upload">("url");
  const [tempUrl, setTempUrl] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>(safeDefaultUrl);
  const [preview, setPreview] = useState<string>(safeDefaultUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const localPreview = URL.createObjectURL(files[0]);
    setPreview(localPreview);
    setUploadError("");
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);

        const res = await fetch("/api/cms/upload-image", { method: "POST", body: fd });
        const result = await res.json();

        if (result.error) {
          throw new Error(result.error || "อัปโหลดไม่สำเร็จ");
        }

        if (result.url) {
          uploadedUrls.push(safeString(result.url));
        }
      }

      setUploading(false);

      if (uploadedUrls.length > 0) {
        setImageUrl(safeString(uploadedUrls[0]));
        setPreview(safeString(uploadedUrls[0]));
        if (multiple && onUploadMultipleSuccess) {
          onUploadMultipleSuccess(uploadedUrls);
        } else {
          onUploadSuccess(uploadedUrls[0]);
        }
      }
    } catch (error) {
      setUploading(false);
      setUploadError(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ");
      setPreview(safeString(imageUrl));
    }
  };

  const handleFetchExternalUrl = async () => {
    const nextTempUrl = safeString(tempUrl);
    if (!nextTempUrl.trim()) {
      setUploadError("กรุณาใส่ URL");
      return;
    }

    setUploadError("");
    setUploading(true);
    setPreview(nextTempUrl);

    const fd = new FormData();
    fd.append("url", nextTempUrl);
    fd.append("folder", folder);

    try {
      const res = await fetch("/api/cms/upload-image", { method: "POST", body: fd });
      const result = await res.json();
      setUploading(false);

      if (result.error) {
        setUploadError(result.error || "ไม่สามารถดาวน์โหลดรูปภาพจาก URL นี้ได้");
        setPreview(safeString(imageUrl));
      } else if (result.url) {
        const nextUrl = safeString(result.url);
        setImageUrl(nextUrl);
        setPreview(nextUrl);
        onUploadSuccess(nextUrl);
      }
    } catch {
      setUploading(false);
      setUploadError("ไม่สามารถดาวน์โหลดรูปภาพจาก URL นี้ได้");
      setPreview(safeString(imageUrl));
    }
  };

  const handleClear = () => {
    setImageUrl("");
    setPreview("");
    setTempUrl("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name="image_url" value={safeString(imageUrl)} />

      <label className="block text-xs font-medium text-[#8b7355] mb-1">รูปภาพ</label>

      {/* Tab toggle */}
      <div className="flex gap-1 p-1 bg-[#f0ece4] rounded-lg">
        <button
          type="button"
          onClick={() => setTab("url")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
            tab === "url" ? "bg-white text-[#1a3c2a] shadow-sm" : "text-[#8b7355] hover:text-[#1a3c2a]"
          }`}
        >
          <Link className="w-3.5 h-3.5" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
            tab === "upload" ? "bg-white text-[#1a3c2a] shadow-sm" : "text-[#8b7355] hover:text-[#1a3c2a]"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          อัปโหลดไฟล์
        </button>
      </div>

      {tab === "url" ? (
        <div className="space-y-2">
          <input
            type="text"
            value={safeString(tempUrl)}
            onChange={(e) => setTempUrl(safeString(e.currentTarget.value))}
            disabled={uploading}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm disabled:opacity-60"
            placeholder="https://example.com/image.jpg"
          />
          <button
            type="button"
            onClick={handleFetchExternalUrl}
            disabled={uploading || !safeString(tempUrl).trim()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#1a3c2a] text-[#faf7f0] rounded-md text-sm font-medium hover:bg-[#0f2418] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#faf7f0]/30 border-t-[#faf7f0] rounded-full animate-spin" />
                กำลังดาวน์โหลด...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                บันทึก URL
              </>
            )}
          </button>
          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
        </div>
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-[#e8e2d6] rounded-md text-sm text-[#8b7355] hover:border-[#1a3c2a]/30 hover:text-[#1a3c2a] hover:bg-[#faf7f0] transition-colors cursor-pointer disabled:opacity-60"
          >
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#1a3c2a]/30 border-t-[#1a3c2a] rounded-full animate-spin" />
                กำลังอัปโหลด...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {multiple ? "เลือกไฟล์รูปภาพหลายรูป" : "เลือกไฟล์รูปภาพ"}
              </>
            )}
          </button>
          {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="relative mt-2 rounded-lg overflow-hidden border border-[#e8e2d6] h-28">
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
