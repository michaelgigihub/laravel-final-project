## Others

Seeders:

- ensure na may seeders for dependencies: specialization, treatment & teeth. para di na mag-initial setup admin

## Authentication & User Management

- Login (Admin/Dentist)
- Validations: use built in function of laravel fortify
    - if account = new: display the change pass since they need to change default pass before full access.
- Logout
    - Validations: use built in function of laravel fortify
- Register Admin (Admin only)
    - Email
    - First name
    - Middle name (optional)
    - Last name
    - Phone number
    - Gender
    - Avatar (optional)
    - Specialization/s
    - Generate default Password (lastname_{last 4 digit of phone number}
- Register Dentist (Admin only)
    - Fields:
        - First name
        - Middle name (optional)
        - Last name
        - Phone number
        - Gender
        - Generate default Password (lastname_{last 4 digit of phone number}
- Reset Password via Email
    - Via hyperlink → click → reset password page
- Change Password (Forgot Password)
    - Validations (e.g. valid token): use built in function of laravel fortify
    - new pass ≠ current password
    - After:
        - After success, log out all other sessions for security.
- Change Password (In Profile)
- Auth before change:
    - You verify their current password.
    - If it matches, update to the new one.
    - If not, show an error message.
    - After success, optionally log out all other sessions for security.
- During change:
    - new pass ≠ current password
- After:
    - After success,  log out all other sessions for security.

---

## Admin Dashboard

- Admin log
    - search, filter, paginate
- Create Dentist Specialization types
- Create Appointment Treatment types
- View Total Patients Count
- View Total Appointments Count
- View Upcoming Appointments in calendar view

---

## Patient Management (Admin & Dentist)

- Add Patient
    - First name
    - Middle name (optional)
    - Last name
    - Phone number
    - Gender
    - Birthdate
    - Address (one line only like user will input “Sampaloc, Manila”)
- Edit Patient
    - same fields with add patient
- View Patient Details
- List All Patients in table view
    - Search, filter, paginate list all Patient
- View Patient Medical History (Treatment Records)
- EXCEPT: dentist cannot view& edit system users (fellow dentists & admins)

---

## Dentist Management (Admin Only)

<aside>

**Dentist Employment Statuses:**

1. Active
2. Un-hire
</aside>

- **Register Dentist**
    - Check *register dentist* in user management section
- **Edit Dentist** (**EXCEPTION**: dentist can edit own profile)
    - Same fields as *register dentist* but with change stat
    - Admin can edit any dentist; a dentist can only edit own profile
- **View Dentist Full Profile/Details**
    - If Admin: can view all dentists
    - **EXCEPTION** If Dentist: view own profile
    - Profile shows: name, contact, status (active/archived), specializations, login role, hire date, etc
- **Un-hire Dentists (Soft Delete / Archive)**
    - Action to mark dentist as archived/un-hired
    - Result: dentist cannot login & cannot perform operations
    - Retain archived profile for record/history
- **List All Dentists in Table View**
    - Columns: Name | Contact | Specialization(s) | Status (Active / Archived) | Actions
    - Search bar: by name or specialization
    - Filters: Status dropdown (Active / Archived), Specialization dropdown
    - Pagination for large lists
    - Tabs or toggle: “Active Dentists” / “Archived Dentists”
- **Assign Dentist Specialization** (Under Register & Edit Dentist)
    - Multi-select list: Specializations (e.g., Orthodontics, Pediatric Dentistry, etc)
    - Admin chooses specialization(s) when registering or editing

---

## Dental Clinic Availability Management (Actors: Admin)

<aside>
💡

**Context**: The Admin controls the master schedule of the dental clinic. All dentists inherit this availability automatically. Changes at the clinic level affect every dentist’s available booking slots, ensuring consistent operational hours and preventing scheduling conflicts.

</aside>

- View clinic availability in calendar view
- Add Clinic Availability
    - Define available days (e.g., Monday–Saturday).
    - Set clinic-wide open and close times per day (e.g., 9:00 AM – 6:00 PM).
- Edit Clinic Availability
    - Modify existing availability settings.
    - Validate for overlapping or inconsistent time range
- Remove/Disable Clinic Availability
    - Temporarily mark specific days as “closed” (e.g., holidays, maintenance).
    - Option to delete specific day/time entries permanently.

---

## Appointment Management (Actors: Admin & Dentist)

<aside>

**Statuses:**

1. Scheduled
2. Completed
3. Cancelled
</aside>

- **Validations:** A clinic availability should exist first before appointment
- **Create Appointment**
    - Dropdown or autocomplete: Patient (search by name / id)
    - Dropdown or autocomplete: Dentist (search by name / id)
    - Date & Time picker: Appointment Date & Time (only slots where clinic availability exists)
        - Validation: no overlapping appointment that belong to the same patient
    - Multi-select / checkbox list: Treatment Type(s)
    - Text input: Purpose of the appointment (optional)
    - Button: Save / Create Appointment
    - Cancel button: Back / Close
    - After saving, status = Scheduled
- **List All Appointments – Calendar View**
    - Search bar: patient name OR dentist name
    - Filters: Date range selector, Dentist dropdown, Patient dropdown, Status dropdown
    - Calendar View: Monthly (or weekly) grid showing appointments by day/time.
        - Each appointment cell shows: time, patient name initials, dentist name (short), Colour‐coded by status
        - Clicking a cell opens Appointment Details. (*refer to view appoinment details*)
    - At bottom or toolbar: "New Appointment" button. (*refer to create appointment*)
- **View Appointment Details**
    - Page or modal showing full details:
        - Patient: name, contact, status (active/resigned)
        - Dentist: name
        - Appointment Date & Time
        - Treatment types selected
        - Purpose (if any)
        - Current Status (Scheduled / Completed / Cancelled)
        - Creation timestamp
        - Show *patient’s treatment records* in table view (*refer to appointment treatment records #2*)
            - If no treatment record exists yet → this button launches “Create Treatment Record” flow linked to this appointment.
            - If exists → display treat rec
        - Edit button (refer to edit appointment)
        - Cancel button (refer to cancel appointment)
        - Back to calendar view button.
- **Edit Appointment**
    - Use same form as Create, but pre-populate with existing data.
    - Fields editable: same with create fields EXCEPT patient.
    - Additional: show current status (readonly).
    - Button: Save Changes
    - Button: Cancel (to abort edits)
    - If changing date/time or dentist: again validate against availability.
- **Cancel Appointment**
    - Modal appears:
        - Text input: Reason for cancellation (required)
        - Buttons: Confirm Cancel / Abort
    - After confirmation: appointment status changes to “Cancelled”, remark recorded (reason).

---

## Appointment Treatment Records (Actor: Admin)

<aside>
💡

**Context**: The full detail of the appointment. Like full detail of the patient, treatment/s selected, etc.

</aside>

1. **Condition:** This can be fill up after creating the appointment and after the appointment.
2. **View Patient’s Treatment Record**
    - Same display with *3.1* *View/Edit Treatment Record*
3. **View Treatment History in table view**
    - **Table View**
        
        | Patient | Dentist | Appointment Date | Treatment Type | Notes | Actions |
        
    - **Filters:**
        - Date range
        - Dentist
        - Treatment type
    - **Search bar:** for patient or treatment name
    - **Action icons:**
        - 3.1 View/Edit Treatment Record (opens **A** modal)
        - View teeth reference
        - View file
    - **A Modal:**
        - Upload File (Optional)
        - Add Treatment Notes (Optional)
        - Select tooth (on selected treatment such as dental filling)
            - References for tooth mapping: TBD
            - Optional if kaya ng time: Sa admin dasboard, pwede magtoggle ng “include teeth ref” per treatment.

---

## Dentist Dashboard

- View my upcoming & today appointments in calendar view
    - Search, filter, paginate (if possible)
- View clinic availability in calendar view
- View my total appointments
- View My Recent Treatments
    - Search, filter, paginate

---

- Archive
    
    Reports & Analytics
    
    - Generate Patient Report
    - Generate Appointment Report
    - Generate Treatment Report
    - Export Reports to PDF
    - Filter Reports by Date Range
    
    ---
    
    Additional Features
    
    - Email Appointment Reminders
    - SMS Notifications (optional)
    - Search Functionality (global)
    - Data Validation on Forms
    - Soft Delete for Records
    - Database Backup (Admin only)