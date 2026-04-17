const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'mediconnect',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

// Models
const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('patient', 'doctor', 'admin'), defaultValue: 'patient' },
  phone: { type: DataTypes.STRING },
  dob: { type: DataTypes.DATEONLY },
  gender: { type: DataTypes.STRING(10) },
  blood_group: { type: DataTypes.STRING(5) },
  address: { type: DataTypes.TEXT },
  weight: { type: DataTypes.DECIMAL(5, 2) },
  height: { type: DataTypes.DECIMAL(5, 2) },
  allergies: { type: DataTypes.TEXT },
  chronic_conditions: { type: DataTypes.TEXT },
}, { tableName: 'users', timestamps: true });

const Doctor = sequelize.define('Doctor', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  specialty: { type: DataTypes.STRING, allowNull: false },
  experience: { type: DataTypes.INTEGER },
  rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 0 },
  reviews: { type: DataTypes.INTEGER, defaultValue: 0 },
  fee: { type: DataTypes.DECIMAL(10, 2) },
  bio: { type: DataTypes.TEXT },
  qualifications: { type: DataTypes.TEXT },
  license_no: { type: DataTypes.STRING },
  hospital: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING },
  location_type: { type: DataTypes.STRING(20) }, // online or clinic
  availability: { type: DataTypes.TEXT },
  image_url: { type: DataTypes.TEXT },
}, { tableName: 'doctors', timestamps: true });

const DoctorSlot = sequelize.define('DoctorSlot', {
  date: { type: DataTypes.DATEONLY, allowNull: false },
  time: { type: DataTypes.STRING(10), allowNull: false },
  is_available: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'doctor_slots', timestamps: false });

const Appointment = sequelize.define('Appointment', {
  date: { type: DataTypes.DATEONLY, allowNull: false },
  time: { type: DataTypes.STRING(10), allowNull: false },
  type: { type: DataTypes.STRING(20) },
  reason: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING(20), defaultValue: 'upcoming' },
  diagnosis: { type: DataTypes.TEXT },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'appointments', timestamps: true });

const MedicalRecord = sequelize.define('MedicalRecord', {
  title: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING(50) },
  file_url: { type: DataTypes.TEXT, allowNull: false },
  file_name: { type: DataTypes.STRING },
  file_size: { type: DataTypes.INTEGER },
  upload_date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'medical_records', timestamps: true });

const Prescription = sequelize.define('Prescription', {
  diagnosis: { type: DataTypes.TEXT },
  medicines: { type: DataTypes.JSON },
  notes: { type: DataTypes.TEXT },
  issued_date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  valid_till: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.STRING(20), defaultValue: 'active' },
}, { tableName: 'prescriptions', timestamps: true });

const LabReport = sequelize.define('LabReport', {
  test_name: { type: DataTypes.STRING, allowNull: false },
  test_date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  results: { type: DataTypes.JSON },
  pdf_url: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING(20), defaultValue: 'completed' },
}, { tableName: 'lab_reports', timestamps: true });

const Medicine = sequelize.define('Medicine', {
  name: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING(100) },
  manufacturer: { type: DataTypes.STRING(100) },
  price: { type: DataTypes.DECIMAL(10, 2) },
  description: { type: DataTypes.TEXT },
  dosage_form: { type: DataTypes.STRING(50) },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  image_url: { type: DataTypes.TEXT },
}, { tableName: 'medicines', timestamps: true });

const Order = sequelize.define('Order', {
  items: { type: DataTypes.JSON },
  total_amount: { type: DataTypes.DECIMAL(10, 2) },
  delivery_address: { type: DataTypes.TEXT },
  payment_method: { type: DataTypes.STRING(50) },
  payment_status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
  delivery_status: { type: DataTypes.STRING(20), defaultValue: 'processing' },
  order_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  delivered_at: { type: DataTypes.DATE },
}, { tableName: 'orders', timestamps: false });

const Bill = sequelize.define('Bill', {
  invoice_number: { type: DataTypes.STRING(50), unique: true },
  items: { type: DataTypes.JSON },
  subtotal: { type: DataTypes.DECIMAL(10, 2) },
  tax: { type: DataTypes.DECIMAL(10, 2) },
  total: { type: DataTypes.DECIMAL(10, 2) },
  status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
  issue_date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  due_date: { type: DataTypes.DATEONLY },
  paid_date: { type: DataTypes.DATEONLY },
  payment_method: { type: DataTypes.STRING(50) },
}, { tableName: 'bills', timestamps: true });

const Notification = sequelize.define('Notification', {
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.STRING(50) },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'notifications', timestamps: true });

const EmergencyContact = sequelize.define('EmergencyContact', {
  name: { type: DataTypes.STRING, allowNull: false },
  relation: { type: DataTypes.STRING(50) },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'emergency_contacts', timestamps: true });


// Relationships
Doctor.hasMany(DoctorSlot, { foreignKey: 'doctor_id' });
DoctorSlot.belongsTo(Doctor, { foreignKey: 'doctor_id' });

User.hasMany(Appointment, { foreignKey: 'user_id' });
Appointment.belongsTo(User, { foreignKey: 'user_id' });
Doctor.hasMany(Appointment, { foreignKey: 'doctor_id' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id' });

User.hasMany(MedicalRecord, { foreignKey: 'user_id' });
MedicalRecord.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Prescription, { foreignKey: 'user_id' });
Prescription.belongsTo(User, { foreignKey: 'user_id' });
Doctor.hasMany(Prescription, { foreignKey: 'doctor_id' });
Prescription.belongsTo(Doctor, { foreignKey: 'doctor_id' });
Appointment.hasOne(Prescription, { foreignKey: 'appointment_id' });
Prescription.belongsTo(Appointment, { foreignKey: 'appointment_id' });

User.hasMany(LabReport, { foreignKey: 'user_id' });
LabReport.belongsTo(User, { foreignKey: 'user_id' });
Doctor.hasMany(LabReport, { foreignKey: 'doctor_id' });
LabReport.belongsTo(Doctor, { foreignKey: 'doctor_id' });

User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Bill, { foreignKey: 'user_id' });
Bill.belongsTo(User, { foreignKey: 'user_id' });
Appointment.hasOne(Bill, { foreignKey: 'appointment_id' });
Bill.belongsTo(Appointment, { foreignKey: 'appointment_id' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(EmergencyContact, { foreignKey: 'user_id' });
EmergencyContact.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Doctor,
  DoctorSlot,
  Appointment,
  MedicalRecord,
  Prescription,
  LabReport,
  Medicine,
  Order,
  Bill,
  Notification,
  EmergencyContact
};
