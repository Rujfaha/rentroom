# Requirements Document

## Introduction

ระบบจัดการประเภทห้องพักและห้องพักจริง (Room Types Management System) เป็นส่วนหนึ่งของระบบจัดการโรงแรม ที่ให้ผู้ดูแลระบบ (Admin/Super Admin) สามารถจัดการข้อมูลประเภทห้องพัก (Room Types) เช่น Standard, Deluxe, Villa พร้อมรายละเอียด ราคา สิ่งอำนวยความสะดวก และรูปภาพ รวมถึงจัดการห้องพักจริง (Physical Rooms) ที่มีเลขห้องเฉพาะ เช่น 101, 102, 201 โดยแต่ละห้องจะเชื่อมโยงกับประเภทห้องพักหนึ่งประเภท

ระบบนี้จะถูกพัฒนาเป็นหน้า CMS ที่ `/admin/cms/rooms` โดยใช้ CMS Layout เดียวกับหน้า CMS อื่นๆ ที่มีอยู่แล้ว และออกแบบ UI/UX ให้สอดคล้องกับหน้า `/admin/cms/hero` ที่ใช้ card-based layout พร้อม inline editing

## Glossary

- **Room_Types_System**: ระบบจัดการประเภทห้องพักและห้องพักจริง
- **Admin**: ผู้ดูแลระบบที่มีสิทธิ์เข้าถึงหน้า CMS (role: admin หรือ super_admin)
- **Room_Type**: ประเภทห้องพัก เช่น Standard, Deluxe, Villa ที่เก็บข้อมูลในตาราง room_types
- **Physical_Room**: ห้องพักจริงที่มีเลขห้องเฉพาะ เก็บข้อมูลในตาราง rooms
- **Room_Number**: เลขห้องพักที่ไม่ซ้ำกันในโรงแรม (UNIQUE constraint)
- **Amenity**: สิ่งอำนวยความสะดวกในห้องพัก เช่น WiFi, แอร์, TV, ตู้เย็น
- **Cover_Image**: รูปภาพหน้าปกของประเภทห้อง (is_cover = true)
- **Room_Status**: สถานะห้องพัก (available, occupied, maintenance, out_of_order)
- **Housekeeping_Status**: สถานะความสะอาด (clean, dirty, in_progress, inspected, out_of_service)
- **Image_Upload_API**: API endpoint `/api/cms/upload-image` สำหรับอัปโหลดรูปภาพ
- **CMS_Layout**: Layout หน้า CMS ที่มี CmsSidebar และ main content area
- **Session**: ข้อมูล session ของผู้ใช้ที่มี hotelId และ role

## Requirements

### Requirement 1: Authentication and Authorization

**User Story:** As a system administrator, I want only authorized admin users to access the room management page, so that unauthorized users cannot modify room data.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access `/admin/cms/rooms`, THE Room_Types_System SHALL redirect them to `/login`
2. WHEN a user with role other than 'admin' or 'super_admin' attempts to access `/admin/cms/rooms`, THE Room_Types_System SHALL redirect them to `/admin`
3. WHEN an authenticated Admin accesses `/admin/cms/rooms`, THE Room_Types_System SHALL display the room management interface
4. THE Room_Types_System SHALL retrieve the hotel_id from the Session for all data operations

### Requirement 2: CMS Layout Integration

**User Story:** As an admin, I want the room management page to use the same layout as other CMS pages, so that I have a consistent navigation experience.

#### Acceptance Criteria

1. THE Room_Types_System SHALL render the page within the CMS_Layout
2. THE Room_Types_System SHALL display the CmsSidebar with navigation to other CMS sections
3. THE Room_Types_System SHALL add a new navigation item "ห้องพัก" (Rooms) to the CmsSidebar
4. THE Room_Types_System SHALL display the main content area with responsive design (mobile, tablet, desktop)

### Requirement 3: Display Room Types List

**User Story:** As an admin, I want to see a list of all room types in the sidebar or main area, so that I can select which room type to manage.

#### Acceptance Criteria

1. WHEN the Admin accesses `/admin/cms/rooms`, THE Room_Types_System SHALL fetch all Room_Type records for the current hotel
2. THE Room_Types_System SHALL display Room_Type records ordered by creation date
3. FOR EACH Room_Type, THE Room_Types_System SHALL display the name, base price, and active status
4. WHEN no Room_Type exists, THE Room_Types_System SHALL display an empty state message with an option to create the first room type

### Requirement 4: Create Room Type

**User Story:** As an admin, I want to create a new room type with details and images, so that I can define different accommodation options.

#### Acceptance Criteria

1. WHEN the Admin clicks the "เพิ่มประเภทห้อง" button, THE Room_Types_System SHALL display a room type creation form
2. THE Room_Types_System SHALL provide input fields for name, description, base_price, max_guests, amenities, and is_active
3. THE Room_Types_System SHALL validate that name is not empty and is unique within the hotel
4. THE Room_Types_System SHALL validate that base_price is a positive number
5. THE Room_Types_System SHALL validate that max_guests is a positive integer
6. WHEN the Admin submits valid data, THE Room_Types_System SHALL create a new Room_Type record with the current hotel_id
7. WHEN the Admin submits invalid data, THE Room_Types_System SHALL display validation error messages

### Requirement 5: Amenities Selection

**User Story:** As an admin, I want to select amenities from a predefined list and add custom ones, so that I can accurately describe room features.

#### Acceptance Criteria

1. THE Room_Types_System SHALL display checkboxes for predefined amenities: WiFi, แอร์, TV, ตู้เย็น, ระเบียง, อ่างอาบน้ำ, เครื่องทำน้ำอุ่น, ไดร์เป่าผม, ตู้นิรภัย, โต๊ะทำงาน
2. THE Room_Types_System SHALL allow the Admin to check multiple amenities
3. THE Room_Types_System SHALL provide an input field to add custom amenity names
4. WHEN the Admin adds a custom amenity, THE Room_Types_System SHALL append it to the amenities list
5. THE Room_Types_System SHALL store selected amenities as a JSONB array in the amenities column

### Requirement 6: Room Type Image Upload

**User Story:** As an admin, I want to upload multiple images for each room type, so that guests can see what the rooms look like.

#### Acceptance Criteria

1. THE Room_Types_System SHALL provide an image upload interface using the Image_Upload_API
2. THE Room_Types_System SHALL support both URL input and file upload methods
3. WHEN the Admin uploads an image, THE Room_Types_System SHALL send the file to `/api/cms/upload-image` with folder parameter "room_types"
4. WHEN the upload succeeds, THE Room_Types_System SHALL create a room_type_images record with the returned image_url
5. THE Room_Types_System SHALL allow the Admin to upload multiple images for one Room_Type
6. THE Room_Types_System SHALL display image previews after successful upload
7. THE Room_Types_System SHALL allow the Admin to delete uploaded images

### Requirement 7: Cover Image Selection

**User Story:** As an admin, I want to designate one image as the cover image, so that it appears as the primary image for the room type.

#### Acceptance Criteria

1. FOR EACH uploaded image, THE Room_Types_System SHALL provide a "ตั้งเป็นรูปหน้าปก" option
2. WHEN the Admin selects an image as cover, THE Room_Types_System SHALL set is_cover to true for that image
3. WHEN the Admin selects a new cover image, THE Room_Types_System SHALL set is_cover to false for the previous Cover_Image
4. THE Room_Types_System SHALL ensure only one image has is_cover = true per Room_Type
5. THE Room_Types_System SHALL visually indicate which image is the Cover_Image

### Requirement 8: Edit Room Type

**User Story:** As an admin, I want to edit existing room type details, so that I can update information when needed.

#### Acceptance Criteria

1. WHEN the Admin clicks the edit button on a Room_Type, THE Room_Types_System SHALL display an inline edit form with current values
2. THE Room_Types_System SHALL allow the Admin to modify name, description, base_price, max_guests, amenities, and is_active
3. THE Room_Types_System SHALL validate updated data using the same rules as creation
4. WHEN the Admin saves valid changes, THE Room_Types_System SHALL update the Room_Type record
5. WHEN the Admin cancels editing, THE Room_Types_System SHALL discard changes and restore the original display

### Requirement 9: Delete Room Type

**User Story:** As an admin, I want to delete a room type that is no longer offered, so that it doesn't appear in the system.

#### Acceptance Criteria

1. WHEN the Admin clicks the delete button on a Room_Type, THE Room_Types_System SHALL display a confirmation dialog
2. IF Physical_Room records reference the Room_Type, THEN THE Room_Types_System SHALL prevent deletion and display an error message "ไม่สามารถลบได้ เนื่องจากมีห้องพักที่ใช้ประเภทนี้อยู่"
3. IF no Physical_Room references the Room_Type, THEN THE Room_Types_System SHALL delete the Room_Type and all associated room_type_images records
4. WHEN deletion succeeds, THE Room_Types_System SHALL remove the Room_Type from the display

### Requirement 10: Display Physical Rooms List

**User Story:** As an admin, I want to see all physical rooms for a selected room type, so that I can manage individual room inventory.

#### Acceptance Criteria

1. WHEN the Admin selects a Room_Type, THE Room_Types_System SHALL fetch all Physical_Room records with matching room_type_id
2. THE Room_Types_System SHALL display Physical_Room records ordered by room_number
3. FOR EACH Physical_Room, THE Room_Types_System SHALL display room_number, floor, status, housekeeping status, and is_active
4. WHEN no Physical_Room exists for the selected Room_Type, THE Room_Types_System SHALL display an empty state message

### Requirement 11: Create Physical Room

**User Story:** As an admin, I want to create a new physical room with a unique room number, so that I can track individual room units.

#### Acceptance Criteria

1. WHEN the Admin clicks "เพิ่มห้องพัก" button, THE Room_Types_System SHALL display a room creation form
2. THE Room_Types_System SHALL provide a dropdown to select room_type_id (pre-selected if viewing a specific Room_Type)
3. THE Room_Types_System SHALL provide input fields for room_number, floor, status, housekeeping, notes, and is_active
4. THE Room_Types_System SHALL validate that room_number is not empty
5. THE Room_Types_System SHALL validate that room_number is unique within the hotel
6. WHEN the Admin submits a duplicate Room_Number, THE Room_Types_System SHALL display error message "เลขห้องนี้มีอยู่แล้ว"
7. WHEN the Admin submits valid data, THE Room_Types_System SHALL create a new Physical_Room record

### Requirement 12: Room Status Management

**User Story:** As an admin, I want to set and update room status, so that I can track room availability and maintenance needs.

#### Acceptance Criteria

1. THE Room_Types_System SHALL provide a dropdown for Room_Status with options: available, occupied, maintenance, out_of_order
2. THE Room_Types_System SHALL provide a dropdown for Housekeeping_Status with options: clean, dirty, in_progress, inspected, out_of_service
3. THE Room_Types_System SHALL display status values in Thai: available="ว่าง", occupied="มีผู้เข้าพัก", maintenance="ซ่อมบำรุง", out_of_order="ไม่พร้อมใช้งาน"
4. THE Room_Types_System SHALL display housekeeping values in Thai: clean="สะอาด", dirty="รอทำความสะอาด", in_progress="กำลังทำความสะอาด", inspected="ตรวจสอบแล้ว", out_of_service="ไม่ให้บริการ"
5. WHEN the Admin changes status, THE Room_Types_System SHALL update the Physical_Room record immediately

### Requirement 13: Edit Physical Room

**User Story:** As an admin, I want to edit physical room details, so that I can update room information and status.

#### Acceptance Criteria

1. WHEN the Admin clicks the edit button on a Physical_Room, THE Room_Types_System SHALL display an inline edit form
2. THE Room_Types_System SHALL allow the Admin to modify room_type_id, room_number, floor, status, housekeeping, notes, and is_active
3. THE Room_Types_System SHALL validate that the updated room_number is unique (excluding the current room)
4. WHEN the Admin saves valid changes, THE Room_Types_System SHALL update the Physical_Room record
5. WHEN the Admin cancels editing, THE Room_Types_System SHALL discard changes

### Requirement 14: Delete Physical Room

**User Story:** As an admin, I want to delete a physical room that no longer exists, so that the inventory is accurate.

#### Acceptance Criteria

1. WHEN the Admin clicks the delete button on a Physical_Room, THE Room_Types_System SHALL display a confirmation dialog
2. IF booking records reference the Physical_Room, THEN THE Room_Types_System SHALL prevent deletion and display error message "ไม่สามารถลบได้ เนื่องจากมีการจองที่เกี่ยวข้อง"
3. IF no bookings reference the Physical_Room, THEN THE Room_Types_System SHALL delete the Physical_Room record
4. WHEN deletion succeeds, THE Room_Types_System SHALL remove the Physical_Room from the display

### Requirement 15: UI Design Compliance

**User Story:** As an admin, I want the interface to follow professional design standards, so that the system looks consistent and polished.

#### Acceptance Criteria

1. THE Room_Types_System SHALL use SVG icons instead of emoji for all UI elements
2. THE Room_Types_System SHALL use the same color scheme as existing CMS pages: primary=#1a3c2a, accent=#c9a84c, background=#faf7f0
3. THE Room_Types_System SHALL use card-based layout similar to `/admin/cms/hero` page
4. THE Room_Types_System SHALL provide inline editing functionality similar to HeroSlideEditor component
5. THE Room_Types_System SHALL be fully responsive on mobile, tablet, and desktop viewports

### Requirement 16: Image Management for Room Types

**User Story:** As an admin, I want to reorder and manage multiple images for each room type, so that I can control how rooms are presented.

#### Acceptance Criteria

1. THE Room_Types_System SHALL display all uploaded images for a Room_Type in a gallery view
2. THE Room_Types_System SHALL allow the Admin to set sort_order for each image
3. THE Room_Types_System SHALL display images ordered by sort_order ascending
4. WHEN the Admin deletes an image, THE Room_Types_System SHALL delete the corresponding room_type_images record
5. IF the deleted image was the Cover_Image, THEN THE Room_Types_System SHALL automatically set the first remaining image as the new cover

### Requirement 17: Server Actions for Data Operations

**User Story:** As a developer, I want to use Next.js Server Actions for all CRUD operations, so that the implementation follows the project's architecture.

#### Acceptance Criteria

1. THE Room_Types_System SHALL implement Server Actions in `/app/actions/rooms.ts` for all database operations
2. THE Room_Types_System SHALL validate Session and hotel_id in every Server Action
3. THE Room_Types_System SHALL use Supabase client for database queries
4. THE Room_Types_System SHALL return error objects with descriptive messages when operations fail
5. THE Room_Types_System SHALL return success objects with updated data when operations succeed

### Requirement 18: Active/Inactive Toggle

**User Story:** As an admin, I want to activate or deactivate room types and physical rooms, so that I can control what is available for booking without deleting records.

#### Acceptance Criteria

1. THE Room_Types_System SHALL provide a checkbox for is_active on Room_Type forms
2. THE Room_Types_System SHALL provide a checkbox for is_active on Physical_Room forms
3. WHEN is_active is false, THE Room_Types_System SHALL display a visual indicator (e.g., "ซ่อนอยู่" badge)
4. THE Room_Types_System SHALL allow toggling is_active without requiring full form submission
5. THE Room_Types_System SHALL preserve inactive records in the database for historical reference
