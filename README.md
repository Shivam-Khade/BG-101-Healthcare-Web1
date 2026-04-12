# MediConnect — Patient Portal
## Backend Competition Documentation

---

## Overview

This repository contains the **complete frontend** for the MediConnect Patient Portal — a healthcare web application. Your task as a participant is to **build the backend** that powers this frontend.

The frontend is built with plain HTML, CSS, and JavaScript. All API calls are made via `fetch()` in `js/app.js`. You do not need to touch the frontend code.

---

## Quick Start

1. Clone this repo
2. Open `index.html` in a browser — use **Demo Credentials** to preview all pages without a backend
3. Set your backend base URL in `js/app.js`:
   ```js
   const API = 'http://localhost:8000/api'; // change to your server
   ```
4. Build your backend to match the API contract below

---

## Demo Credentials (Frontend Preview)

| Field    | Value               |
|----------|---------------------|
| Email    | `patient@demo.com`  |
| Password | `demo123`           |

> These bypass the API. Remove or disable in production.

---

## Tech Stack (Your Choice)

You may use any backend technology:
- Node.js (Express / Fastify)
- Python (Django / FastAPI / Flask)
- Java (Spring Boot)
- PHP (Laravel)
- Go, Ruby, etc.

**Database:** Any relational (MySQL, PostgreSQL) or NoSQL (MongoDB) database.

---

## Authentication

All protected routes must receive a **Bearer token** in the request header:

```
Authorization: Bearer <token>
```

The token is stored in `localStorage` as `patient_token` after login.

---

## API Endpoints — Full Reference

---

### 1. Authentication (Login / Register)

**Page:** `index.html`

This is the entry point. Patients can create an account or log in.

---

#### POST `/api/auth/register`

Register a new patient account.

**Request Body:**
```json
{
  "name": "Priya Mehta",
  "email": "priya@email.com",
  "password": "securepass123",
  "phone": "+91 9876543210",
  "dob": "1995-06-15",
  "gender": "Female",
  "blood_group": "B+"
}
```

**Expected Response `200`:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "Priya Mehta",
    "email": "priya@email.com",
    "blood_group": "B+",
    "gender": "Female"
  }
}
```

---

#### POST `/api/auth/login`

**Request Body:**
```json
{
  "email": "priya@email.com",
  "password": "securepass123"
}
```

**Expected Response `200`:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "Priya Mehta",
    "email": "priya@email.com"
  }
}
```

**Error Response `401`:**
```json
{ "message": "Invalid email or password" }
```

---

#### POST `/api/auth/logout`

Invalidate the token server-side (if using token blacklisting).

---

#### GET `/api/auth/me`

Returns the currently logged-in patient's basic info.

**Response `200`:**
```json
{
  "id": 1,
  "name": "Priya Mehta",
  "email": "priya@email.com"
}
```

---

### 2. Dashboard

**Page:** `dashboard.html`

Displays a summary of the patient's health activity.

---

#### GET `/api/dashboard`

**Expected Response `200`:**
```json
{
  "stats": {
    "upcoming_appointments": 2,
    "active_prescriptions": 3,
    "lab_reports": 5,
    "pending_bills": 1
  },
  "health_summary": {
    "blood_pressure": "120/80 mmHg",
    "blood_sugar": "95 mg/dL",
    "heart_rate": "72 bpm",
    "blood_group": "B+",
    "weight": "68 kg",
    "height": "165 cm"
  },
  "upcoming_appointments": [
    {
      "id": 1,
      "doctor_name": "Dr. Arjun Sharma",
      "specialty": "General Medicine",
      "date": "2026-04-15",
      "time": "10:00 AM",
      "type": "In-clinic",
      "status": "confirmed"
    }
  ],
  "active_prescriptions": [
    {
      "id": 1,
      "doctor_name": "Dr. Arjun Sharma",
      "date": "2026-04-10",
      "medicines": [{ "name": "Paracetamol" }]
    }
  ],
  "recent_labs": [
    {
      "id": 1,
      "test_name": "CBC",
      "date": "2026-04-08",
      "status": "Normal"
    }
  ]
}
```

---

### 3. Find Doctors

**Page:** `doctors.html`

Patients search for and book appointments with doctors.

---

#### GET `/api/doctors/specialties`

Returns list of available specialties for the filter dropdown.

**Response `200`:**
```json
[
  { "id": 1, "name": "General Medicine" },
  { "id": 2, "name": "Cardiology" },
  { "id": 3, "name": "Dermatology" }
]
```

---

#### GET `/api/doctors`

**Query Parameters:**

| Param      | Type   | Description                         |
|------------|--------|-------------------------------------|
| `search`   | string | Search by name or specialty         |
| `specialty`| string | Filter by specialty name or ID      |
| `location` | string | `"Online"` or `"In-clinic"`         |
| `sort`     | string | `rating`, `fee_asc`, `fee_desc`, `experience` |

**Response `200`:**
```json
[
  {
    "id": 1,
    "name": "Dr. Arjun Sharma",
    "specialty": "General Medicine",
    "experience": 8,
    "rating": 4.7,
    "fee": 500,
    "availability": "Mon–Fri",
    "tags": ["General Medicine", "Diabetes", "Hypertension"],
    "in_clinic": true,
    "online": true
  }
]
```

---

#### GET `/api/doctors/:id`

Returns detailed profile of a single doctor.

**Response `200`:**
```json
{
  "id": 1,
  "name": "Dr. Arjun Sharma",
  "specialty": "General Medicine",
  "experience": 8,
  "rating": 4.7,
  "reviews": 134,
  "fee": 500,
  "bio": "Senior physician with expertise in diabetes management...",
  "license_no": "MCI-12345",
  "availability": "Mon–Fri, 9AM–5PM",
  "hospital": "City Health Clinic"
}
```

---

#### GET `/api/doctors/:id/slots`

Returns available time slots for a doctor on a specific date.

**Query Parameters:** `?date=2026-04-15`

**Response `200`:**
```json
{
  "slots": [
    { "time": "09:00 AM", "available": true },
    { "time": "09:30 AM", "available": false },
    { "time": "10:00 AM", "available": true }
  ]
}
```

---

### 4. Appointments

**Page:** `appointments.html`

Patients view, book, reschedule, and cancel appointments.

---

#### POST `/api/appointments`

Book a new appointment.

**Request Body:**
```json
{
  "doctor_id": 1,
  "date": "2026-04-15",
  "time": "10:00 AM",
  "type": "in-clinic",
  "reason": "Fever and headache for 3 days"
}
```

**Response `201`:**
```json
{
  "id": 10,
  "status": "pending",
  "message": "Appointment request sent to doctor"
}
```

---

#### GET `/api/appointments`

**Query Parameters:** `?status=upcoming` | `past` | `cancelled`

**Response `200`:**
```json
{
  "appointments": [
    {
      "id": 10,
      "doctor_name": "Dr. Arjun Sharma",
      "specialty": "General Medicine",
      "date": "2026-04-15",
      "time": "10:00 AM",
      "type": "In-clinic",
      "consultation_type": "in-clinic",
      "reason": "Fever and headache",
      "status": "confirmed",
      "cancel_reason": null,
      "cancelled_at": null
    }
  ]
}
```

---

#### GET `/api/appointments/:id`

Returns details of a single appointment.

---

#### PUT `/api/appointments/:id`

Reschedule an appointment.

**Request Body:**
```json
{
  "date": "2026-04-20",
  "time": "11:00 AM",
  "reason": "Conflict with work schedule"
}
```

---

#### DELETE `/api/appointments/:id`

Cancel an appointment. The frontend sends no body — you may optionally accept a `reason` query param.

---

#### GET `/api/appointments/:id/summary`

Returns post-consultation summary.

**Response `200`:**
```json
{
  "diagnosis": "Viral fever",
  "notes": "Rest for 3 days, stay hydrated",
  "follow_up": "1 week"
}
```

---

### 5. Medical Records

**Page:** `medical-records.html`

Patients upload and view their personal medical documents.

---

#### GET `/api/records`

**Query Parameters:** `?type=&search=`

**Response `200`:**
```json
{
  "records": [
    {
      "id": 1,
      "title": "Blood Test Report - Jan 2026",
      "type": "Blood Test",
      "date": "2026-01-10",
      "source": "City Lab",
      "notes": "Routine annual checkup",
      "file_url": "https://yourstorage.com/files/report.pdf",
      "file_name": "blood_test_jan.pdf",
      "created_at": "2026-01-11T10:30:00Z"
    }
  ]
}
```

---

#### POST `/api/records`

Upload a new medical record. Accepts `multipart/form-data`.

**Form Fields:**

| Field    | Type   | Required |
|----------|--------|----------|
| `title`  | string | Yes      |
| `type`   | string | Yes      |
| `date`   | date   | Yes      |
| `source` | string | No       |
| `notes`  | string | No       |
| `file`   | file   | No       |

**Response `201`:**
```json
{ "id": 5, "message": "Record uploaded successfully" }
```

---

#### GET `/api/records/:id`

Returns a single record with full details.

---

#### DELETE `/api/records/:id`

Deletes the record and its associated file.

---

### 6. Prescriptions

**Page:** `prescriptions.html`

Patients view prescriptions issued by doctors. **Patients cannot create prescriptions.**

---

#### GET `/api/prescriptions`

**Query Parameters:** `?status=active` | `expired`

**Response `200`:**
```json
{
  "prescriptions": [
    {
      "id": 1,
      "doctor_name": "Dr. Arjun Sharma",
      "specialty": "General Medicine",
      "date": "2026-04-10",
      "valid_until": "2026-05-10",
      "diagnosis": "Viral Fever",
      "status": "active",
      "instructions": "Take after meals. Avoid cold drinks.",
      "medicines": [
        {
          "name": "Paracetamol",
          "strength": "500mg",
          "dosage": "1 tablet",
          "frequency": "Twice daily",
          "duration": "5 days",
          "instructions": "After meals"
        },
        {
          "name": "Cetirizine",
          "strength": "10mg",
          "dosage": "1 tablet",
          "frequency": "Once daily",
          "duration": "5 days",
          "instructions": "At bedtime"
        }
      ]
    }
  ]
}
```

---

#### GET `/api/prescriptions/:id`

Returns full details of a single prescription including all medicines, diagnosis, and validity.

---

### 7. Lab Reports

**Page:** `lab-reports.html`

Patients view lab test results ordered by doctors.

---

#### GET `/api/lab-reports`

**Query Parameters:** `?status=pending|ready&from=&to=&search=`

**Response `200`:**
```json
{
  "reports": [
    {
      "id": 1,
      "test_name": "Complete Blood Count (CBC)",
      "doctor_name": "Dr. Arjun Sharma",
      "date": "2026-04-08",
      "status": "ready",
      "has_abnormal": false,
      "results": [
        {
          "parameter": "Haemoglobin",
          "value": "14.2",
          "unit": "g/dL",
          "reference_range": "13.5–17.5",
          "flag": null
        },
        {
          "parameter": "WBC Count",
          "value": "11.8",
          "unit": "10³/µL",
          "reference_range": "4.5–11.0",
          "flag": "High"
        }
      ]
    }
  ]
}
```

---

#### GET `/api/lab-reports/:id`

Returns full lab report with all parameters, lab name, and sample type.

**Response `200`:**
```json
{
  "id": 1,
  "test_name": "Complete Blood Count (CBC)",
  "doctor_name": "Dr. Arjun Sharma",
  "date": "2026-04-08",
  "lab_name": "Apollo Diagnostics",
  "sample_type": "Blood",
  "status": "ready",
  "file_url": "https://yourstorage.com/reports/cbc.pdf",
  "remarks": "Slightly elevated WBC. Suggest follow-up in 2 weeks.",
  "results": [ ... ]
}
```

---

### 8. Pharmacy

**Page:** `pharmacy.html`

Patients search for medicines and place orders for home delivery.

---

#### GET `/api/medicines`

**Query Parameters:** `?search=&category=`

**Response `200`:**
```json
{
  "medicines": [
    {
      "id": 1,
      "name": "Paracetamol 500mg",
      "generic_name": "Acetaminophen",
      "dosage_form": "Tablet",
      "category": "Painkillers",
      "price": 25.50,
      "in_stock": true,
      "manufacturer": "Cipla"
    }
  ]
}
```

---

#### POST `/api/orders`

Place a medicine order.

**Request Body:**
```json
{
  "items": [
    { "medicine_id": 1, "qty": 2 },
    { "medicine_id": 5, "qty": 1 }
  ],
  "address": "123 Main St, Mumbai 400001",
  "payment_method": "cod"
}
```

**Response `201`:**
```json
{
  "order_id": 101,
  "total": 76.50,
  "estimated_delivery": "2026-04-14",
  "message": "Order placed successfully"
}
```

---

#### GET `/api/orders`

Returns the patient's order history.

**Response `200`:**
```json
{
  "orders": [
    {
      "id": 101,
      "item_count": 3,
      "total": 76.50,
      "status": "processing",
      "created_at": "2026-04-12T09:00:00Z"
    }
  ]
}
```

---

### 9. Billing & Payments

**Page:** `billing.html`

Patients view invoices and make payments.

---

#### GET `/api/bills`

**Query Parameters:** `?status=pending|paid|overdue&search=`

**Response `200`:**
```json
{
  "bills": [
    {
      "id": 1,
      "invoice_no": "INV-2026-001",
      "description": "Consultation Fee",
      "doctor_name": "Dr. Arjun Sharma",
      "date": "2026-04-10",
      "due_date": "2026-04-20",
      "amount": 500,
      "status": "pending",
      "paid_at": null,
      "payment_method": null
    }
  ]
}
```

---

#### GET `/api/bills/:id`

Returns invoice details with line items.

**Response `200`:**
```json
{
  "id": 1,
  "invoice_no": "INV-2026-001",
  "patient_name": "Priya Mehta",
  "doctor_name": "Dr. Arjun Sharma",
  "date": "2026-04-10",
  "due_date": "2026-04-20",
  "amount": 700,
  "status": "pending",
  "items": [
    { "name": "Consultation Fee", "amount": 500 },
    { "name": "ECG Test", "amount": 200 }
  ]
}
```

---

#### POST `/api/bills/:id/pay`

Mark an invoice as paid.

**Request Body:**
```json
{
  "payment_method": "upi",
  "notes": "UPI ref: TXN123456"
}
```

**Response `200`:**
```json
{ "message": "Payment recorded successfully", "status": "paid" }
```

---

### 10. Profile

**Page:** `profile.html`

Patients view and update their personal and health information.

---

#### GET `/api/profile`

**Response `200`:**
```json
{
  "id": 1,
  "name": "Priya Mehta",
  "email": "priya@email.com",
  "phone": "+91 9876543210",
  "dob": "1995-06-15",
  "gender": "Female",
  "blood_group": "B+",
  "height": 165,
  "weight": 68,
  "blood_pressure": "120/80 mmHg",
  "address": "123 Main St, Mumbai",
  "allergies": "Penicillin, Dust",
  "conditions": "Mild asthma"
}
```

---

#### PUT `/api/profile`

Update profile fields. Any subset of fields may be sent.

**Request Body:**
```json
{
  "name": "Priya Mehta",
  "phone": "+91 9876543210",
  "address": "New address",
  "blood_group": "B+",
  "height": 165,
  "weight": 70,
  "allergies": "Penicillin",
  "conditions": "None"
}
```

---

#### PUT `/api/profile/password`

**Request Body:**
```json
{
  "current_password": "oldpass",
  "new_password": "newpass123"
}
```

**Error `400` if current password is wrong:**
```json
{ "message": "Current password is incorrect" }
```

---

#### DELETE `/api/profile`

Permanently deletes the patient's account and all associated data.

---

### 11. Notifications

**Page:** `notifications.html`

Patients receive alerts for appointments, lab results, bills, etc.

---

#### GET `/api/notifications`

**Response `200`:**
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "appointment",
      "title": "Appointment Confirmed",
      "message": "Your appointment with Dr. Arjun on Apr 15 is confirmed.",
      "is_read": false,
      "created_at": "2026-04-12T08:00:00Z"
    },
    {
      "id": 2,
      "type": "lab",
      "title": "Lab Results Ready",
      "message": "Your CBC test results are now available.",
      "is_read": true,
      "created_at": "2026-04-11T15:30:00Z"
    }
  ]
}
```

**Notification `type` values:** `appointment`, `prescription`, `lab`, `billing`, `emergency`, `system`

---

#### PUT `/api/notifications/:id/read`

Mark a single notification as read. No body required.

---

#### PUT `/api/notifications/read-all`

Mark all notifications as read. No body required.

---

#### DELETE `/api/notifications/:id`

Delete a single notification.

---

### 12. Emergency SOS

**Page:** `emergency.html`

Patients can trigger an SOS alert, manage emergency contacts, and find nearby hospitals.

---

#### GET `/api/emergency/contacts`

**Response `200`:**
```json
{
  "contacts": [
    {
      "id": 1,
      "name": "Rohan Mehta",
      "relation": "Spouse",
      "phone": "+91 9876500001",
      "is_primary": true
    }
  ]
}
```

---

#### POST `/api/emergency/contacts`

**Request Body:**
```json
{
  "name": "Rohan Mehta",
  "relation": "Spouse",
  "phone": "+91 9876500001",
  "is_primary": true
}
```

---

#### PUT `/api/emergency/contacts/:id`

Update an existing emergency contact.

---

#### DELETE `/api/emergency/contacts/:id`

Delete an emergency contact.

---

#### POST `/api/emergency/sos`

Trigger an SOS alert. Should notify all emergency contacts and nearby hospitals.

**Request Body:**
```json
{
  "latitude": 19.0760,
  "longitude": 72.8777,
  "message": "Chest pain, difficulty breathing"
}
```

**Expected Behavior:**
- Send SMS/notification to all emergency contacts
- Share patient's medical summary (blood group, allergies, conditions)
- Log the SOS event with timestamp

**Response `200`:**
```json
{
  "message": "SOS alert sent to 2 contacts",
  "alert_id": "SOS-20260412-001"
}
```

---

#### GET `/api/emergency/hospitals`

Find hospitals near the patient's location.

**Query Parameters:** `?lat=19.07&lng=72.87&radius=5`

**Response `200`:**
```json
{
  "hospitals": [
    {
      "name": "City General Hospital",
      "address": "MG Road, Mumbai",
      "phone": "+91 22 1234 5678",
      "distance": 1.2
    },
    {
      "name": "Apollo Clinic",
      "address": "Andheri West, Mumbai",
      "phone": "+91 22 9876 5432",
      "distance": 2.8
    }
  ]
}
```

---

## General Error Format

All errors should follow this structure:

```json
{
  "message": "Human-readable error description"
}
```

| HTTP Code | Meaning                        |
|-----------|--------------------------------|
| `200`     | Success                        |
| `201`     | Created                        |
| `400`     | Bad request / validation error |
| `401`     | Unauthenticated                |
| `403`     | Forbidden                      |
| `404`     | Not found                      |
| `500`     | Internal server error          |

---

## Evaluation Criteria

| Criteria                          | Weight |
|-----------------------------------|--------|
| All 12 features working correctly | 40%    |
| API response structure accuracy   | 20%    |
| Authentication & security         | 15%    |
| Error handling                    | 10%    |
| Code quality & structure          | 10%    |
| Bonus: File uploads working       | 5%     |

---

## Notes for Participants

- **Do not modify** the frontend HTML/CSS/JS files
- The frontend uses `localStorage` to store the auth token — your login endpoint **must** return a `token` field
- All date fields should follow **ISO 8601** format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`
- Enable **CORS** on your backend — the frontend runs from a different origin
- File uploads use `multipart/form-data` — handle accordingly

---

*MediConnect Patient Portal — BackForge Healthtech Competition*
