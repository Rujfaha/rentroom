"use client";

import { useState, useTransition } from "react";
import { updateContact, deleteContact } from "@/app/actions/cms";
import { Plus, Save, Trash2, Edit2, Phone, Mail, MapPin, Globe, Camera, MessageCircle } from "lucide-react";
import type { ContactType } from "@/types/database.types";

export interface CmsContactRow {
  id: string;
  contact_type: ContactType;
  label: string | null;
  value: string;
  icon_url?: string | null;
  sort_order?: number | null;
  is_visible: boolean;
}

export function ContactEditor({ initialContacts }: { initialContacts: CmsContactRow[] }) {
  const contacts = initialContacts;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      await updateContact(formData);
      setEditingId(null);
      // Let Server Action revalidate and refresh the page, or we could mutate local state
      window.location.reload(); 
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?")) return;
    startTransition(async () => {
      await deleteContact(id);
      window.location.reload();
    });
  };

  const handleAddNew = () => {
    setEditingId("new");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "phone": return <Phone className="w-4 h-4 text-[#8b7355]" />;
      case "email": return <Mail className="w-4 h-4 text-[#8b7355]" />;
      case "map_url": return <MapPin className="w-4 h-4 text-[#8b7355]" />;
      case "facebook": return <Globe className="w-4 h-4 text-[#8b7355]" />;
      case "instagram": return <Camera className="w-4 h-4 text-[#8b7355]" />;
      case "line": return <MessageCircle className="w-4 h-4 text-[#8b7355]" />;
      default: return <Phone className="w-4 h-4 text-[#8b7355]" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Contact List */}
      <div className="space-y-3">
        {contacts.map((contact) => (
          <div key={contact.id} className="border border-[#e8e2d6] rounded-lg p-3 hover:border-[#1a3c2a]/20 transition-colors bg-white">
            {editingId === contact.id ? (
              <form onSubmit={handleSave} className="space-y-3">
                <input type="hidden" name="id" value={contact.id} />
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#8b7355] mb-1">ประเภท</label>
                    <select name="type" defaultValue={contact.contact_type} className="w-full px-2 py-1.5 text-sm border border-[#e8e2d6] rounded outline-none focus:border-[#1a3c2a] bg-white text-[#2c2c2c]">
                      <option value="phone">เบอร์โทร</option>
                      <option value="line">LINE</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="email">Email</option>
                      <option value="map_url">Google Maps URL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8b7355] mb-1">ป้ายกำกับ (Label)</label>
                    <input type="text" name="label" defaultValue={contact.label || ""} placeholder="เช่น โทรจอง, LINE OA" className="w-full px-2 py-1.5 text-sm border border-[#e8e2d6] rounded outline-none focus:border-[#1a3c2a] text-[#2c2c2c]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8b7355] mb-1">ข้อมูล (Value)</label>
                  <input type="text" name="value" defaultValue={contact.value} placeholder="08x-xxx-xxxx หรือ URL" required className="w-full px-2 py-1.5 text-sm border border-[#e8e2d6] rounded outline-none focus:border-[#1a3c2a] text-[#2c2c2c]" />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" name="isVisible" id={`visible-${contact.id}`} value="true" defaultChecked={contact.is_visible} className="rounded text-[#1a3c2a] focus:ring-[#1a3c2a]" />
                  <label htmlFor={`visible-${contact.id}`} className="text-sm text-[#8b7355]">แสดงผลบนเว็บไซต์</label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#e8e2d6]/50">
                  <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-[#8b7355] hover:bg-[#faf7f0] rounded-md transition-colors cursor-pointer">
                    ยกเลิก
                  </button>
                  <button type="submit" disabled={isPending} className="px-3 py-1.5 text-sm bg-[#1a3c2a] hover:bg-[#0f2418] text-[#faf7f0] rounded-md transition-colors flex items-center gap-1 cursor-pointer">
                    <Save className="w-3.5 h-3.5" /> บันทึก
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#faf7f0] flex items-center justify-center border border-[#e8e2d6]">
                    {getIcon(contact.contact_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#1a3c2a]">{contact.label || contact.contact_type}</p>
                      {!contact.is_visible && <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#faf7f0] text-[#8b7355] font-medium">ซ่อน</span>}
                    </div>
                    <p className="text-xs text-[#8b7355] truncate max-w-[200px]">{contact.value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditingId(contact.id)} className="p-1.5 text-[#c4b9a8] hover:text-[#1a3c2a] hover:bg-[#faf7f0] rounded transition-colors cursor-pointer" title="แก้ไข">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(contact.id)} className="p-1.5 text-[#c4b9a8] hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" title="ลบ">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {contacts.length === 0 && editingId !== "new" && (
          <div className="text-center py-6 text-sm text-[#8b7355] bg-[#faf7f0] rounded-lg border border-dashed border-[#e8e2d6]">
            ยังไม่มีข้อมูลติดต่อ
          </div>
        )}
      </div>

      {/* New Form */}
      {editingId === "new" ? (
        <div className="border border-[#1a3c2a]/10 rounded-lg p-4 bg-[#faf7f0]">
          <h3 className="text-sm font-medium text-[#1a3c2a] mb-3">เพิ่มข้อมูลติดต่อใหม่</h3>
          <form onSubmit={handleSave} className="space-y-3">
            <input type="hidden" name="id" value="new" />
            <input type="hidden" name="isVisible" value="true" />
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#2c2c2c] mb-1">ประเภท</label>
                <select name="type" className="w-full px-2 py-1.5 text-sm border border-[#e8e2d6] rounded outline-none focus:border-[#1a3c2a] bg-white text-[#2c2c2c]">
                  <option value="phone">เบอร์โทร</option>
                  <option value="line">LINE</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="email">Email</option>
                  <option value="map_url">Google Maps URL</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#2c2c2c] mb-1">ป้ายกำกับ (Label)</label>
                <input type="text" name="label" placeholder="เช่น โทรจอง, LINE OA" className="w-full px-2 py-1.5 text-sm border border-[#e8e2d6] rounded outline-none focus:border-[#1a3c2a] bg-white text-[#2c2c2c]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2c2c2c] mb-1">ข้อมูล (Value)</label>
              <input type="text" name="value" placeholder="08x-xxx-xxxx หรือ URL" required className="w-full px-2 py-1.5 text-sm border border-[#e8e2d6] rounded outline-none focus:border-[#1a3c2a] bg-white text-[#2c2c2c]" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-[#8b7355] hover:bg-[#faf7f0] rounded-md transition-colors cursor-pointer">
                ยกเลิก
              </button>
              <button type="submit" disabled={isPending} className="px-3 py-1.5 text-sm bg-[#1a3c2a] hover:bg-[#0f2418] text-[#faf7f0] rounded-md transition-colors flex items-center gap-1 cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> เพิ่ม
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button 
          onClick={handleAddNew}
          className="w-full py-2.5 border-2 border-dashed border-[#e8e2d6] rounded-lg text-sm text-[#8b7355] hover:text-[#1a3c2a] hover:border-[#1a3c2a]/30 hover:bg-[#faf7f0] transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> เพิ่มข้อมูลติดต่อ
        </button>
      )}
    </div>
  );
}
