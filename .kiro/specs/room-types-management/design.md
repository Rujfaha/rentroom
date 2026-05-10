# Design Document: Room Types Management System

## Overview

The Room Types Management System is a comprehensive CMS module that enables hotel administrators to manage both room type definitions (e.g., Standard, Deluxe, Villa) and physical room inventory (e.g., Room 101, 102). This system serves as the foundation for the hotel's room inventory management, providing the data structure that supports booking operations, pricing rules, and availability tracking.

### Key Objectives

- Provide intuitive CRUD operations for room types with rich media support
- Enable efficient management of physical room inventory with status tracking
- Maintain data integrity through proper foreign key relationships and validation
- Deliver a consistent user experience aligned with existing CMS pages
- Support multi-tenant architecture with hotel-level data isolation

### Scope

**In Scope:**
- Room type management (create, read, update, delete)
- Multi-image upload and management for room types
- Cover image designation
- Amenities selection (predefined + custom)
- Physical room management with unique room numbers
- Room status and housekeeping status tracking
- Active/inactive toggles for soft deletion
- Inline editing UI similar to HeroSlideEditor
- Server Actions for all data operations

**Out of Scope:**
- Booking system integration (handled by separate booking module)
- Pricing rules management (separate pricing module)
- Real-time availability calculation
- Room assignment automation
- Guest-facing room search and filtering

### Technology Stack

- **Framework:** Next.js 16.2.4 (App Router)
- **Language:** TypeScript 5
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Supabase Client
- **UI Library:** React 19.2.4
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React 1.14.0
- **Image Upload:** Custom API endpoint `/api/cms/upload-image`

## Architecture

### System Architecture

The Room Types Management System follows Next.js App Router architecture with server-side rendering and Server Actions for data mutations:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  /admin/cms/rooms (Page Component)                    │ │
│  │  - Server-rendered initial data                       │ │
│  │  - Client components for interactivity                │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Server                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Server Components                                    │ │
│  │  - Authentication check (getSession)                  │ │
│  │  - Initial data fetch (Supabase)                      │ │
│  │  - SSR rendering                                      │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Server Actions (/app/actions/rooms.ts)              │ │
│  │  - createRoomType, updateRoomType, deleteRoomType    │ │
│  │  - createRoom, updateRoom, deleteRoom                │ │
│  │  - uploadRoomTypeImage, deleteRoomTypeImage          │ │
│  │  - setCoverImage                                      │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase PostgreSQL                        │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Tables:                                              │ │
│  │  - room_types (hotel_id, name, description, ...)     │ │
│  │  - room_type_images (room_type_id, image_url, ...)   │ │
│  │  - rooms (hotel_id, room_type_id, room_number, ...)  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Read Operations (Initial Page Load):**
1. User navigates to `/admin/cms/rooms`
2. Server component checks authentication via `getSession()`
3. Server fetches room types and rooms from Supabase filtered by `hotel_id`
4. Server renders page with initial data
5. Client hydrates interactive components

**Write Operations (Create/Update/Delete):**
1. User interacts with form (e.g., clicks save button)
2. Client component calls Server Action with FormData
3. Server Action validates session and hotel_id
4. Server Action performs database operation via Supabase
5. Server Action calls `revalidatePath()` to refresh cache
6. Server Action returns success/error response
7. Client component updates UI based on response

### Security Model

**Authentication:**
- All routes protected by middleware checking session existence
- Page-level authorization checks for admin/super_admin roles
- Redirect to `/login` if unauthenticated
- Redirect to `/admin` if insufficient permissions

**Authorization:**
- Server Actions validate session on every call
- All database queries filtered by `hotel_id` from session
- Multi-tenant isolation enforced at query level
- No cross-hotel data access possible

**Data Validation:**
- Input validation in Server Actions before database operations
- Unique constraints enforced at database level (room_number)
- Foreign key constraints prevent orphaned records
- Referential integrity checks before deletion

## Components and Interfaces

### Page Component

**File:** `src/app/(admin)/admin/cms/rooms/page.tsx`

```typescript
export default async function RoomsCMSPage() {
  // Server-side authentication and data fetching
  // Renders RoomTypesEditor with initial data
}
```

**Responsibilities:**
- Authenticate user and check role
- Fetch initial room types and rooms data
- Render page layout with CMS sidebar
- Pass data to client components

### Client Components

#### RoomTypesEditor

**File:** `src/components/admin/cms/RoomTypesEditor.tsx`

```typescript
interface RoomTypesEditorProps {
  initialRoomTypes: RoomTypeWithImages[];
}

export function RoomTypesEditor({ initialRoomTypes }: RoomTypesEditorProps)
```

**Responsibilities:**
- Display grid of room type cards
- Handle inline editing state
- Manage "Add Room Type" flow
- Coordinate with Server Actions for CRUD operations

#### RoomTypeCard

**File:** `src/components/admin/cms/RoomTypeCard.tsx`

```typescript
interface RoomTypeCardProps {
  roomType: RoomTypeWithImages;
  onEdit: () => void;
  onDelete: () => void;
}

export function RoomTypeCard({ roomType, onEdit, onDelete }: RoomTypeCardProps)
```

**Responsibilities:**
- Display room type information (name, price, amenities)
- Show cover image
- Provide edit and delete buttons
- Display active/inactive status badge

#### RoomTypeForm

**File:** `src/components/admin/cms/RoomTypeForm.tsx`

```typescript
interface RoomTypeFormProps {
  roomType?: RoomTypeWithImages;
  onSave: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export function RoomTypeForm({ roomType, onSave, onCancel }: RoomTypeFormProps)
```

**Responsibilities:**
- Render form fields for room type data
- Handle amenities selection (checkboxes + custom input)
- Integrate ImageUploadInput component
- Validate input before submission
- Display validation errors

#### ImageUploadInput

**File:** `src/components/admin/cms/ImageUploadInput.tsx`

```typescript
interface ImageUploadInputProps {
  folder: string;
  onUploadSuccess: (url: string) => void;
  defaultUrl?: string;
}

export function ImageUploadInput({ folder, onUploadSuccess, defaultUrl }: ImageUploadInputProps)
```

**Responsibilities:**
- Provide URL input and file upload tabs
- Handle file selection and upload to `/api/cms/upload-image`
- Display upload progress and errors
- Show image preview
- Reusable across CMS modules

#### RoomTypeImageGallery

**File:** `src/components/admin/cms/RoomTypeImageGallery.tsx`

```typescript
interface RoomTypeImageGalleryProps {
  roomTypeId: string;
  images: RoomTypeImage[];
  onSetCover: (imageId: string) => Promise<void>;
  onDelete: (imageId: string) => Promise<void>;
}

export function RoomTypeImageGallery({ roomTypeId, images, onSetCover, onDelete }: RoomTypeImageGalleryProps)
```

**Responsibilities:**
- Display all images for a room type
- Allow setting cover image
- Allow deleting images
- Show cover badge on designated image

#### PhysicalRoomsManager

**File:** `src/components/admin/cms/PhysicalRoomsManager.tsx`

```typescript
interface PhysicalRoomsManagerProps {
  roomTypeId: string;
  initialRooms: Room[];
}

export function PhysicalRoomsManager({ roomTypeId, initialRooms }: PhysicalRoomsManagerProps)
```

**Responsibilities:**
- Display list of physical rooms for selected room type
- Handle inline editing of room details
- Manage room status and housekeeping status
- Coordinate with Server Actions for room CRUD operations

### Server Actions

**File:** `src/app/actions/rooms.ts`

```typescript
// Room Type Actions
export async function createRoomType(formData: FormData): Promise<ActionResult>
export async function updateRoomType(formData: FormData): Promise<ActionResult>
export async function deleteRoomType(id: string): Promise<ActionResult>

// Room Type Image Actions
export async function uploadRoomTypeImage(formData: FormData): Promise<ActionResult>
export async function deleteRoomTypeImage(imageId: string): Promise<ActionResult>
export async function setCoverImage(roomTypeId: string, imageId: string): Promise<ActionResult>

// Physical Room Actions
export async function createRoom(formData: FormData): Promise<ActionResult>
export async function updateRoom(formData: FormData): Promise<ActionResult>
export async function deleteRoom(id: string): Promise<ActionResult>

type ActionResult = { success: true; data?: any } | { error: string }
```

**Common Pattern:**
1. Validate session and extract hotel_id
2. Parse and validate input data
3. Perform database operation via Supabase
4. Call `revalidatePath()` for affected routes
5. Return success or error response

## Data Models

### Room Type

```typescript
interface RoomType {
  id: string;                    // UUID primary key
  hotel_id: string;              // Foreign key to hotels table
  name: string;                  // e.g., "Standard", "Deluxe", "Villa"
  description: string | null;    // Rich text description
  base_price: number;            // Base price per night (decimal)
  max_guests: number;            // Maximum occupancy
  amenities: string[];           // JSONB array of amenity names
  is_active: boolean;            // Soft delete flag
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}
```

**Constraints:**
- `UNIQUE(hotel_id, name)` - Room type names must be unique within a hotel
- `base_price >= 0` - Price cannot be negative
- `max_guests > 0` - Must accommodate at least one guest

### Room Type Image

```typescript
interface RoomTypeImage {
  id: string;                    // UUID primary key
  room_type_id: string;          // Foreign key to room_types
  hotel_id: string;              // Foreign key to hotels
  image_url: string;             // URL or path to image file
  alt_text: string | null;       // Accessibility text
  is_cover: boolean;             // Cover image flag
  sort_order: number;            // Display order
  created_at: string;            // ISO timestamp
}
```

**Constraints:**
- Only one image per room type can have `is_cover = true`
- Images ordered by `sort_order ASC` for display
- Cascade delete when room type is deleted

### Physical Room

```typescript
interface Room {
  id: string;                    // UUID primary key
  hotel_id: string;              // Foreign key to hotels
  room_type_id: string;          // Foreign key to room_types
  room_number: string;           // e.g., "101", "A1", "Villa-1"
  floor: string | null;          // Floor number or name
  status: RoomStatus;            // Enum: available, occupied, maintenance, out_of_order
  housekeeping: HousekeepingStatus; // Enum: clean, dirty, in_progress, inspected, out_of_service
  notes: string | null;          // Internal notes
  is_active: boolean;            // Soft delete flag
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}
```

**Constraints:**
- `UNIQUE(hotel_id, room_number)` - Room numbers must be unique within a hotel
- `ON DELETE RESTRICT` for room_type_id - Cannot delete room type if rooms exist
- Status enums enforced at database level

### Composite Types

```typescript
interface RoomTypeWithImages extends RoomType {
  images: RoomTypeImage[];
  coverImage?: RoomTypeImage;
}

interface RoomWithType extends Room {
  room_type: RoomType;
}
```

### Enums

```typescript
type RoomStatus = 
  | "available"      // ว่าง - Ready for booking
  | "occupied"       // มีผู้เข้าพัก - Currently occupied
  | "maintenance"    // ซ่อมบำรุง - Under maintenance
  | "out_of_order";  // ไม่พร้อมใช้งาน - Not available

type HousekeepingStatus = 
  | "clean"          // สะอาด - Ready for guest
  | "dirty"          // รอทำความสะอาด - Needs cleaning
  | "in_progress"    // กำลังทำความสะอาด - Being cleaned
  | "inspected"      // ตรวจสอบแล้ว - Cleaned and inspected
  | "out_of_service"; // ไม่ให้บริการ - Not in service
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Multi-tenant Data Isolation

*For any* database operation (create, read, update, delete) performed by the system, the operation SHALL filter data by the hotel_id extracted from the authenticated user's session, ensuring complete data isolation between hotels.

**Validates: Requirements 1.4, 3.1, 17.2**

### Property 2: Room Type Name Uniqueness

*For any* room type creation or update operation within a hotel, if the name already exists for another room type in the same hotel, the system SHALL reject the operation and return a validation error.

**Validates: Requirements 4.3**

### Property 3: Positive Price Validation

*For any* room type with a base_price value, if the value is not a positive number (≤ 0), the system SHALL reject the operation and return a validation error.

**Validates: Requirements 4.4**

### Property 4: Positive Guest Count Validation

*For any* room type with a max_guests value, if the value is not a positive integer (≤ 0), the system SHALL reject the operation and return a validation error.

**Validates: Requirements 4.5**

### Property 5: Room Type Creation with Hotel Association

*For any* valid room type data submitted by an authenticated admin, creating the room type SHALL produce a new record with the hotel_id matching the admin's session hotel_id.

**Validates: Requirements 4.6**

### Property 6: Amenities Storage Format

*For any* room type with selected amenities (predefined or custom), the amenities SHALL be stored in the database as a JSONB array containing all selected amenity names.

**Validates: Requirements 5.4, 5.5**

### Property 7: Image Upload API Integration

*For any* image upload operation for room types, the system SHALL call the `/api/cms/upload-image` endpoint with the folder parameter set to "room_types" and create a room_type_images record with the returned image_url upon success.

**Validates: Requirements 6.3, 6.4**

### Property 8: Multiple Images Per Room Type

*For any* room type, the system SHALL allow uploading and storing multiple images, with each image creating a separate room_type_images record linked to that room type.

**Validates: Requirements 6.5**

### Property 9: Image Deletion

*For any* room type image, when an admin deletes the image, the system SHALL remove the corresponding room_type_images record from the database.

**Validates: Requirements 6.7, 16.4**

### Property 10: Single Cover Image Invariant

*For any* room type at any point in time, at most one image SHALL have is_cover = true. When setting a new cover image, the system SHALL automatically set is_cover = false for any previous cover image.

**Validates: Requirements 7.2, 7.3, 7.4**

### Property 11: Validation Consistency Between Create and Update

*For any* validation rule applied during room type creation (name uniqueness, positive price, positive max_guests), the same validation rule SHALL be applied during room type updates.

**Validates: Requirements 8.3**

### Property 12: Room Type Update Persistence

*For any* valid room type update data submitted by an admin, saving the changes SHALL update the corresponding room_type record in the database with the new values.

**Validates: Requirements 8.4**

### Property 13: Room Type Deletion with Referential Integrity

*For any* room type, if one or more physical rooms reference that room type (via room_type_id), the system SHALL prevent deletion and return an error message. If no physical rooms reference the room type, deletion SHALL succeed and also remove all associated room_type_images records.

**Validates: Requirements 9.2, 9.3**

### Property 14: Physical Room Fetching by Room Type

*For any* room type selected by an admin, the system SHALL fetch and display only the physical rooms that have a room_type_id matching the selected room type's id.

**Validates: Requirements 10.1**

### Property 15: Room Number Ordering

*For any* set of physical rooms displayed for a room type, the rooms SHALL be ordered by room_number in ascending order.

**Validates: Requirements 10.2**

### Property 16: Physical Room Display Fields

*For any* physical room displayed in the system, the rendered output SHALL include the room_number, floor, status, housekeeping status, and is_active fields.

**Validates: Requirements 10.3**

### Property 17: Room Number Non-Empty Validation

*For any* physical room creation operation, if the room_number is empty or contains only whitespace, the system SHALL reject the operation and return a validation error.

**Validates: Requirements 11.4**

### Property 18: Room Number Uniqueness Within Hotel

*For any* physical room creation or update operation within a hotel, if the room_number already exists for another room in the same hotel (excluding the current room during updates), the system SHALL reject the operation and return an error message.

**Validates: Requirements 11.5, 11.6, 13.3**

### Property 19: Physical Room Creation

*For any* valid physical room data submitted by an admin, creating the room SHALL produce a new record with the hotel_id matching the admin's session hotel_id and the specified room_type_id.

**Validates: Requirements 11.7**

### Property 20: Room Status Update

*For any* physical room, when an admin changes the status or housekeeping status, the system SHALL immediately update the corresponding room record in the database with the new status value.

**Validates: Requirements 12.5**

### Property 21: Physical Room Update Persistence

*For any* valid physical room update data submitted by an admin, saving the changes SHALL update the corresponding room record in the database with the new values.

**Validates: Requirements 13.4**

### Property 22: Physical Room Deletion with Booking Check

*For any* physical room, if one or more booking records reference that room (via room_id), the system SHALL prevent deletion and return an error message. If no bookings reference the room, deletion SHALL succeed.

**Validates: Requirements 14.2, 14.3**

### Property 23: Room Type Images Display Ordering

*For any* room type with multiple images, the images SHALL be displayed ordered by sort_order in ascending order.

**Validates: Requirements 16.3**

### Property 24: Cover Image Reassignment on Deletion

*For any* room type, if the cover image (is_cover = true) is deleted and other images remain, the system SHALL automatically set is_cover = true for the first remaining image (by sort_order).

**Validates: Requirements 16.5**

### Property 25: Server Action Session Validation

*For any* Server Action invocation, the action SHALL validate that a valid session exists and extract the hotel_id from the session before performing any database operations.

**Validates: Requirements 17.2**

### Property 26: Consistent Error Response Format

*For any* Server Action that fails due to validation errors, database errors, or authorization issues, the action SHALL return an error object in the format `{ error: string }` with a descriptive error message.

**Validates: Requirements 4.7, 17.4**

### Property 27: Consistent Success Response Format

*For any* Server Action that completes successfully, the action SHALL return a success object in the format `{ success: true, data?: any }` optionally containing the updated or created data.

**Validates: Requirements 17.5**

### Property 28: Soft Delete Preservation

*For any* room type or physical room marked as inactive (is_active = false), the record SHALL remain in the database and be retrievable for historical reference, rather than being permanently deleted.

**Validates: Requirements 18.5**

### Property 29: Room Type Display Ordering

*For any* set of room types displayed for a hotel, the room types SHALL be ordered by created_at timestamp in descending order (newest first).

**Validates: Requirements 3.2**

### Property 30: Room Type Display Fields

*For any* room type displayed in the system, the rendered output SHALL include the name, base_price, and is_active status.

**Validates: Requirements 3.3**

### Property 31: All Room Type Images Display

*For any* room type with uploaded images, the system SHALL display all images associated with that room type in the gallery view.

**Validates: Requirements 16.1**

## Error Handling

### Validation Errors

**Client-Side Validation:**
- Form inputs validated before submission
- Real-time feedback for invalid inputs
- Prevent submission of invalid data

**Server-Side Validation:**
- All inputs re-validated in Server Actions
- Never trust client-side validation alone
- Return structured error messages

**Validation Rules:**
- Room type name: required, max 100 characters, unique per hotel
- Base price: required, positive decimal number
- Max guests: required, positive integer
- Room number: required, max 20 characters, unique per hotel
- Amenities: array of strings, each max 100 characters

### Database Errors

**Unique Constraint Violations:**
- Catch duplicate room type names within hotel
- Catch duplicate room numbers within hotel
- Return user-friendly error messages

**Foreign Key Violations:**
- Prevent deletion of room types with associated rooms
- Prevent deletion of rooms with associated bookings
- Display clear error messages explaining the constraint

**Connection Errors:**
- Handle Supabase connection failures gracefully
- Display generic error message to user
- Log detailed error for debugging

### Authorization Errors

**Unauthenticated Access:**
- Redirect to `/login` page
- Preserve intended destination for post-login redirect

**Insufficient Permissions:**
- Redirect to `/admin` dashboard
- Display permission denied message

**Cross-Hotel Access Attempts:**
- All queries filtered by session hotel_id
- Impossible to access other hotels' data
- Log suspicious activity

### Image Upload Errors

**File Size Limits:**
- Enforce maximum file size (e.g., 5MB)
- Display error before upload attempt
- Provide guidance on image optimization

**File Type Validation:**
- Accept only image formats (JPEG, PNG, WebP, GIF)
- Validate MIME type on server
- Reject invalid file types with clear message

**Upload Failures:**
- Handle network errors during upload
- Display retry option
- Preserve form data on failure

### Error Recovery

**Optimistic UI Updates:**
- Update UI immediately on user action
- Revert changes if Server Action fails
- Display error message and allow retry

**Form State Preservation:**
- Preserve form data on validation errors
- Allow user to correct errors without re-entering all data
- Highlight specific fields with errors

**Graceful Degradation:**
- Core functionality works without JavaScript
- Progressive enhancement for better UX
- Fallback to full page reloads if needed

## Testing Strategy

### Dual Testing Approach

The Room Types Management System requires both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests:**
- Specific examples demonstrating correct behavior
- Edge cases (empty states, boundary values)
- Error conditions (invalid inputs, constraint violations)
- Integration points between components
- UI interactions and state management

**Property-Based Tests:**
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Validation rules across all scenarios
- Data integrity constraints
- Multi-tenant isolation guarantees

### Property-Based Testing Configuration

**Library Selection:**
- **JavaScript/TypeScript:** Use `fast-check` library
- Minimum 100 iterations per property test
- Configurable seed for reproducible failures

**Test Structure:**
Each property test must:
1. Reference the design document property number
2. Use descriptive test names matching property titles
3. Include comment tag: `Feature: room-types-management, Property {N}: {property_text}`
4. Generate random valid inputs using arbitraries
5. Assert the property holds for all generated inputs

**Example Property Test:**

```typescript
import fc from 'fast-check';

// Feature: room-types-management, Property 2: Room Type Name Uniqueness
test('room type names must be unique within a hotel', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.uuid(), // hotel_id
      fc.string({ minLength: 1, maxLength: 100 }), // room type name
      async (hotelId, name) => {
        // Create first room type with name
        const first = await createRoomType({ hotel_id: hotelId, name });
        expect(first.success).toBe(true);
        
        // Attempt to create second room type with same name
        const second = await createRoomType({ hotel_id: hotelId, name });
        expect(second.error).toBeDefined();
        expect(second.error).toContain('unique');
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Component Tests:**
- Test RoomTypesEditor rendering with various data states
- Test RoomTypeForm validation and submission
- Test ImageUploadInput file handling and preview
- Test PhysicalRoomsManager CRUD operations
- Test inline editing state transitions

**Server Action Tests:**
- Test authentication and authorization checks
- Test input validation and error messages
- Test database operations with mocked Supabase client
- Test revalidatePath calls for cache invalidation
- Test error handling for various failure scenarios

**Integration Tests:**
- Test complete room type creation flow
- Test image upload and cover image selection
- Test room type deletion with referential integrity
- Test physical room creation and status updates
- Test multi-tenant data isolation

### Test Data Generation

**Arbitraries for Property Tests:**

```typescript
// Room Type arbitrary
const roomTypeArbitrary = fc.record({
  hotel_id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 1000 })),
  base_price: fc.float({ min: 0.01, max: 100000, noNaN: true }),
  max_guests: fc.integer({ min: 1, max: 20 }),
  amenities: fc.array(fc.string({ maxLength: 100 }), { maxLength: 20 }),
  is_active: fc.boolean()
});

// Physical Room arbitrary
const physicalRoomArbitrary = fc.record({
  hotel_id: fc.uuid(),
  room_type_id: fc.uuid(),
  room_number: fc.string({ minLength: 1, maxLength: 20 }),
  floor: fc.option(fc.string({ maxLength: 10 })),
  status: fc.constantFrom('available', 'occupied', 'maintenance', 'out_of_order'),
  housekeeping: fc.constantFrom('clean', 'dirty', 'in_progress', 'inspected', 'out_of_service'),
  notes: fc.option(fc.string({ maxLength: 500 })),
  is_active: fc.boolean()
});
```

### Coverage Goals

- **Line Coverage:** Minimum 80%
- **Branch Coverage:** Minimum 75%
- **Property Coverage:** 100% of identified properties tested
- **Critical Paths:** 100% coverage for authentication, authorization, and data isolation

### Test Execution

**Local Development:**
```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode for development
npm test -- --coverage     # Generate coverage report
```

**CI/CD Pipeline:**
- Run all tests on every pull request
- Fail build if coverage drops below thresholds
- Run property tests with fixed seed for consistency
- Generate and publish coverage reports

### Mocking Strategy

**Supabase Client:**
- Mock database queries for unit tests
- Use test database for integration tests
- Mock authentication for component tests

**File Upload API:**
- Mock `/api/cms/upload-image` responses
- Test both success and failure scenarios
- Verify correct parameters sent to API

**Session:**
- Mock `getSession()` for different user roles
- Test authentication and authorization flows
- Verify hotel_id extraction and usage

