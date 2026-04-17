<div align="center">

  <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80" alt="MediConnect Banner" width="100%" style="border-radius: 10px; margin-bottom: 20px;" />

  # 🩺 MediConnect
  **Next-Gen Patient Portal & Healthcare Management System**

  A Seamless, Secure, and Smart Digital Bridge between Patients and Healthcare Providers.

  <p align="center">
    <a href="#-stupendous-features">Features</a> • 
    <a href="#-how-to-setup-quick--easy">Installation</a> • 
    <a href="#-architectural-map">Architecture</a> • 
    <a href="#-secret-demo-arsenal">Demo</a>
  </p>

  <div>
    <img src="https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JS-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="Frontend" />
    <img src="https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Backend" />
    <img src="https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="Database" />
    <img src="https://img.shields.io/badge/ORM-Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white" alt="ORM" />
  </div>

</div>

<br/>

> [!TIP]
> **MediConnect** turns exhausting medical administration into a frictionless digital experience! By coupling a blazing-fast vanilla web interface with a robust, scalable Express API, MediConnect is built for speed, security, and scale.

---

## 🔥 Stupendous Features

<table>
  <tr>
    <td width="50%">
      <h3>🔐 Secure Onboarding</h3>
      <p>Iron-clad JWT authentication, bcrypt password hashing, and user sessions keep data locked down tight.</p>
    </td>
    <td width="50%">
      <h3>📊 Breathtaking Dashboard</h3>
      <p>Instant visibility into upcoming appointments, vital stats (BP, HR, BMI), and pending alerts.</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>🩺 Instant Doctor Booking</h3>
      <p>Search specialists, view dynamic profiles, read reviews, and secure your optimal time slot instantly.</p>
    </td>
    <td>
      <h3>📁 Medical Vault & Labs</h3>
      <p>Securely upload, browse, and download lab reports, X-rays, and physical prescriptions anywhere.</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>💊 Digital Pharmacy</h3>
      <p>Find medicines, consult alternatives, fill your cart, and place home delivery orders in seconds.</p>
    </td>
    <td>

      <h3>🚧 Full Role-Based Access (RBAC)</h3>
      <p>Hardened route protection decoupling Patients, Doctors, and System Administrators securely.</p>
    </td>
    <td>
      <h3>🛡️ Staff Command Portals</h3>
      <p>Dedicated Doctor login to issue prescriptions, and an Admin dashboard to securely onboard new staff.</p>
    </td>
## 🔥 added Features
      <h3>🚨 Real-time SOS Alerts</h3>
      <p>One-tap Emergency Response sending live GPS coordinates and crucial vitals to primary contacts.</p>
    </td>
  </tr>
  <tr>
    <td>
  </tr>
</table>

---

## ⚡ How To Setup (Quick & Easy)

You're less than **3 minutes away** from having MediConnect running locally.

> [!IMPORTANT]  
> Make sure you have [Node.js (v14+)](https://nodejs.org/) and a local **MySQL Server** installed before you begin.

### 1️⃣ Database Initialization
Start your local MySQL service and execute this command to create a pristine database ecosystem:
```sql
CREATE DATABASE mediconnect;
```

### 2️⃣ Awaken the Backend
Open your terminal, traverse into the `backend` stronghold, and install the required dependencies.

```bash
# Dive into the backend
cd backend

# Install the engine libraries
npm install
```

Create a fresh `.env` file inside the `backend/` directory. Copy the schema below and replace `DB_PASSWORD` with your actual MySQL password.

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password 
DB_NAME=mediconnect
JWT_SECRET=super_secret_jwt_signature_key
```

> [!NOTE]  
> Sequelize ORM is magical. It will automatically architect all the necessary database tables when the server ignites!

Run the node ignition sequence:
```bash
# Start in watch mode for development
npm run dev
```

### 3️⃣ Breathe Life into the Frontend
1. Open the file located at `js/app.js`.
2. Ensure the API points to your glorious new backend:
   ```javascript
   const API_BASE_URL = "http://localhost:3000";
   ```
3. Boot up the user interface! Using VS Code? Right-click `index.html` and hit **`Open with Live Server`**.

*(Boom! The portal is open.)* 🚀

---

## 🔑 Secret Demo Arsenal

Experience MediConnect as a mock patient (*assuming you've seeded your DB with sample data*).

| Persona | Role | Email | Passkey | Portal |
|:---|:---|:---|:---|:---|
| 👤 **John Doe** | Patient | `patient@demo.com` | `demo123` | `index.html` |
| 👨‍⚕️ **Dr. Rajesh** | Doctor | `rajesh@demo.com` | `doc1234` | `doctor-login.html` |
| 🛡️ **Sys Admin** | Admin | `admin@gmail.com` | `admin@123` | `admin-login.html` |

---

## 🗺️ Architectural Map

<details>
<summary><b>Click to expand the Folder Structure</b></summary>

```text
MediConnect/
├── 🗄️ backend/               # The Engine Room (Node.js/Express API)
│   ├── models/            # Database Blueprints (Sequelize)
│   ├── routes/            # The Neuro-pathways (API Endpoints)
│   ├── controllers/       # The Brains (Business Logic)
│   ├── uploads/           # The Vault (User Files)
│   ├── app.js             # Express Configurations
│   ├── server.js          # The Ignition Switch
│   └── vercel.json        # Serverless Cloud Deployment Config
├── 🎨 css/                   # The Style Sheets
├── 🧠 js/                    # The Client-Side Logic
├── 📜 index.html             # Patient Authentication Portal
├── 📜 doctor-login.html      # Medical Staff Authentication Portal
├── 📜 admin-dashboard.html   # Administrator Control Center
└── 📜 *.html                 # Remainder of HTML Portals (Views)
```

</details>

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=007bff&height=100&section=footer" width="100%"/>
  <br/>
  <p>If you encounter a bug or desire a glorious feature, <strong>Fork this repo & submit a PR!</strong></p>
  <p><i>Crafted for Modern Healthcare Architecture. &copy; MediConnect Open Source Initiative</i></p>
</div>