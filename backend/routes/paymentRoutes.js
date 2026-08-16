// routes/paymentRoutes.js - Complete Payment System
const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const StudentFee = require('../models/StudentFee');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { generateReceipt } = require('../services/receiptService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// 📸 FILE UPLOAD CONFIGURATION
// ============================================

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/screenshots');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `screenshot-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WEBP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ============================================
// 📌 SUBMIT PAYMENT (Parent/Student)
// ============================================
// routes/paymentRoutes.js - Fix submit payment

router.post('/submit', auth, roleCheck('student', 'parent'), upload.single('screenshot'), async (req, res) => {
  try {
    const { studentFeeId, bankName, referenceNumber, amount, paymentDate } = req.body;
    
    // ✅ Get the student fee to find the student ID
    const studentFee = await StudentFee.findById(studentFeeId);
    if (!studentFee) {
      return res.status(404).json({ success: false, error: 'Student fee not found' });
    }

    // ✅ Check if fee is already paid
    if (studentFee.status === 'paid') {
      return res.status(400).json({ success: false, error: 'This fee is already paid' });
    }

    // ✅ Check reference number
    const existingPayment = await Payment.findOne({ referenceNumber });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: 'Reference number already used. Please enter a valid reference number.',
      });
    }

    // ✅ Check screenshot
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a screenshot of the payment' });
    }

    // ✅ Get the actual student ID from the studentFee
    const actualStudentId = studentFee.studentId; // ✅ THIS IS THE STUDENT'S ID!

    // ✅ Create payment with the STUDENT'S ID
    const payment = new Payment({
      studentFeeId,
      studentId: actualStudentId, // ✅ Use student's ID, not parent's
      amount: amount || studentFee.amount,
      bankName,
      referenceNumber,
      screenshotUrl: `/uploads/screenshots/${req.file.filename}`,
      paymentDate: paymentDate || new Date(),
      status: 'pending',
      // ✅ Store who made the payment (for reference)
      paidBy: req.user.id, // Parent or student who paid
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment submitted successfully! Awaiting confirmation.',
      data: payment,
    });
  } catch (error) {
    console.error('❌ Error submitting payment:', error);
    
    if (error.code === 11000 && error.keyPattern?.referenceNumber) {
      return res.status(400).json({
        success: false,
        error: 'Reference number already used. Please enter a valid reference number.',
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, errors });
    }

    res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
});
// ============================================
// 📌 GET PENDING PAYMENTS (Admin/Finance)
// ============================================
router.get('/admin/pending', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'pending' })
      .populate('studentId', 'name email')
      .populate('studentFeeId', 'feeName amount')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 GET PAYMENT HISTORY (Admin/Finance)
// ============================================
router.get('/admin/history', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const payments = await Payment.find(filter)
      .populate('studentId', 'name email')
      .populate('studentFeeId', 'feeName amount')
      .populate('confirmedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 GET PAYMENT STATISTICS (Admin/Finance)
// ============================================
router.get('/admin/stats', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const totalPending = await Payment.countDocuments({ status: 'pending' });
    const totalConfirmed = await Payment.countDocuments({ status: 'confirmed' });
    const totalRejected = await Payment.countDocuments({ status: 'rejected' });
    
    const totalAmount = await Payment.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        pending: totalPending,
        confirmed: totalConfirmed,
        rejected: totalRejected,
        totalCollected: totalAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 APPROVE PAYMENT (Admin/Finance)
// ============================================
router.put('/:id/approve', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('studentFeeId', 'feeName amount');

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    if (payment.status === 'confirmed') {
      return res.status(400).json({ success: false, error: 'Payment already confirmed' });
    }

    // ✅ Generate receipt number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const receiptNumber = `REC-${year}${month}${day}-${random}`;

    // ✅ Update payment
    payment.status = 'confirmed';
    payment.confirmedBy = req.user.id;
    payment.confirmedAt = new Date();
    payment.receiptNumber = receiptNumber;
    await payment.save();

    // ✅ Update student fee status
    const studentFee = await StudentFee.findById(payment.studentFeeId);
    if (studentFee) {
      studentFee.status = 'paid';
      studentFee.paidAt = new Date();
      await studentFee.save();
    }

    // ✅ Generate PDF Receipt
    const confirmedBy = await User.findById(req.user.id);
    const schoolInfo = {
      name: 'Adama Science and Technology University',
      address: 'Adama, Ethiopia',
      phone: '+251-XXX-XXXX',
    };

    try {
      const receipt = await generateReceipt(payment, payment.studentId, schoolInfo, confirmedBy);
      payment.receiptUrl = receipt.url;
      await payment.save();
    } catch (receiptError) {
      console.error('Receipt generation failed:', receiptError);
      // Payment is still confirmed even if receipt fails
    }

    // ✅ Populate for response
    const populatedPayment = await Payment.findById(payment._id)
      .populate('studentId', 'name email')
      .populate('studentFeeId', 'feeName amount')
      .populate('confirmedBy', 'name email');

    res.json({
      success: true,
      message: 'Payment confirmed! Receipt generated.',
      data: populatedPayment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 REJECT PAYMENT (Admin/Finance)
// ============================================
router.put('/:id/reject', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    if (payment.status === 'confirmed') {
      return res.status(400).json({ success: false, error: 'Cannot reject a confirmed payment' });
    }

    payment.status = 'rejected';
    payment.rejectionReason = reason || 'Payment rejected';
    await payment.save();

    res.json({
      success: true,
      message: 'Payment rejected',
      data: payment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 GET MY PAYMENTS (Parent/Student)
// ============================================
router.get('/my-payments', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ studentId: req.user.id })
      .populate('studentFeeId', 'feeName amount')
      .populate('confirmedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 DOWNLOAD RECEIPT
// ============================================
router.get('/:id/receipt', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // ✅ Check if user has access
    if (req.user.id !== payment.studentId.toString() && 
        !['admin', 'finance_officer'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!payment.receiptUrl) {
      return res.status(404).json({ success: false, error: 'Receipt not found' });
    }

    const filePath = path.join(__dirname, '..', payment.receiptUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Receipt file not found' });
    }

    res.download(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;