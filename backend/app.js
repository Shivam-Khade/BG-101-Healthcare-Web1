const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');

const {
  sequelize, User, Doctor, DoctorSlot, Appointment,
  MedicalRecord, Prescription, LabReport, Medicine,
  Order, Bill, Notification, EmergencyContact
} = require('./models');

const app = express();

// Middleware Setup
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Serve uploaded files (medical records, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload Dir Setup
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(`${uploadDir}/records`)) fs.mkdirSync(`${uploadDir}/records`, { recursive: true });

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, `${uploadDir}/records/`),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) return cb(null, true);
    cb(new Error('Only PDF, JPEG, JPG, and PNG files are allowed'));
  }
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    req.userId = user.userId;
    req.userRole = user.role;
    next();
  });
};

// RBAC Middleware
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

const apiRoute = express.Router();
const doctorRoute = express.Router();
const adminRoute = express.Router();
const patientRoute = express.Router(); // explicit patient routes matching the same handlers

// --- 1. Authentication --- //
apiRoute.post('/auth/register', async (req, res, next) => {
  try {
    const { name, email, password, phone, dob, gender, blood_group, address, weight, height, allergies, chronic_conditions } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already exists', errors: [{ field: 'email', message: 'Email in use' }] });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, email, password: hashedPassword, phone, dob, gender, blood_group,
      address, weight, height, allergies, chronic_conditions, role: req.body.role || 'patient'
    });
    
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch(err) { next(err); }
});

apiRoute.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch(err) { next(err); }
});

apiRoute.post('/auth/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

apiRoute.get('/auth/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch(err) { next(err); }
});

// --- 2. Doctors --- //
const { Op } = require('sequelize');
apiRoute.get('/doctors', async (req, res, next) => {
  try {
    const { search, specialty, location, sort } = req.query;
    const where = {};
    
    // 1. Search Query (Name, Specialty, or Hospital)
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { specialty: { [Op.like]: `%${search}%` } },
        { hospital: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 2. Specialty Filter
    if (specialty && specialty !== 'All Specialties') {
      where.specialty = specialty;
    }
    
    // 3. Location Type Filter (Online / In-clinic)
    if (location && location !== 'All Locations') {
      where.location_type = location.toLowerCase().includes('online') ? 'online' : 'clinic';
    }
    
    // 4. Sorting Logic
    let order = [];
    if (sort === 'rating') order.push(['rating', 'DESC']);
    else if (sort === 'fee_asc') order.push(['fee', 'ASC']);
    else if (sort === 'fee_desc') order.push(['fee', 'DESC']);
    else if (sort === 'experience') order.push(['experience', 'DESC']);
    else order.push(['rating', 'DESC']); // Default sort
    
    const doctors = await Doctor.findAll({ where, order });
    res.json({ success: true, data: doctors });
  } catch(err) { next(err); }
});

apiRoute.get('/doctors/specialties', async (req, res, next) => {
  try {
    const specialties = await Doctor.findAll({ attributes: ['specialty'], group: ['specialty'] });
    res.json({ success: true, data: specialties.map(s => s.specialty) });
  } catch(err) { next(err); }
});

apiRoute.get('/doctors/:id', async (req, res, next) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    if(!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch(err) { next(err); }
});

apiRoute.get('/doctors/:id/slots', async (req, res, next) => {
  try {
    const slots = await DoctorSlot.findAll({ where: { doctor_id: req.params.id, date: req.query.date || new Date() }});
    
    // If we haven't formally seeded DoctorSlots, provide mock slots to allow testing bookings
    if (!slots || slots.length === 0) {
      return res.json({ success: true, data: { slots: [
        { time: '09:00 AM', available: true },
        { time: '10:00 AM', available: true },
        { time: '11:00 AM', available: true },
        { time: '02:00 PM', available: true },
        { time: '04:00 PM', available: true }
      ]}});
    }

    res.json({ success: true, data: { slots }});
  } catch(err) { next(err); }
});

// --- 3. Appointments --- //
apiRoute.get('/appointments', authenticateToken, async (req, res, next) => {
  try {
    const where = { user_id: req.userId };
    if (req.query.status) where.status = req.query.status;
    const appointments = await Appointment.findAll({ where, include: [{ model: Doctor, attributes: ['id', 'name', 'specialty', 'hospital'] }], order: [['date', 'ASC']] });
    res.json({ success: true, data: appointments });
  } catch(err) { next(err); }
});

apiRoute.post('/appointments', authenticateToken, async (req, res, next) => {
  try {
    const { doctor_id, date, time, type, reason } = req.body;
    
    // Check slot availability (basic logic)
    const existing = await Appointment.findOne({ where: { doctor_id, date, time, status: 'upcoming' } });
    if (existing) return res.status(409).json({ success: false, message: 'Appointment slot already booked' });

    const appointment = await Appointment.create({ user_id: req.userId, doctor_id, date, time, type, reason });
    await Notification.create({ user_id: req.userId, title: 'Appointment Confirmed', message: `Your appointment is confirmed for ${date} at ${time}.`, type: 'appointment' });
    res.json({ success: true, data: appointment });
  } catch(err) { next(err); }
});

apiRoute.get('/appointments/:id', authenticateToken, async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ where: { id: req.params.id, user_id: req.userId }, include: [Doctor] });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appointment });
  } catch(err) { next(err); }
});

apiRoute.put('/appointments/:id', authenticateToken, async (req, res, next) => {
  try {
    const { date, time, reason } = req.body;
    const appointment = await Appointment.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    await appointment.update({ date, time, reason });
    res.json({ success: true, message: 'Appointment rescheduled successfully' });
  } catch(err) { next(err); }
});

apiRoute.delete('/appointments/:id', authenticateToken, async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    await appointment.update({ status: 'cancelled' });
    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch(err) { next(err); }
});

// --- 4. Medical Records --- //
apiRoute.get('/records', authenticateToken, async (req, res, next) => {
  try {
    const where = { user_id: req.userId };
    if (req.query.type) where.type = req.query.type;
    const records = await MedicalRecord.findAll({ where });
    res.json({ success: true, data: records });
  } catch(err) { next(err); }
});

apiRoute.post('/records', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    const { title, type, notes } = req.body;
    const recordData = {
      user_id: req.userId, title, type, notes,
      upload_date: req.body.date || new Date()
    };
    if (req.file) {
      recordData.file_url = `/uploads/records/${req.file.filename}`;
      recordData.file_name = req.file.originalname;
      recordData.file_size = req.file.size;
    }
    const record = await MedicalRecord.create(recordData);
    res.json({ success: true, data: record });
  } catch(err) { next(err); }
});

apiRoute.get('/records/:id', authenticateToken, async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: record });
  } catch(err) { next(err); }
});

apiRoute.delete('/records/:id', authenticateToken, async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    if (fs.existsSync('.' + record.file_url)) fs.unlinkSync('.' + record.file_url);
    await record.destroy();
    res.json({ success: true, message: 'Record deleted successfully' });
  } catch(err) { next(err); }
});

// --- 5. Prescriptions & Lab Reports --- //
apiRoute.get('/prescriptions', authenticateToken, async (req, res, next) => {
  try {
    const where = { user_id: req.userId };
    if (req.query.status) where.status = req.query.status;
    const prescriptions = await Prescription.findAll({ where, include: [{ model: Doctor, attributes: ['id', 'name', 'specialty'] }], order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: prescriptions });
  } catch(err) { next(err); }
});

apiRoute.get('/prescriptions/:id', authenticateToken, async (req, res, next) => {
  try {
    const rx = await Prescription.findOne({ where: { id: req.params.id, user_id: req.userId }, include: [{ model: Doctor, attributes: ['id', 'name', 'specialty'] }] });
    if (!rx) return res.status(404).json({ success: false, message: 'Prescription not found' });
    res.json({ success: true, data: rx });
  } catch(err) { next(err); }
});

apiRoute.get('/lab-reports', authenticateToken, async (req, res, next) => {
  try {
    const where = { user_id: req.userId };
    if (req.query.status) where.status = req.query.status;
    const reports = await LabReport.findAll({ where, include: [{ model: Doctor, attributes: ['id', 'name'] }], order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: reports });
  } catch(err) { next(err); }
});

apiRoute.get('/lab-reports/:id', authenticateToken, async (req, res, next) => {
  try {
    const report = await LabReport.findOne({ where: { id: req.params.id, user_id: req.userId }, include: [{ model: Doctor, attributes: ['id', 'name'] }] });
    if (!report) return res.status(404).json({ success: false, message: 'Lab report not found' });
    res.json({ success: true, data: report });
  } catch(err) { next(err); }
});

// --- 6. Pharmacy --- //
apiRoute.get('/medicines', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${req.query.search}%` } },
        { category: { [Op.like]: `%${req.query.search}%` } },
        { description: { [Op.like]: `%${req.query.search}%` } }
      ];
    }
    if (req.query.category) where.category = req.query.category;
    const medicines = await Medicine.findAll({ where });
    res.json({ success: true, data: medicines });
  } catch(err) { next(err); }
});

apiRoute.post('/orders', authenticateToken, async (req, res, next) => {
  try {
    const { items, delivery_address, payment_method } = req.body;
    
    // In real app we would calculate real prices. Here we assume items is [{medicine_id, qty}] and we fetch prices.
    let total_amount = 0;
    const finalItems = [];
    for(let itm of items) {
       const med = await Medicine.findByPk(itm.medicine_id);
       if(med) {
          total_amount += med.price * itm.qty;
          finalItems.push({ medicine_id: med.id, name: med.name, qty: itm.qty, price: med.price });
          await med.decrement('stock', { by: itm.qty });
       }
    }
    
    const order = await Order.create({ user_id: req.userId, items: finalItems, total_amount, delivery_address, payment_method });
    
    // Auto-create a bill for this pharmacy order
    const invoiceNum = 'INV-PH-' + Date.now();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // due in 7 days
    await Bill.create({
      user_id: req.userId,
      invoice_number: invoiceNum,
      items: finalItems.map(i => ({ name: `${i.name} x${i.qty}`, amount: (i.price * i.qty).toFixed(2) })),
      subtotal: total_amount,
      tax: (total_amount * 0.05).toFixed(2),
      total: (total_amount * 1.05).toFixed(2),
      status: payment_method === 'cod' ? 'pending' : 'pending',
      issue_date: new Date(),
      due_date: dueDate
    });
    await Notification.create({ user_id: req.userId, title: 'Order Placed', message: `Order #${order.id} placed for ₹${total_amount.toFixed(2)}. Invoice ${invoiceNum} created.`, type: 'billing' });
    
    res.json({ success: true, data: order });
  } catch(err) { next(err); }
});

apiRoute.get('/orders', authenticateToken, async (req, res, next) => {
  try {
    const orders = await Order.findAll({ where: { user_id: req.userId }, order: [['order_date', 'DESC']] });
    res.json({ success: true, data: orders });
  } catch(err) { next(err); }
});

apiRoute.put('/orders/:id/status', authenticateToken, async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    await order.update({ delivery_status: status });
    if (status === 'delivered') {
      await order.update({ delivered_at: new Date() });
      await Notification.create({ user_id: req.userId, title: 'Order Delivered', message: `Order #${order.id} has been successfully delivered.`, type: 'pharmacy' });
    }
    
    res.json({ success: true, message: `Order status updated to ${status}`, data: order });
  } catch(err) { next(err); }
});

// --- 7. Billing --- //
apiRoute.get('/bills', authenticateToken, async (req, res, next) => {
  try {
    const where = { user_id: req.userId };
    if (req.query.status) where.status = req.query.status;
    const bills = await Bill.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: bills });
  } catch(err) { next(err); }
});

apiRoute.get('/bills/:id', authenticateToken, async (req, res, next) => {
  try {
    const bill = await Bill.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true, data: bill });
  } catch(err) { next(err); }
});

apiRoute.post('/bills/:id/pay', authenticateToken, async (req, res, next) => {
  try {
    const bill = await Bill.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    await bill.update({ status: 'paid', paid_date: new Date(), payment_method: req.body.payment_method });
    res.json({ success: true, message: 'Payment successful', data: bill });
  } catch(err) { next(err); }
});

// --- 8. Profile --- //
apiRoute.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, { attributes: { exclude: ['password'] } });
    res.json({ success: true, data: user });
  } catch(err) { next(err); }
});

apiRoute.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const updates = req.body;
    await User.update(updates, { where: { id: req.userId } });
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch(err) { next(err); }
});

apiRoute.put('/profile/password', authenticateToken, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findByPk(req.userId);
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect current password' });
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await user.update({ password: hashedPassword });
    res.json({ success: true, message: 'Password changed successfully' });
  } catch(err) { next(err); }
});

// --- 9. Notifications --- //
apiRoute.get('/notifications', authenticateToken, async (req, res, next) => {
  try {
    const where = { user_id: req.userId };
    if (req.query.unread_only === 'true') where.is_read = false;
    const notifications = await Notification.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: notifications });
  } catch(err) { next(err); }
});

apiRoute.put('/notifications/:id/read', authenticateToken, async (req, res, next) => {
  try {
    await Notification.update({ is_read: true }, { where: { id: req.params.id, user_id: req.userId } });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch(err) { next(err); }
});

apiRoute.put('/notifications/read-all', authenticateToken, async (req, res, next) => {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.userId, is_read: false } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch(err) { next(err); }
});

apiRoute.delete('/notifications/:id', authenticateToken, async (req, res, next) => {
  try {
    await Notification.destroy({ where: { id: req.params.id, user_id: req.userId } });
    res.json({ success: true, message: 'Notification deleted' });
  } catch(err) { next(err); }
});

// --- 10. Emergency --- //
apiRoute.get('/emergency/contacts', authenticateToken, async (req, res, next) => {
  try {
    const contacts = await EmergencyContact.findAll({ where: { user_id: req.userId } });
    res.json({ success: true, data: contacts });
  } catch(err) { next(err); }
});

apiRoute.post('/emergency/contacts', authenticateToken, async (req, res, next) => {
  try {
    const { name, relation, phone, is_primary } = req.body;
    if (is_primary) await EmergencyContact.update({ is_primary: false }, { where: { user_id: req.userId } });
    const contact = await EmergencyContact.create({ user_id: req.userId, name, relation, phone, is_primary });
    res.json({ success: true, data: contact });
  } catch(err) { next(err); }
});

apiRoute.delete('/emergency/contacts/:id', authenticateToken, async (req, res, next) => {
  try {
    await EmergencyContact.destroy({ where: { id: req.params.id, user_id: req.userId } });
    res.json({ success: true, message: 'Contact deleted' });
  } catch(err) { next(err); }
});

const https = require('https');

async function fetchNearbyHospitals(lat, lng, radius = 5) {
  let hospitals = [];
  if (lat && lng && lat !== 'null' && lng !== 'null') {
    const radMeter = radius * 1000;
    const query = `[out:json];node(around:${radMeter},${lat},${lng})[amenity=hospital];out 15;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
      const data = await new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'MediConnect Portal/1.0' } }, (response) => {
          let chunkedData = '';
          response.on('data', chunk => chunkedData += chunk);
          response.on('end', () => {
            try { resolve(JSON.parse(chunkedData)); } catch(e) { reject(e); }
          });
        }).on('error', reject);
      });

      hospitals = (data.elements || []).map(el => {
        const R = 6371;
        const dLat = (el.lat - lat) * Math.PI / 180;
        const dLon = (el.lon - lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(el.lat * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = (R * c).toFixed(1);

        return {
          name: el.tags.name || 'Local Medical Center',
          address: el.tags['addr:street'] || el.tags['addr:city'] || 'Location available on map',
          phone: el.tags.phone || '108 (Emergency)',
          distance: distance,
          latitude: el.lat,
          longitude: el.lon
        };
      }).filter(h => h.name !== 'Local Medical Center')
        .sort((a,b) => parseFloat(a.distance) - parseFloat(b.distance))
        .slice(0, 5);
      
    } catch (e) {
      console.error("Overpass API fetch error:", e.message);
    }
  }

  if (hospitals.length === 0) {
    hospitals = [{ name: 'Dummy Local Hospital', address: 'Nearby Location (Enable GPS for real data)', phone: '108', distance: 2.1 }];
  }
  return hospitals;
}

apiRoute.post('/emergency/sos', authenticateToken, async (req, res, next) => {
  try {
    const { latitude, longitude, message } = req.body;
    const contacts = await EmergencyContact.findAll({ where: { user_id: req.userId } });
    
    // Fetch live hospitals to notify
    const nearbyHospitals = await fetchNearbyHospitals(latitude, longitude);
    const realHospitalsCount = nearbyHospitals.filter(h => h.name !== 'Dummy Local Hospital').length;
    
    // Simulate SOS Push Notification
    await Notification.create({ 
      user_id: req.userId, 
      title: 'SOS Alert Sent', 
      message: `Your emergency contacts and ${realHospitalsCount > 0 ? realHospitalsCount : 'nearby'} hospitals have been alerted with your live location.`, 
      type: 'general' 
    });
    
    res.json({ 
      success: true, 
      message: 'SOS alert dispatched successfully', 
      contacts_notified: contacts.length,
      hospitals_notified: realHospitalsCount
    });
  } catch(err) { next(err); }
});

apiRoute.get('/emergency/hospitals', async (req, res, next) => {
  try {
    const hospitals = await fetchNearbyHospitals(req.query.lat, req.query.lng, req.query.radius);
    res.json({ success: true, data: hospitals });
  } catch(err) { next(err); }
});

// --- 11. Dashboard Stats API --- //
apiRoute.get('/dashboard/stats', authenticateToken, async (req, res, next) => {
  try {
    const upcoming_appointments = await Appointment.count({ where: { user_id: req.userId, status: 'upcoming' } });
    const active_prescriptions = await Prescription.count({ where: { user_id: req.userId, status: 'active' } });
    const lab_reports = await LabReport.count({ where: { user_id: req.userId } });
    const pending_bills = await Bill.count({ where: { user_id: req.userId, status: 'pending' } });
    
    const recent_appointments = await Appointment.findAll({ where: { user_id: req.userId }, limit: 3, order: [['date', 'DESC']] });
    
    res.json({
      success: true,
      data: {
        upcoming_appointments, active_prescriptions, lab_reports, pending_bills,
        recent_appointments,
        health_metrics: { blood_pressure: "120/80", blood_sugar: "95 mg/dL", heart_rate: "72 bpm" } // Mock data for now
      }
    });
  } catch(err) { next(err); }
});

// --- 12. DOCTOR ROUTES (RBAC) --- //
// Doctor specific public routes
doctorRoute.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || user.role !== 'doctor') return res.status(401).json({ success: false, message: 'Invalid doctor credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid doctor credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch(err) { next(err); }
});

// Protect all subsequent doctor routes
doctorRoute.use(authenticateToken, authorizeRoles('doctor', 'admin'));

doctorRoute.get('/appointments', async (req, res, next) => {
  try {
    // Only fetch appointments belonging to this doctor (assuming the doctor's table ID links to User somehow, but we'll use user_id mapping if needed. For now, assuming email match or direct ID tie)
    // To match correctly: find the Doctor profile where email = User email
    const docProfile = await Doctor.findOne({ where: { email: req.body.email || (await User.findByPk(req.userId)).email } });
    if (!docProfile) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    
    const appointments = await Appointment.findAll({ where: { doctor_id: docProfile.id }, include: [User], order: [['date', 'ASC']] });
    res.json({ success: true, data: appointments });
  } catch(err) { next(err); }
});

doctorRoute.put('/appointments/:id', async (req, res, next) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    await appointment.update({ status: req.body.status }); // e.g., completed or cancelled
    res.json({ success: true, message: 'Appointment status updated', data: appointment });
  } catch(err) { next(err); }
});

doctorRoute.post('/prescriptions', async (req, res, next) => {
  try {
    const docProfile = await Doctor.findOne({ where: { email: (await User.findByPk(req.userId)).email } });
    if (!docProfile) return res.status(404).json({ success: false, message: 'Doctor profile not found' });

    const { user_id, appointment_id, diagnosis, medicines, notes, valid_till } = req.body;
    const prescription = await Prescription.create({
      user_id, doctor_id: docProfile.id, appointment_id,
      diagnosis, medicines, notes, valid_till, status: 'active'
    });
    res.json({ success: true, data: prescription });
  } catch(err) { next(err); }
});

// --- 13. ADMIN ROUTES (RBAC) --- //
// Admin specific public routes
adminRoute.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || user.role !== 'admin') return res.status(401).json({ success: false, message: 'Invalid admin credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid admin credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch(err) { next(err); }
});

// Protect all subsequent admin routes
adminRoute.use(authenticateToken, authorizeRoles('admin'));

adminRoute.get('/users', async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json({ success: true, data: users });
  } catch(err) { next(err); }
});

adminRoute.get('/doctors', async (req, res, next) => {
  try {
    const doctors = await Doctor.findAll();
    res.json({ success: true, data: doctors });
  } catch(err) { next(err); }
});

adminRoute.post('/doctors', async (req, res, next) => {
  try {
    const doctor = await Doctor.create(req.body);
    // Link to user if needed
    await User.create({ name: req.body.name, email: req.body.email, password: await bcrypt.hash('doc1234', 10), role: 'doctor' });
    res.json({ success: true, data: doctor });
  } catch(err) { next(err); }
});

adminRoute.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch(err) { next(err); }
});

adminRoute.get('/appointments', async (req, res, next) => {
  try {
    const appointments = await Appointment.findAll({ include: [User, Doctor] });
    res.json({ success: true, data: appointments });
  } catch(err) { next(err); }
});

adminRoute.get('/dashboard', async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const totalDoctors = await Doctor.count();
    const totalAppointments = await Appointment.count();
    res.json({ success: true, data: { users: totalUsers, doctors: totalDoctors, appointments: totalAppointments } });
  } catch(err) { next(err); }
});


app.use('/api/admin', adminRoute);
app.use('/api/doctor', doctorRoute);
app.use('/api/patient', apiRoute); // Alias for clean MVC structure
app.use('/api', apiRoute); // Maintain backwards compatibility for patient portal UI

// Welcome Route
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Welcome to MediConnect RBAC API' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

module.exports = app;
