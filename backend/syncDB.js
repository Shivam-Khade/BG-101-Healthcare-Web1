const { sequelize } = require('./models');

async function sync() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced successfully. Schema created.');

    const { User, Doctor, Medicine, Appointment, Prescription, LabReport, Bill, Notification } = require('./models');
    
    // Create Demo Patient and Admin
    const bcrypt = require('bcrypt');
    const hashPatient = await bcrypt.hash('demo123', 10);
    const hashAdmin = await bcrypt.hash('admin@123', 10);

    const demoPatient = await User.create({
      name: 'Demo Patient', email: 'patient@demo.com', password: hashPatient, role: 'patient', phone: '+91 9876543210', dob: '1990-05-15', gender: 'Male', blood_group: 'A+'
    });

    const demoAdmin = await User.create({
      name: 'System Admin', email: 'admin@gmail.com', password: hashAdmin, role: 'admin'
    });

    // Create Doctors
    const doctorsData = [
      { name: 'Dr. Rajesh Kumar', email: 'rajesh@demo.com', specialty: 'Cardiologist', experience: 15, rating: 4.8, reviews: 234, fee: 800, hospital: 'Apollo Hospital', location: 'Mumbai', location_type: 'clinic', availability: 'Mon-Fri, 9AM-5PM', image_url: '/images/doctors/dr-rajesh.jpg' },
      { name: 'Dr. Priya Sharma', email: 'priya@demo.com', specialty: 'Dermatologist', experience: 10, rating: 4.5, reviews: 120, fee: 600, hospital: 'City Care', location: 'Delhi', location_type: 'online', availability: 'Tue-Sat, 10AM-6PM' },
      { name: 'Dr. Amit Patel', email: 'amit@demo.com', specialty: 'Pediatrician', experience: 8, rating: 4.9, reviews: 310, fee: 500, hospital: 'Sunrise Kids', location: 'Ahmedabad', location_type: 'clinic', availability: 'Mon-Wed, 8AM-2PM' },
      { name: 'Dr. Sneha Reddy', email: 'sneha@demo.com', specialty: 'Orthopedic', experience: 12, rating: 4.7, reviews: 150, fee: 900, hospital: 'Bone & Joint Clinic', location: 'Hyderabad', location_type: 'clinic', availability: 'Mon-Fri, 10AM-4PM' },
      { name: 'Dr. Anil Kapoor', email: 'anil@demo.com', specialty: 'General Physician', experience: 20, rating: 4.6, reviews: 500, fee: 400, hospital: 'HealWell Care', location: 'Pune', location_type: 'online', availability: 'Weekends, 9AM-9PM' }
    ];
    
    const doctors = await Doctor.bulkCreate(doctorsData);

    const hashDoc = await bcrypt.hash('doc1234', 10);
    for (let d of doctorsData) {
      await User.create({ name: d.name, email: d.email, password: hashDoc, role: 'doctor' });
    }

    
    // Create Medicines
    await Medicine.bulkCreate([
      { name: 'Paracetamol 500mg', category: 'painkiller', manufacturer: 'Cipla', price: 25.50, description: 'Pain relief and fever reducer', dosage_form: 'tablet', stock: 500 },
      { name: 'Amoxicillin 250mg', category: 'antibiotic', manufacturer: 'Sun Pharma', price: 120.00, description: 'Treats bacterial infections', dosage_form: 'capsule', stock: 200 },
      { name: 'Aspirin 75mg', category: 'painkiller', manufacturer: 'Bayer', price: 40.00, description: 'Blood thinner and pain relief', dosage_form: 'tablet', stock: 350 },
      { name: 'Vitamin C 500mg', category: 'vitamin', manufacturer: 'GSK', price: 60.00, description: 'Immunity booster', dosage_form: 'tablet', stock: 1000 },
      { name: 'Cough Syrup 100ml', category: 'syrup', manufacturer: 'Dabur', price: 85.00, description: 'Relieves dry and wet cough', dosage_form: 'syrup', stock: 150 }
    ]);

    // Create Appointments for Demo Patient
    await Appointment.bulkCreate([
      { user_id: demoPatient.id, doctor_id: doctors[0].id, date: '2026-05-20', time: '10:00 AM', type: 'in-person', reason: 'Chest pain consultation', status: 'upcoming' },
      { user_id: demoPatient.id, doctor_id: doctors[1].id, date: '2026-05-25', time: '11:00 AM', type: 'online', reason: 'Skin rash', status: 'upcoming' },
      { user_id: demoPatient.id, doctor_id: doctors[2].id, date: '2025-10-10', time: '09:00 AM', type: 'in-person', reason: 'Fever', status: 'completed', diagnosis: 'Viral fever' },
      { user_id: demoPatient.id, doctor_id: doctors[3].id, date: '2025-08-15', time: '02:00 PM', type: 'in-person', reason: 'Knee pain', status: 'completed', diagnosis: 'Minor sprain' },
      { user_id: demoPatient.id, doctor_id: doctors[4].id, date: '2025-01-20', time: '04:00 PM', type: 'online', reason: 'General checkup', status: 'completed', diagnosis: 'Healthy' }
    ]);

    // Create Prescriptions
    await Prescription.bulkCreate([
      { user_id: demoPatient.id, doctor_id: doctors[2].id, diagnosis: 'Viral fever', medicines: [{name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '5 days'}], issued_date: '2025-10-10', valid_till: '2025-10-15', status: 'expired' },
      { user_id: demoPatient.id, doctor_id: doctors[0].id, diagnosis: 'Mild angina', medicines: [{name: 'Aspirin 75mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days'}], issued_date: '2026-04-15', valid_till: '2026-05-15', status: 'active' }
    ]);

    // Create Lab Reports
    await LabReport.bulkCreate([
      { user_id: demoPatient.id, test_name: 'Complete Blood Count (CBC)', doctor_id: doctors[4].id, test_date: '2025-01-20', results: [{parameter: 'Hemoglobin', value: '14.2', unit: 'g/dL'}], status: 'completed' },
      { user_id: demoPatient.id, test_name: 'Lipid Profile', doctor_id: doctors[0].id, test_date: '2026-04-15', results: [{parameter: 'Cholesterol', value: '190', unit: 'mg/dL'}], status: 'completed' }
    ]);

    // Create Bills
    await Bill.bulkCreate([
      { user_id: demoPatient.id, invoice_number: 'INV-001', subtotal: 800, tax: 144, total: 944, status: 'pending', issue_date: '2026-04-17', due_date: '2026-05-01' },
      { user_id: demoPatient.id, invoice_number: 'INV-002', subtotal: 400, tax: 72, total: 472, status: 'paid', issue_date: '2025-01-20', paid_date: '2025-01-20' }
    ]);

    // Create Notifications
    await Notification.bulkCreate([
      { user_id: demoPatient.id, title: 'Welcome', message: 'Welcome to MediConnect!', type: 'general', is_read: false },
      { user_id: demoPatient.id, title: 'Appointment Reminder', message: 'You have an upcoming appointment tomorrow.', type: 'appointment', is_read: false }
    ]);
    console.log('Dummy data inserted.');

    process.exit(0);
  } catch (error) {
    console.error('Error syncing DB:', error);
    process.exit(1);
  }
}

sync();
