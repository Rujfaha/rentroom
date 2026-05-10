"use client";

import { useState, useRef } from "react";
import { Link, Upload, X } from "lucide-react";

interface ImageUploadInputProps {
  folder: string;
  onUploadSuccess: (url: string) => void;
  defaultUrl?: string;
}

export function ImageUploadInput({ folder, onUploadSuccess, defaultUrl = "" }: ImageUploadInputProps) {
  const safeDefaultUrl = defaultUrl ?? "";
  const [tab, setTab] = useState<"url" | "upload">("url");
  const [tempUrl, setTempUrl] = useState("");
  const [imageUrl, setImageUrl] = useState(safeDefaultUrl);
  const [preview, setPreview] = useState(safeDefaultUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploadError("");
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);

    try {
      const res = await fetch("/api/cms/upload-image", { method: "POST", body: fd });
      const result = await res.json();
      setUploading(false);

      if (result.error) {
      setUploadError(result.error || "Upload failed");
        setPreview(imageUrl);
      } else if (result.url) {
        setImageUrl(result.url);
        setPreview(result.url);
        onUploadSuccess(result.url);
      }
    } catch {
      setUploading(false);
      setUploadError("Upload failed");
      setPreview(imageUrl);
    }
  };

  const handleFetchExternalUrl = async () => {
    if (!tempUrl.trim()) {
      setUploadError("กรุณาใส่ URL");
      return;
    }

    setUploadError("");
    setUploading(true);
    setPreview(tempUrl);

    const fd = new FormData();
    fd.append("url", tempUrl);
    fd.append("folder", folder);

    try {
      const res = await fetch("/api/cms/upload-image", { method: "POST", body: fd });
      const result = await res.json();
      setUploading(false);

      if (result.error) {
        setUploadError(result.error || "ไม่สามารถดาวน์โหลดรูปภาพจาก URL นี้ได้");
        setPreview(imageUrl);
      } else if (result.url) {
        setImageUrl(result.url);
        setPreview(result.url);
        onUploadSuccess(result.url);
      }
    } catch {
      setUploading(false);
      setUploadError("ไม่สามารถดาวน์โหลดรูปภาพจาก URL นี้ได้");
      setPreview(imageUrl);
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
      <input type="hidden" name="image_url" value={imageUrl ?? ""} />

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
            value={tempUrl ?? ""}
            onChange={(e) => setTempUrl(e.target.value)}
            disabled={uploading}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm disabled:opacity-60"
            placeholder="https://example.com/image.jpg"
          />
          <button
            type="button"
            onClick={handleFetchExternalUrl}
            disabled={uploading || !tempUrl.trim()}
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
                เลือกไฟล์รูปภาพ
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
