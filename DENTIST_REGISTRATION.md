# Dentist Registration Implementation

## Overview

The `DentistController::store()` method allows **admins only** to register new dentists in the system. This is protected by the role-based access control middleware.

## Access Control

- **Route**: `POST /dentists`
- **Middleware**: `auth`, `role:1` (Admin only)
- **Controller**: `DentistController::store()`

Only users with `role_id = 1` (Admin) can access this endpoint.

## Request Validation

### Required Fields

- `fname` - First name (string, max 255)
- `lname` - Last name (string, max 255)
- `gender` - Gender (Male, Female, or Other)
- `email` - Email address (must be unique)
- `password` - Password (with confirmation)

### Optional Fields

- `mname` - Middle name (string, max 255)
- `contact_number` - Contact number (must be unique if provided)
- `specialization_ids` - Array of specialization IDs
- `employment_status` - Employment status (Active or Un-hire, defaults to Active)
- `hire_date` - Hire date (defaults to current date)

## Example Request

### Using cURL

```bash
curl -X POST http://your-app.test/dentists \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "fname": "John",
    "mname": "Michael",
    "lname": "Doe",
    "gender": "Male",
    "email": "john.doe@clinic.com",
    "contact_number": "09171234567",
    "password": "SecurePassword123!",
    "password_confirmation": "SecurePassword123!",
    "specialization_ids": [1, 2],
    "employment_status": "Active",
    "hire_date": "2025-11-03"
  }'
```

### Using JavaScript (Inertia.js)

```javascript
import { router } from '@inertiajs/react';

const handleSubmit = (data) => {
    router.post('/dentists', {
        fname: data.fname,
        mname: data.mname,
        lname: data.lname,
        gender: data.gender,
        email: data.email,
        contact_number: data.contact_number,
        password: data.password,
        password_confirmation: data.password_confirmation,
        specialization_ids: data.specialization_ids,
        employment_status: data.employment_status,
        hire_date: data.hire_date,
    });
};
```

## What Happens Behind the Scenes

### 1. User Creation

A new user record is created with:

- `role_id = 2` (Dentist role)
- `must_change_password = true` (forces password change on first login)
- `email_verified_at = null` (email not verified initially)
- Hashed password

### 2. Dentist Profile Creation

A profile record is created in `dentist_profiles` table with:

- Reference to the user
- Employment status
- Hire date
- Tracking fields (archived_at, soft deletes)

### 3. Specialization Assignment

If specialization IDs are provided, the dentist is linked to those specializations via the `dentist_specialization` pivot table.

### 4. Admin Activity Logging

An audit log entry is created in `admin_audit` table tracking:

- Admin who performed the action
- Activity details
- Target dentist information
- IP address and user agent
- Timestamp

### 5. Transaction Safety

All database operations are wrapped in a transaction, ensuring:

- All-or-nothing execution
- Automatic rollback on errors
- Data consistency

## Response Handling

### Success

- Redirects to `dentists.index` route
- Flash message: "Dentist registered successfully."

### Failure

- Redirects back to previous page
- Returns validation errors or exception message
- Preserves form input data

## Security Features

### 1. Role-Based Access Control

```php
Route::middleware(['auth', 'role:1'])->group(function () {
    Route::post('/dentists', [DentistController::class, 'store']);
});
```

### 2. Password Security

- Uses Laravel's Password validation rules
- Requires confirmation
- Hashed using bcrypt
- Forces password change on first login

### 3. Data Validation

- All inputs validated
- Email uniqueness enforced
- Contact number uniqueness enforced
- Specialization IDs verified against database

### 4. Audit Trail

Every dentist creation is logged with:

- Admin ID
- Action details
- Before/after values
- IP address and user agent

## Database Structure

### Tables Involved

1. **users** - Main user account
2. **dentist_profiles** - Dentist-specific information
3. **dentist_specialization** - Pivot table for specializations
4. **admin_audit** - Activity logging

### Relationships

```
User (role_id = 2)
  ├─ has one DentistProfile
  └─ belongs to many Specializations

DentistProfile
  └─ belongs to User
```

## Models Created/Updated

### New Models

1. **Role** (`app/Models/Role.php`)
    - Manages user roles
    - Relationship with users

2. **DentistProfile** (`app/Models/DentistProfile.php`)
    - Dentist-specific information
    - Soft deletes enabled
    - Relationship with User model

### Updated Models

1. **User** (`app/Models/User.php`)
    - Added fillable fields: `contact_number`, `must_change_password`, `email_verified_at`
    - Added relationships: `role()`, `dentistProfile()`, `specializations()`
    - Added helper methods: `isAdmin()`, `isDentist()`

## Testing the Endpoint

### 1. Login as Admin

```php
// Seed an admin user
php artisan db:seed --class=UserSeeder
// Login with: admin@example.com / user_0001
```

### 2. Get Specialization IDs

```php
// Check available specializations
php artisan tinker
>>> App\Models\Specialization::all(['id', 'name']);
```

### 3. Create a Dentist

Submit a POST request to `/dentists` with the required data.

### 4. Verify Creation

```php
php artisan tinker
>>> App\Models\User::where('role_id', 2)->with('dentistProfile', 'specializations')->get();
```

## Error Scenarios

### 1. Unauthorized Access (Non-Admin User)

- **Response**: 403 Forbidden
- **Message**: "Unauthorized access."

### 2. Validation Errors

- **Response**: 422 Unprocessable Entity
- **Example**: Email already exists

### 3. Database Errors

- **Response**: Redirects back with error message
- **Action**: Transaction rolled back, no partial data saved

## Next Steps

Consider implementing:

1. **Create view** - Form for registering dentists
2. **Edit functionality** - Update dentist information
3. **Email verification** - Send verification email to new dentists
4. **Welcome email** - Notify dentists of account creation
5. **Bulk import** - Import multiple dentists from CSV
6. **Profile photo** - Add avatar upload functionality
7. **Deactivation** - Soft delete or archive dentists
