import type { HousekeepingStatus, RoomStatus } from "@/types/database.types";

export interface CmsRoomTypeOption {
  id: string;
  name: string;
}

export interface CmsPhysicalRoom {
  id: string;
  room_type_id: string;
  room_number: string;
  floor?: string | null;
  status: RoomStatus;
  housekeeping: HousekeepingStatus;
  notes?: string | null;
  is_active?: boolean | null;
}
