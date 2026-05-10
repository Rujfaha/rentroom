# Implementation Plan: Room Types Management System

## Overview

This implementation plan breaks down the Room Types Management System into discrete coding tasks. The system enables hotel administrators to manage room type definitions (Standard, Deluxe, Villa) and physical room inventory (Room 101, 102, etc.) through a CMS interface at `/admin/cms/rooms`.

The implementation follows the existing CMS architecture pattern used in `/admin/cms/hero`, with card-based layout, inline editing, and Server Actions for data operations.

## Tasks

- [ ] 1. Set up Server Actions infrastructure
  - Create `/src/app/actions/rooms.ts` file
  - Implement session validation helper function
  - Set up error handling utilities and response types
  - _Requirements: 17.1, 17.2, 17.4, 17.5_

- [ ] 2. Implement Room Type CRUD Server Actions
  - [ ] 2.1 Implement createRoomType Server Action
    - Validate session and extract hotel_id
    - Parse FormData (name, description, base_price, max_guests, amenities, is_active)
    - Validate name uniqueness within hotel
    - Validate base_price is positive number
    - Validate max_guests is positive integer
    - Insert room_type record with hotel_id
    - Call revalidatePath for cache invalidation
    - Return success with created data or error message
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 17.2, 17.4, 17.5_

  - [ ]* 2.2 Write property test for createRoomType
    - **Property 2: Room Type Name Uniqueness**
    - **Property 3: Positive Price Validation**
    - **Property 4: Positive Guest Count Validation**
    - **Property 5: Room Type Creation with Hotel Association**
    - **Property 6: Amenities Storage Format**
    - **Validates: Requirements 4.3, 4.4, 4.5, 4.6, 5.4, 5.5**

  - [ ] 2.3 Implement updateRoomType Server Action
    - Validate session and extract hotel_id
    - Parse FormData including room type id
    - Apply same validation rules as creation
    - Validate name uniqueness excluding current record
    - Update room_type record
    - Call revalidatePath
    - Return success or error
    - _Requirements: 8.3, 8.4, 11.1, 17.2_

  - [ ]* 2.4 Write property test for updateRoomType
    - **Property 11: Validation Consistency Between Create and Update**
    - **Property 12: Room Type Update Persistence**
    - **Validates: Requirements 8.3, 8.4**

  - [ ] 2.5 Implement deleteRoomType Server Action
    - Validate session and extract hotel_id
    - Check if any rooms reference this room_type_id
    - If rooms exist, return error "ไม่สามารถลบได้ เนื่องจากมีห้องพักที่ใช้ประเภทนี้อยู่"
    - If no rooms, delete room_type and cascade delete room_type_images
    - Call revalidatePath
    - Return success or error
    - _Requirements: 9.2, 9.3, 9.4, 17.2_

  - [ ]* 2.6 Write property test for deleteRoomType
    - **Property 13: Room Type Deletion with Referential Integrity**
    - **Validates: Requirements 9.2, 9.3**

- [ ] 3. Implement Room Type Image Server Actions
  - [ ] 3.1 Implement uploadRoomTypeImage Server Action
    - Validate session and extract hotel_id
    - Parse FormData (room_type_id, image_url from upload API)
    - Create room_type_images record with hotel_id
    - Set is_cover to false by default
    - Set sort_order to max + 1
    - Call revalidatePath
    - Return success with image data or error
    - _Requirements: 6.4, 6.5, 7.1, 17.2_

  - [ ] 3.2 Implement setCoverImage Server Action
    - Validate session and extract hotel_id
    - Parse room_type_id and image_id
    - Set is_cover = false for all images of this room type
    - Set is_cover = true for specified image
    - Call revalidatePath
    - Return success or error
    - _Requirements: 7.2, 7.3, 7.4, 17.2_

  - [ ]* 3.3 Write property test for setCoverImage
    - **Property 10: Single Cover Image Invariant**
    - **Validates: Requirements 7.2, 7.3, 7.4**

  - [ ] 3.4 Implement deleteRoomTypeImage Server Action
    - Validate session and extract hotel_id
    - Delete room_type_images record
    - If deleted image was cover (is_cover = true), set first remaining image as cover
    - Call revalidatePath
    - Return success or error
    - _Requirements: 6.7, 16.4, 16.5, 17.2_

  - [ ]* 3.5 Write property test for deleteRoomTypeImage
    - **Property 9: Image Deletion**
    - **Property 24: Cover Image Reassignment on Deletion**
    - **Validates: Requirements 6.7, 16.4, 16.5**

- [ ] 4. Implement Physical Room CRUD Server Actions
  - [ ] 4.1 Implement createRoom Server Action
    - Validate session and extract hotel_id
    - Parse FormData (room_type_id, room_number, floor, status, housekeeping, notes, is_active)
    - Validate room_number is not empty
    - Validate room_number uniqueness within hotel
    - Insert room record with hotel_id
    - Call revalidatePath
    - Return success with created data or error
    - _Requirements: 11.4, 11.5, 11.6, 11.7, 17.2_

  - [ ]* 4.2 Write property test for createRoom
    - **Property 17: Room Number Non-Empty Validation**
    - **Property 18: Room Number Uniqueness Within Hotel**
    - **Property 19: Physical Room Creation**
    - **Validates: Requirements 11.4, 11.5, 11.6, 11.7**

  - [ ] 4.3 Implement updateRoom Server Action
    - Validate session and extract hotel_id
    - Parse FormData including room id
    - Validate room_number uniqueness excluding current record
    - Update room record
    - Call revalidatePath
    - Return success or error
    - _Requirements: 12.5, 13.3, 13.4, 17.2_

  - [ ]* 4.4 Write property test for updateRoom
    - **Property 20: Room Status Update**
    - **Property 21: Physical Room Update Persistence**
    - **Validates: Requirements 12.5, 13.4**

  - [ ] 4.5 Implement deleteRoom Server Action
    - Validate session and extract hotel_id
    - Check if any bookings reference this room_id
    - If bookings exist, return error "ไม่สามารถลบได้ เนื่องจากมีการจองที่เกี่ยวข้อง"
    - If no bookings, delete room record
    - Call revalidatePath
    - Return success or error
    - _Requirements: 14.2, 14.3, 14.4, 17.2_

  - [ ]* 4.6 Write property test for deleteRoom
    - **Property 22: Physical Room Deletion with Booking Check**
    - **Validates: Requirements 14.2, 14.3**

- [ ] 5. Checkpoint - Verify Server Actions
  - Ensure all Server Actions are implemented and follow consistent patterns
  - Verify session validation in all actions
  - Verify hotel_id filtering in all database queries
  - Ensure all tests pass, ask the user if questions arise

- [ ] 6. Create reusable ImageUploadInput component
  - [ ] 6.1 Create ImageUploadInput component file
    - Create `/src/components/admin/cms/ImageUploadInput.tsx`
    - Implement tab interface (URL input / File upload)
    - Handle file selection and preview
    - Call `/api/cms/upload-image` with folder parameter
    - Display upload progress and errors
    - Emit onUploadSuccess callback with image URL
    - Support defaultUrl prop for editing
    - Match styling from HeroSlideEditor
    - _Requirements: 6.1, 6.2, 6.3, 15.1, 15.2, 15.3_

  - [ ]* 6.2 Write unit tests for ImageUploadInput
    - Test URL input and validation
    - Test file upload flow
    - Test error handling
    - Test preview display
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 7. Create Room Type components
  - [ ] 7.1 Create RoomTypeCard component
    - Create `/src/components/admin/cms/RoomTypeCard.tsx`
    - Display room type name, description, base_price, max_guests
    - Show cover image or placeholder icon
    - Display amenities list with SVG icons (no emoji)
    - Show is_active status badge ("ซ่อนอยู่" if inactive)
    - Provide Edit and Delete buttons with SVG icons
    - Use card-based layout matching hero page design
    - Apply color scheme: primary=#1a3c2a, accent=#c9a84c, background=#faf7f0
    - _Requirements: 3.3, 15.1, 15.2, 15.3, 15.4, 18.3_

  - [ ] 7.2 Create RoomTypeForm component
    - Create `/src/components/admin/cms/RoomTypeForm.tsx`
    - Render form fields: name, description, base_price, max_guests, is_active
    - Implement amenities selection with checkboxes for predefined list
    - Predefined amenities: WiFi, แอร์, TV, ตู้เย็น, ระเบียง, อ่างอาบน้ำ, เครื่องทำน้ำอุ่น, ไดร์เป่าผม, ตู้นิรภัย, โต๊ะทำงาน
    - Add custom amenity input field
    - Implement client-side validation (required fields, positive numbers)
    - Display validation error messages
    - Provide Save and Cancel buttons
    - Support both create and edit modes via optional roomType prop
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 8.2, 15.1, 15.2_

  - [ ] 7.3 Create RoomTypeImageGallery component
    - Create `/src/components/admin/cms/RoomTypeImageGallery.tsx`
    - Display all images for a room type in grid layout
    - Show cover badge on designated cover image
    - Provide "ตั้งเป็นรูปหน้าปก" button for each image
    - Provide delete button for each image
    - Call setCoverImage Server Action on cover selection
    - Call deleteRoomTypeImage Server Action on delete
    - Display images ordered by sort_order
    - Integrate ImageUploadInput for adding new images
    - _Requirements: 6.5, 6.6, 6.7, 7.1, 7.2, 7.5, 16.1, 16.2, 16.3, 16.4_

  - [ ]* 7.4 Write unit tests for Room Type components
    - Test RoomTypeCard rendering with various data
    - Test RoomTypeForm validation
    - Test RoomTypeImageGallery interactions
    - _Requirements: 3.3, 4.2, 6.5, 7.1_

- [ ] 8. Create RoomTypesEditor main component
  - [ ] 8.1 Implement RoomTypesEditor component
    - Create `/src/components/admin/cms/RoomTypesEditor.tsx`
    - Accept initialRoomTypes prop with images
    - Display grid of RoomTypeCard components
    - Implement "เพิ่มประเภทห้อง" button with Plus icon
    - Handle inline editing state (editingId)
    - Show RoomTypeForm when editing or creating
    - Call createRoomType Server Action for new room types
    - Call updateRoomType Server Action for updates
    - Call deleteRoomType Server Action with confirmation dialog
    - Display empty state when no room types exist
    - Handle loading states during Server Action calls
    - Display error messages from Server Actions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.6, 4.7, 8.1, 8.4, 8.5, 9.1, 15.4_

  - [ ]* 8.2 Write unit tests for RoomTypesEditor
    - Test room type creation flow
    - Test inline editing
    - Test deletion with confirmation
    - Test empty state display
    - _Requirements: 3.1, 4.1, 8.1, 9.1_

- [ ] 9. Create Physical Room components
  - [ ] 9.1 Create PhysicalRoomCard component
    - Create `/src/components/admin/cms/PhysicalRoomCard.tsx`
    - Display room_number, floor, status, housekeeping status
    - Show is_active status badge
    - Display status in Thai with appropriate colors
    - Status mapping: available="ว่าง", occupied="มีผู้เข้าพัก", maintenance="ซ่อมบำรุง", out_of_order="ไม่พร้อมใช้งาน"
    - Housekeeping mapping: clean="สะอาด", dirty="รอทำความสะอาด", in_progress="กำลังทำความสะอาด", inspected="ตรวจสอบแล้ว", out_of_service="ไม่ให้บริการ"
    - Provide Edit and Delete buttons
    - Use SVG icons (no emoji)
    - _Requirements: 10.3, 12.3, 12.4, 15.1, 15.2, 18.3_

  - [ ] 9.2 Create PhysicalRoomForm component
    - Create `/src/components/admin/cms/PhysicalRoomForm.tsx`
    - Render form fields: room_type_id (dropdown), room_number, floor, status, housekeeping, notes, is_active
    - Implement status dropdowns with Thai labels
    - Implement client-side validation (required room_number)
    - Display validation error messages
    - Provide Save and Cancel buttons
    - Support both create and edit modes
    - _Requirements: 11.1, 11.2, 11.3, 12.1, 12.2, 13.2, 15.1, 15.2_

  - [ ] 9.3 Create PhysicalRoomsManager component
    - Create `/src/components/admin/cms/PhysicalRoomsManager.tsx`
    - Accept roomTypeId and initialRooms props
    - Display list of PhysicalRoomCard components
    - Implement "เพิ่มห้องพัก" button
    - Handle inline editing state
    - Show PhysicalRoomForm when editing or creating
    - Call createRoom Server Action for new rooms
    - Call updateRoom Server Action for updates
    - Call deleteRoom Server Action with confirmation dialog
    - Display rooms ordered by room_number
    - Display empty state when no rooms exist
    - _Requirements: 10.1, 10.2, 10.4, 11.1, 13.1, 13.5, 14.1_

  - [ ]* 9.4 Write unit tests for Physical Room components
    - Test PhysicalRoomCard rendering
    - Test PhysicalRoomForm validation
    - Test PhysicalRoomsManager CRUD operations
    - _Requirements: 10.3, 11.1, 13.1_

- [ ] 10. Update CmsSidebar navigation
  - [ ] 10.1 Add "ห้องพัก" navigation item to CmsSidebar
    - Open `/src/components/admin/cms/CmsSidebar.tsx`
    - Add new link object to cmsLinks array
    - Set href to "/admin/cms/rooms"
    - Set label to "ห้องพัก"
    - Set subtitle to "Room Types & Rooms"
    - Use appropriate SVG icon from lucide-react (e.g., Bed, Hotel, DoorOpen)
    - Maintain consistent styling with existing links
    - _Requirements: 2.3, 15.1_

- [ ] 11. Create main CMS page for rooms
  - [ ] 11.1 Create rooms CMS page
    - Create `/src/app/(admin)/admin/cms/rooms/page.tsx`
    - Implement server component with async function
    - Call getSession() and validate authentication
    - Redirect to /login if unauthenticated
    - Redirect to /admin if role is not admin or super_admin
    - Fetch room_types with images from Supabase filtered by hotel_id
    - Order room types by created_at DESC
    - Fetch all rooms from Supabase filtered by hotel_id
    - Render page header with title and description
    - Render RoomTypesEditor with initialRoomTypes
    - Render PhysicalRoomsManager with initialRooms
    - Use CMS Layout (already configured in layout.tsx)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 10.1, 15.5_

  - [ ]* 11.2 Write integration tests for rooms page
    - Test authentication redirects
    - Test authorization checks
    - Test data fetching with hotel_id filter
    - Test page rendering with data
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 12. Implement responsive design
  - [ ] 12.1 Add responsive breakpoints to all components
    - Ensure RoomTypeCard grid is responsive (1 col mobile, 2 tablet, 3 desktop)
    - Ensure PhysicalRoomCard list is responsive
    - Ensure forms are mobile-friendly
    - Test on mobile (320px), tablet (768px), desktop (1024px+)
    - _Requirements: 2.4, 15.5_

- [ ] 13. Add multi-tenant data isolation tests
  - [ ]* 13.1 Write property tests for data isolation
    - **Property 1: Multi-tenant Data Isolation**
    - **Property 25: Server Action Session Validation**
    - Test that all queries filter by hotel_id
    - Test that cross-hotel access is impossible
    - Verify session validation in all Server Actions
    - **Validates: Requirements 1.4, 3.1, 17.2**

- [ ] 14. Implement error handling and user feedback
  - [ ] 14.1 Add error boundaries and error displays
    - Display validation errors inline in forms
    - Show toast notifications for Server Action results
    - Display confirmation dialogs for destructive actions
    - Handle network errors gracefully
    - Show loading states during async operations
    - _Requirements: 4.7, 9.1, 11.6, 14.1_

- [ ] 15. Final integration and testing
  - [ ] 15.1 Test complete room type workflow
    - Create new room type with amenities
    - Upload multiple images
    - Set cover image
    - Edit room type details
    - Delete room type (with and without rooms)
    - Verify all data persists correctly
    - _Requirements: 4.1-4.7, 6.1-6.7, 7.1-7.5, 8.1-8.5, 9.1-9.4_

  - [ ] 15.2 Test complete physical room workflow
    - Create new physical room
    - Update room status and housekeeping status
    - Edit room details
    - Delete room (with and without bookings)
    - Verify room_number uniqueness
    - _Requirements: 11.1-11.7, 12.1-12.5, 13.1-13.5, 14.1-14.4_

  - [ ] 15.3 Test UI/UX compliance
    - Verify no emoji in UI elements
    - Verify SVG icons used throughout
    - Verify color scheme consistency
    - Verify card-based layout matches hero page
    - Verify inline editing works smoothly
    - Test responsive design on all breakpoints
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 16. Final checkpoint - Complete system verification
  - Run all tests (unit, property-based, integration)
  - Verify all requirements are met
  - Test authentication and authorization flows
  - Test multi-tenant data isolation
  - Verify error handling and user feedback
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Server Actions follow consistent pattern: validate session → parse input → validate data → database operation → revalidatePath → return result
- All components use SVG icons from lucide-react (no emoji in UI)
- Color scheme: primary=#1a3c2a, accent=#c9a84c, background=#faf7f0
- Multi-tenant isolation enforced at every database query level
- Inline editing pattern follows HeroSlideEditor component design
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
