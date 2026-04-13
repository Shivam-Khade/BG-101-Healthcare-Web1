# MediConnect — Patient Portal
## Participant Documentation

---

## What You Need to Build

This repo has the **complete frontend** for a healthcare patient portal. Your job is to build the **backend (server + database)** that makes it work.

The frontend is already wired up — every button, form, and page makes API calls to your server. You just need to handle those calls and return the right data.

---

## Getting Started

**Step 1** — Clone this repo and open `index.html` in a browser
**Step 2** — Use the demo credentials below to explore all pages (no backend needed for preview)
**Step 3** — Open `js/app.js` and update the base URL to point to your server:

```
const API = 'http://localhost:8000/api';   ← change this to your server address
```

**Step 4** — Build your backend to handle the API calls described in this document

---

## Demo Credentials

Use these to preview the frontend without a backend running:

| Field    | Value              |
|----------|--------------------|
| Email    | patient@demo.com   |
| Password | demo123            |

---

## Tech Stack

You can use **any** backend language or framework:

- Node.js (Express / Fastify)
- Python (Django / FastAPI / Flask)
- Java (Spring Boot)
- PHP (Laravel)
- Go, Ruby, etc.

**Database:** MySQL, PostgreSQL, MongoDB, Firebase — your choice.

---

## How the Frontend Talks to Your Backend

Every request the frontend makes includes a **token** in the header to identify the logged-in user:

```
Authorization: Bearer <token>
```

Your login endpoint must return this token. The frontend saves it and sends it with every future request automatically.

---

## Important Rules

- Your login API **must** return a field named `token` — the frontend looks for this exact name
- All dates must be in this format: `2026-04-15` (YYYY-MM-DD)
- Enable **CORS** on your server — the frontend runs from a different origin
- For file uploads, your endpoint must accept `multipart/form-data`
- When something goes wrong, return an error with a `message` field explaining what happened

---

## How to Read This Document

Each feature below shows:

- **What it does** — plain English description
- **Endpoints** — the URL and method the frontend calls
- **What to receive** — fields the frontend sends to your server
- **What to return** — fields your server must send back

---

---

# Feature 1 — Login & Register

**Page:** `index.html`

Patients create an account or sign in. After a successful login or registration, your server must return a token. The frontend uses this token for all future requests.

---

### Register a New Patient

**Frontend calls:** `POST /api/auth/register`

**Your server receives these fields:**

| Field        | Type   | Description                  |
|--------------|--------|------------------------------|
| name         | text   | Patient's full name          |
| email        | email  | Patient's email address      |
| password     | text   | Chosen password              |
| phone        | text   | Phone number                 |
| dob          | date   | Date of birth (YYYY-MM-DD)   |
| gender       | text   | Male / Female / Other        |
| blood_group  | text   | e.g. B+, O-, AB+             |

**Your server must return:**

| Field       | Type   | Description                        |
|-------------|--------|------------------------------------|
| token       | text   | Auth token for future requests     |
| user.id     | number | Unique ID of the new patient       |
| user.name   | text   | Patient's name                     |
| user.email  | text   | Patient's email                    |

---

### Login

**Frontend calls:** `POST /api/auth/login`

**Your server receives:**

| Field    | Type  | Description       |
|----------|-------|-------------------|
| email    | email | Patient's email   |
| password | text  | Patient's password|

**Your server must return:**

| Field       | Type   | Description                    |
|-------------|--------|--------------------------------|
| token       | text   | Auth token                     |
| user.id     | number | Patient's ID                   |
| user.name   | text   | Patient's name                 |
| user.email  | text   | Patient's email                |

> If the email or password is wrong, return an error with `message: "Invalid email or password"`

---

### Other Auth Endpoints

| Endpoint            | Method | What it does                          |
|---------------------|--------|---------------------------------------|
| /api/auth/logout    | POST   | End the session (invalidate token)    |
| /api/auth/me        | GET    | Return the logged-in patient's info   |

---

---

# Feature 2 — Dashboard

**Page:** `dashboard.html`

The first page patients see after logging in. Shows a summary of their health activity — upcoming appointments, active prescriptions, recent lab reports, and health stats.

---

**Frontend calls:** `GET /api/dashboard`

**Your server must return:**

### Stats section (shown as 4 cards at the top)

| Field                          | Type   | Description                          |
|--------------------------------|--------|--------------------------------------|
| stats.upcoming_appointments    | number | Count of upcoming appointments       |
| stats.active_prescriptions     | number | Count of active prescriptions        |
| stats.lab_reports              | number | Total lab reports                    |
| stats.pending_bills            | number | Count of unpaid bills                |

### Health summary section

| Field                        | Type | Description              |
|------------------------------|------|--------------------------|
| health_summary.blood_pressure| text | e.g. 120/80 mmHg         |
| health_summary.blood_sugar   | text | e.g. 95 mg/dL            |
| health_summary.heart_rate    | text | e.g. 72 bpm              |
| health_summary.blood_group   | text | e.g. B+                  |
| health_summary.weight        | text | e.g. 68 kg               |
| health_summary.height        | text | e.g. 165 cm              |

### Upcoming appointments list (up to 3 shown)

| Field                             | Type | Description                         |
|-----------------------------------|------|-------------------------------------|
| upcoming_appointments[].id        | number | Appointment ID                    |
| upcoming_appointments[].doctor_name | text | Doctor's name                   |
| upcoming_appointments[].specialty | text | Doctor's specialty                 |
| upcoming_appointments[].date      | date | Appointment date                   |
| upcoming_appointments[].time      | text | e.g. 10:00 AM                      |
| upcoming_appointments[].type      | text | In-clinic / Online                 |
| upcoming_appointments[].status    | text | confirmed / pending                |

### Active prescriptions list (up to 3 shown)

| Field                             | Type | Description              |
|-----------------------------------|------|--------------------------|
| active_prescriptions[].id         | number | Prescription ID        |
| active_prescriptions[].doctor_name| text | Doctor's name           |
| active_prescriptions[].date       | date | Date issued             |
| active_prescriptions[].medicines  | list | At least: `[{ name }]` |

### Recent lab reports (up to 3 shown)

| Field                   | Type   | Description                  |
|-------------------------|--------|------------------------------|
| recent_labs[].id        | number | Report ID                    |
| recent_labs[].test_name | text   | e.g. CBC, Lipid Profile      |
| recent_labs[].date      | date   | Date of test                 |
| recent_labs[].status    | text   | Normal / Abnormal            |

---

---

# Feature 3 — Find Doctors

**Page:** `doctors.html`

Patients search for doctors by name or specialty, filter by availability, and book an appointment directly from this page.

---

### Get list of specialties (for the filter dropdown)

**Frontend calls:** `GET /api/doctors/specialties`

**Your server must return a list where each item has:**

| Field | Type   | Description             |
|-------|--------|-------------------------|
| id    | number | Specialty ID            |
| name  | text   | e.g. Cardiology, ENT    |

---

### Search doctors

**Frontend calls:** `GET /api/doctors`

**The frontend may send these as URL filters:**

| Filter     | Type | Description                                    |
|------------|------|------------------------------------------------|
| search     | text | Doctor name or specialty keyword               |
| specialty  | text | Filter by specialty                            |
| location   | text | Online or In-clinic                            |
| sort       | text | rating / fee_asc / fee_desc / experience       |

**Your server must return a list where each doctor has:**

| Field        | Type   | Description                        |
|--------------|--------|------------------------------------|
| id           | number | Doctor's ID                        |
| name         | text   | Doctor's full name                 |
| specialty    | text   | e.g. General Medicine              |
| experience   | number | Years of experience                |
| rating       | number | e.g. 4.7 (out of 5)               |
| fee          | number | Consultation fee in ₹              |
| availability | text   | e.g. Mon–Fri                       |
| tags         | list   | List of specialties/keywords       |

---

### Get one doctor's full profile

**Frontend calls:** `GET /api/doctors/:id`

**Your server must return:**

| Field        | Type   | Description                             |
|--------------|--------|-----------------------------------------|
| id           | number | Doctor's ID                             |
| name         | text   | Full name                               |
| specialty    | text   | Specialization                          |
| experience   | number | Years of experience                     |
| rating       | number | Rating out of 5                         |
| reviews      | number | Number of reviews                       |
| fee          | number | Consultation fee in ₹                   |
| bio          | text   | Short professional description          |
| license_no   | text   | Medical license number                  |
| availability | text   | Working hours description               |
| hospital     | text   | Hospital or clinic name                 |

---

### Get available time slots for a doctor

**Frontend calls:** `GET /api/doctors/:id/slots?date=2026-04-15`

**Your server must return a list of slots:**

| Field     | Type    | Description                  |
|-----------|---------|------------------------------|
| time      | text    | e.g. 09:00 AM                |
| available | boolean | true = free, false = booked  |

---

---

# Feature 4 — Appointments

**Page:** `appointments.html`

Patients can book new appointments, view upcoming and past ones, reschedule, and cancel.

---

### Book an appointment

**Frontend calls:** `POST /api/appointments`

**Your server receives:**

| Field      | Type   | Description                        |
|------------|--------|------------------------------------|
| doctor_id  | number | ID of the selected doctor          |
| date       | date   | Requested date                     |
| time       | text   | Requested time slot                |
| type       | text   | in-clinic or online                |
| reason     | text   | Patient's reason for visiting      |

**Your server must return:**

| Field   | Type   | Description                          |
|---------|--------|--------------------------------------|
| id      | number | New appointment ID                   |
| status  | text   | pending (doctor needs to confirm)    |
| message | text   | Confirmation message                 |

---

### Get appointments list

**Frontend calls:** `GET /api/appointments?status=upcoming`

The `status` filter can be: `upcoming`, `past`, or `cancelled`

**Your server must return a list where each appointment has:**

| Field              | Type   | Description                            |
|--------------------|--------|----------------------------------------|
| id                 | number | Appointment ID                         |
| doctor_name        | text   | Doctor's name                          |
| specialty          | text   | Doctor's specialty                     |
| date               | date   | Appointment date                       |
| time               | text   | Appointment time                       |
| consultation_type  | text   | in-clinic or online                    |
| reason             | text   | Patient's reason                       |
| status             | text   | pending / confirmed / completed        |
| cancel_reason      | text   | Reason (only for cancelled ones)       |
| cancelled_at       | date   | When it was cancelled                  |

---

### Reschedule an appointment

**Frontend calls:** `PUT /api/appointments/:id`

**Your server receives:**

| Field  | Type | Description              |
|--------|------|--------------------------|
| date   | date | New date                 |
| time   | text | New time slot            |
| reason | text | Reason for rescheduling  |

---

### Cancel an appointment

**Frontend calls:** `DELETE /api/appointments/:id`

No data is sent. Just delete or mark the appointment as cancelled.

---

### Get appointment consultation summary

**Frontend calls:** `GET /api/appointments/:id/summary`

**Your server must return:**

| Field     | Type | Description                       |
|-----------|------|-----------------------------------|
| diagnosis | text | What the doctor diagnosed         |
| notes     | text | Doctor's notes from the visit     |
| follow_up | text | e.g. 1 week, 1 month              |

---

---

# Feature 5 — Medical Records

**Page:** `medical-records.html`

Patients upload and view their own medical documents (reports, scans, discharge summaries, etc.).

---

### Get records list

**Frontend calls:** `GET /api/records?type=&search=`

**Your server must return a list where each record has:**

| Field      | Type   | Description                                |
|------------|--------|--------------------------------------------|
| id         | number | Record ID                                  |
| title      | text   | e.g. Blood Test - Jan 2026                 |
| type       | text   | Blood Test / X-Ray / Discharge Summary etc.|
| date       | date   | Date of the record                         |
| source     | text   | Hospital or lab name                       |
| notes      | text   | Any notes about the record                 |
| file_url   | text   | Link to view/download the file             |
| file_name  | text   | Original file name                         |
| created_at | date   | When it was uploaded                       |

---

### Upload a new record

**Frontend calls:** `POST /api/records`

This is a **file upload** request (multipart/form-data).

**Your server receives:**

| Field  | Type   | Required | Description                          |
|--------|--------|----------|--------------------------------------|
| title  | text   | Yes      | Name/title of the record             |
| type   | text   | Yes      | Category of the record               |
| date   | date   | Yes      | Date the record was created          |
| source | text   | No       | Hospital or doctor name              |
| notes  | text   | No       | Additional notes                     |
| file   | file   | No       | The document (PDF, JPG, PNG, DOC)    |

**Your server must return:**

| Field   | Type   | Description              |
|---------|--------|--------------------------|
| id      | number | ID of the new record     |
| message | text   | Success message          |

---

### Get one record's full details

**Frontend calls:** `GET /api/records/:id`

Returns all fields listed in the "Get records list" table above.

---

### Delete a record

**Frontend calls:** `DELETE /api/records/:id`

Delete the record and its file from storage.

---

---

# Feature 6 — Prescriptions

**Page:** `prescriptions.html`

Patients view prescriptions issued by their doctors. Patients **cannot create** prescriptions — only doctors can.

---

### Get prescriptions list

**Frontend calls:** `GET /api/prescriptions?status=active`

The `status` filter can be: `active` or `expired`

**Your server must return a list where each prescription has:**

| Field              | Type   | Description                                 |
|--------------------|--------|---------------------------------------------|
| id                 | number | Prescription ID                             |
| doctor_name        | text   | Name of the doctor who issued it            |
| specialty          | text   | Doctor's specialty                          |
| date               | date   | Date issued                                 |
| valid_until        | date   | Expiry date                                 |
| diagnosis          | text   | What it was prescribed for                 |
| status             | text   | active or expired                           |
| instructions       | text   | General instructions (e.g. take after meals)|
| medicines          | list   | List of medicines (see below)               |

**Each medicine in the list must have:**

| Field        | Type | Description                         |
|--------------|------|-------------------------------------|
| name         | text | Medicine name                       |
| strength     | text | e.g. 500mg                          |
| dosage       | text | e.g. 1 tablet                       |
| frequency    | text | e.g. Twice daily                    |
| duration     | text | e.g. 5 days                         |
| instructions | text | e.g. After meals                    |

---

### Get one full prescription

**Frontend calls:** `GET /api/prescriptions/:id`

Returns all the fields above for a single prescription.

---

---

# Feature 7 — Lab Reports

**Page:** `lab-reports.html`

Patients view diagnostic test results ordered by their doctors.

---

### Get lab reports list

**Frontend calls:** `GET /api/lab-reports?status=&from=&to=&search=`

**Filters the frontend may send:**

| Filter | Type | Description                          |
|--------|------|--------------------------------------|
| status | text | pending (not ready) or ready         |
| from   | date | Show reports from this date          |
| to     | date | Show reports up to this date         |
| search | text | Search by test name                  |

**Your server must return a list where each report has:**

| Field        | Type    | Description                              |
|--------------|---------|------------------------------------------|
| id           | number  | Report ID                                |
| test_name    | text    | e.g. CBC, Lipid Profile                  |
| doctor_name  | text    | Doctor who ordered the test              |
| date         | date    | Date the test was taken                  |
| status       | text    | pending or ready                         |
| has_abnormal | boolean | true if any result is outside normal range|
| results      | list    | List of test parameters (if ready)       |

**Each result in the list must have:**

| Field           | Type | Description                       |
|-----------------|------|-----------------------------------|
| parameter       | text | e.g. Haemoglobin, WBC Count       |
| value           | text | The measured value                |
| unit            | text | e.g. g/dL, mg/dL                  |
| reference_range | text | Normal range e.g. 13.5–17.5       |
| flag            | text | High / Low / null (null = Normal) |

---

### Get one full lab report

**Frontend calls:** `GET /api/lab-reports/:id`

Returns all the fields above plus:

| Field      | Type | Description                         |
|------------|------|-------------------------------------|
| lab_name   | text | Name of the diagnostic lab          |
| sample_type| text | e.g. Blood, Urine                   |
| file_url   | text | Link to download the PDF report     |
| remarks    | text | Pathologist's comments              |

---

---

# Feature 8 — Pharmacy

**Page:** `pharmacy.html`

Patients search for medicines, add them to a cart, and place a home delivery order.

---

### Search medicines

**Frontend calls:** `GET /api/medicines?search=&category=`

**Your server must return a list where each medicine has:**

| Field        | Type    | Description                            |
|--------------|---------|----------------------------------------|
| id           | number  | Medicine ID                            |
| name         | text    | Medicine name e.g. Paracetamol 500mg   |
| generic_name | text    | Generic/chemical name                  |
| dosage_form  | text    | Tablet / Syrup / Injection etc.        |
| category     | text    | e.g. Painkillers, Antibiotics          |
| price        | number  | Price in ₹                             |
| in_stock     | boolean | true = available, false = out of stock |
| manufacturer | text    | Company name                           |

---

### Place an order

**Frontend calls:** `POST /api/orders`

**Your server receives:**

| Field          | Type   | Description                              |
|----------------|--------|------------------------------------------|
| items          | list   | List of medicines and quantities         |
| items[].medicine_id | number | ID of the medicine                |
| items[].qty    | number | How many units ordered                   |
| address        | text   | Full delivery address                    |
| payment_method | text   | cod / online / upi                       |

**Your server must return:**

| Field              | Type   | Description                     |
|--------------------|--------|---------------------------------|
| order_id           | number | ID of the placed order          |
| total              | number | Total amount in ₹               |
| estimated_delivery | date   | Expected delivery date          |
| message            | text   | Confirmation message            |

---

### Get order history

**Frontend calls:** `GET /api/orders`

**Your server must return a list where each order has:**

| Field      | Type   | Description                                     |
|------------|--------|-------------------------------------------------|
| id         | number | Order ID                                        |
| item_count | number | Number of items in the order                    |
| total      | number | Total amount in ₹                               |
| status     | text   | processing / shipped / delivered / cancelled    |
| created_at | date   | When the order was placed                       |

---

---

# Feature 9 — Billing & Payments

**Page:** `billing.html`

Patients view invoices generated by doctors and make payments.

---

### Get bills list

**Frontend calls:** `GET /api/bills?status=&search=`

The `status` filter can be: `pending`, `paid`, or `overdue`

**Your server must return a list where each bill has:**

| Field        | Type   | Description                               |
|--------------|--------|-------------------------------------------|
| id           | number | Bill ID                                   |
| invoice_no   | text   | e.g. INV-2026-001                         |
| description  | text   | Short description of what was charged     |
| doctor_name  | text   | Doctor who generated the invoice          |
| date         | date   | Invoice date                              |
| due_date     | date   | Payment due date                          |
| amount       | number | Total amount in ₹                         |
| status       | text   | pending / paid / overdue                  |
| paid_at      | date   | When it was paid (null if not paid yet)   |
| payment_method | text | How it was paid (null if not paid yet)    |

---

### Get one invoice's full details

**Frontend calls:** `GET /api/bills/:id`

Returns all fields above plus:

| Field          | Type   | Description                           |
|----------------|--------|---------------------------------------|
| patient_name   | text   | Patient's name                        |
| items          | list   | Line items (what was charged for)     |
| items[].name   | text   | e.g. Consultation Fee, ECG Test       |
| items[].amount | number | Amount for that item in ₹             |

---

### Pay a bill

**Frontend calls:** `POST /api/bills/:id/pay`

**Your server receives:**

| Field          | Type | Description                          |
|----------------|------|--------------------------------------|
| payment_method | text | upi / card / netbanking / cash       |
| notes          | text | Optional transaction reference       |

**Your server must return:**

| Field   | Type | Description             |
|---------|------|-------------------------|
| message | text | Payment success message |
| status  | text | paid                    |

---

---

# Feature 10 — Profile

**Page:** `profile.html`

Patients view and update their personal and health information.

---

### Get profile

**Frontend calls:** `GET /api/profile`

**Your server must return:**

| Field      | Type   | Description                          |
|------------|--------|--------------------------------------|
| id         | number | Patient ID                           |
| name       | text   | Full name                            |
| email      | text   | Email address                        |
| phone      | text   | Phone number                         |
| dob        | date   | Date of birth                        |
| gender     | text   | Male / Female / Other                |
| blood_group| text   | e.g. B+                              |
| height     | number | Height in cm                         |
| weight     | number | Weight in kg                         |
| blood_pressure | text | e.g. 120/80 mmHg                |
| address    | text   | Home address                         |
| allergies  | text   | Known allergies                      |
| conditions | text   | Chronic conditions                   |

---

### Update profile

**Frontend calls:** `PUT /api/profile`

Accepts any subset of the fields listed above. Update only what is sent.

---

### Change password

**Frontend calls:** `PUT /api/profile/password`

**Your server receives:**

| Field            | Type | Description           |
|------------------|------|-----------------------|
| current_password | text | Their current password|
| new_password     | text | The new password      |

> If the current password is wrong, return an error: `message: "Current password is incorrect"`

---

### Delete account

**Frontend calls:** `DELETE /api/profile`

Permanently delete the patient and all their data.

---

---

# Feature 11 — Notifications

**Page:** `notifications.html`

Patients receive alerts for appointment updates, prescription issuance, lab results, bills, etc. Your backend should create notifications automatically when those events happen.

---

### Get all notifications

**Frontend calls:** `GET /api/notifications`

**Your server must return a list where each notification has:**

| Field      | Type    | Description                                                    |
|------------|---------|----------------------------------------------------------------|
| id         | number  | Notification ID                                                |
| type       | text    | appointment / prescription / lab / billing / emergency / system|
| title      | text    | Short heading e.g. "Appointment Confirmed"                     |
| message    | text    | Full message text                                              |
| is_read    | boolean | false = unread (shown highlighted), true = already seen        |
| created_at | date    | When the notification was created                              |

**When to automatically create notifications:**

| Event                           | Notification to send                           |
|---------------------------------|------------------------------------------------|
| Doctor confirms appointment     | "Your appointment has been confirmed"          |
| Doctor cancels appointment      | "Your appointment was cancelled"               |
| Doctor issues a prescription    | "New prescription available"                   |
| Lab results are ready           | "Your lab test results are ready"              |
| A new invoice is generated      | "You have a new bill from Dr. X"               |
| Appointment is rescheduled      | "Your appointment has been rescheduled"        |

---

### Mark one notification as read

**Frontend calls:** `PUT /api/notifications/:id/read`

No data is sent. Just mark that notification as read.

---

### Mark all notifications as read

**Frontend calls:** `PUT /api/notifications/read-all`

No data is sent. Mark every notification for this patient as read.

---

### Delete a notification

**Frontend calls:** `DELETE /api/notifications/:id`

---

---

# Feature 12 — Emergency SOS

**Page:** `emergency.html`

Patients can trigger an SOS alert, manage emergency contacts, and find nearby hospitals.

---

### Get emergency contacts

**Frontend calls:** `GET /api/emergency/contacts`

**Your server must return a list where each contact has:**

| Field      | Type    | Description                               |
|------------|---------|-------------------------------------------|
| id         | number  | Contact ID                                |
| name       | text    | Contact's full name                       |
| relation   | text    | e.g. Spouse, Parent, Sibling              |
| phone      | text    | Contact's phone number                    |
| is_primary | boolean | true = main contact (called first)        |

---

### Add an emergency contact

**Frontend calls:** `POST /api/emergency/contacts`

**Your server receives:**

| Field      | Type    | Required | Description                       |
|------------|---------|----------|-----------------------------------|
| name       | text    | Yes      | Contact's name                    |
| relation   | text    | Yes      | Relationship                      |
| phone      | text    | Yes      | Phone number                      |
| is_primary | boolean | No       | Set as the primary contact        |

---

### Update a contact

**Frontend calls:** `PUT /api/emergency/contacts/:id`

Accepts the same fields as adding a contact. Update only what is sent.

---

### Delete a contact

**Frontend calls:** `DELETE /api/emergency/contacts/:id`

---

### Trigger SOS alert

**Frontend calls:** `POST /api/emergency/sos`

**Your server receives:**

| Field     | Type   | Description                              |
|-----------|--------|------------------------------------------|
| latitude  | number | Patient's current latitude (from GPS)    |
| longitude | number | Patient's current longitude (from GPS)   |
| message   | text   | e.g. "Chest pain, difficulty breathing"  |

**What your server must do:**
- Notify all saved emergency contacts (SMS or any method)
- Include the patient's blood group, allergies, and conditions in the alert
- Log the SOS event with timestamp

**Your server must return:**

| Field    | Type   | Description                           |
|----------|--------|---------------------------------------|
| message  | text   | e.g. "SOS alert sent to 2 contacts"   |
| alert_id | text   | Unique ID for this SOS event          |

---

### Find nearby hospitals

**Frontend calls:** `GET /api/emergency/hospitals?lat=19.07&lng=72.87&radius=5`

**Query parameters sent by frontend:**

| Param  | Type   | Description                    |
|--------|--------|--------------------------------|
| lat    | number | Patient's current latitude     |
| lng    | number | Patient's current longitude    |
| radius | number | Search radius in km            |

**Your server must return a list where each hospital has:**

| Field    | Type   | Description                       |
|----------|--------|-----------------------------------|
| name     | text   | Hospital name                     |
| address  | text   | Full address                      |
| phone    | text   | Contact number                    |
| distance | number | Distance from patient in km       |

---

---

## Error Handling

Whenever something goes wrong, your server must return an appropriate HTTP status code and a `message` field:

| Situation                         | Status Code | Example message                    |
|-----------------------------------|-------------|------------------------------------|
| Wrong email or password           | 401         | Invalid email or password          |
| Missing required field            | 400         | Name is required                   |
| Record not found                  | 404         | Appointment not found              |
| Not logged in                     | 401         | Authentication required            |
| Trying to access someone else's data | 403     | Access denied                      |
| Something broke on the server     | 500         | Internal server error              |

---

## Evaluation Criteria

| What is checked                        | Weight |
|----------------------------------------|--------|
| All 12 features working correctly      | 40%    |
| API response fields match exactly      | 20%    |
| Login and auth working securely        | 15%    |
| Proper error messages returned         | 10%    |
| Clean, readable code                   | 10%    |
| Bonus: File upload working             | 5%     |

---

*MediConnect Patient Portal — BackForge Healthtech Competition*
