// routes/financeOfficerRoutes.js - COMPLETE WITH ALL FIXES

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FeeStructure = require('../models/FeeStructure');
const StudentFee = require('../models/StudentFee');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { generateReceipt } = require('../services/receiptService');

// ============================================
// 📌 HELPER FUNCTIONS
// ============================================

const isFeeOverdue = (fee) => {
  const now = new Date();
  const deadline = new Date(fee.endDate || fee.dueDate);
  deadline.setDate(deadline.getDate() + (fee.gracePeriodDays || 0));
  return now > deadline;
};

const calculateTotalAmount = (fee) => {
  let total = fee.amount || 0;
  if (isFeeOverdue(fee)) {
    total += (fee.lateFeeAmount || 0);
  }
  return total;
};

// ============================================
// 📌 GET STUDENT FEES FOR PARENT
// ============================================

router.get('/parent/student-fees', auth, async (req, res) => {
  try {
    const { studentId } = req.query;
    
    console.log('📥 Parent fetching fees for student:', studentId);
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Student ID is required'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (user.role === 'student' && user._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own fees'
      });
    }
    
    if (user.role === 'parent') {
      const isChild = user.children.some((child) => child.toString() === studentId);
      if (!isChild) {
        return res.status(403).json({
          success: false,
          error: 'You can only view your children\'s fees'
        });
      }
    }

    const studentFees = await StudentFee.find({ studentId })
      .populate('feeStructureId', 'name description feeType')
      .sort({ dueDate: 1 });

    console.log(`📊 Found ${studentFees.length} fees for student`);

    const feesWithStatus = studentFees.map(fee => {
      const now = new Date();
      const deadline = new Date(fee.endDate || fee.dueDate);
      deadline.setDate(deadline.getDate() + (fee.gracePeriodDays || 0));
      const isOverdue = now > deadline;
      
      return {
        _id: fee._id,
        feeName: fee.feeName,
        amount: fee.amount,
        status: fee.status,
        dueDate: fee.dueDate,
        startDate: fee.startDate,
        endDate: fee.endDate,
        lateFeeAmount: fee.lateFeeAmount || 0,
        gracePeriodDays: fee.gracePeriodDays || 0,
        isOverdue: isOverdue,
        totalAmount: fee.amount + (isOverdue ? (fee.lateFeeAmount || 0) : 0),
        isLateFeeApplied: isOverdue && (fee.lateFeeAmount || 0) > 0,
      };
    });

    res.json({
      success: true,
      count: feesWithStatus.length,
      data: feesWithStatus,
    });

  } catch (error) {
    console.error('❌ Error fetching student fees for parent:', error);
    res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
});

// ============================================
// 📌 GET PAYMENTS FOR PARENT
// ============================================

router.get('/parent/payments', auth, async (req, res) => {
  try {
    const { studentId } = req.query;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Student ID is required'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (user.role === 'parent') {
      const isChild = user.children.some((child) => child.toString() === studentId);
      if (!isChild) {
        return res.status(403).json({
          success: false,
          error: 'You can only view your children\'s payments'
        });
      }
    } else if (user.role === 'student' && user._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own payments'
      });
    }

    const payments = await Payment.find({ studentId })
      .populate({
        path: 'studentId',
        select: 'name email class'
      })
      .populate('studentFeeId', 'feeName amount')
      .populate('confirmedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error('❌ Error fetching parent payments:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 CREATE FEE STRUCTURE
// ============================================

router.post('/fee-structures', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const { 
      name, 
      description, 
      amount, 
      feeType, 
      classLevel, 
      semester, 
      academicYear,
      startDate,
      endDate,
      lateFeeAmount,
      gracePeriodDays,
    } = req.body;

    console.log('📥 Creating fee with data:', req.body);

    if (!name || !amount || !feeType || !classLevel || !semester || !academicYear) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        error: 'End date must be after start date'
      });
    }

    const feeStructure = new FeeStructure({
      name,
      description: description || '',
      amount: parseFloat(amount),
      feeType,
      classLevel,
      semester,
      academicYear,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      dueDate: new Date(endDate),
      lateFeeAmount: parseFloat(lateFeeAmount) || 0,
      gracePeriodDays: parseInt(gracePeriodDays) || 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await feeStructure.save();
    console.log('✅ Fee structure created:', feeStructure._id);

    // ✅ Auto-assign to students
    let assignedCount = 0;
    const assignedStudents = [];

    console.log(`🔍 Finding students in class level: ${classLevel}`);
    
    const students = await User.find({
      role: 'student',
      classLevel: classLevel,
    });

    console.log(`👨‍🎓 Found ${students.length} students in ${classLevel}`);

    if (students.length > 0) {
      for (const student of students) {
        const existing = await StudentFee.findOne({
          studentId: student._id,
          feeStructureId: feeStructure._id,
          semester: semester,
          academicYear: academicYear,
        });

        if (existing) {
          console.log(`⏭️ Fee already assigned to ${student.name}`);
          continue;
        }

        const studentFee = new StudentFee({
          studentId: student._id,
          feeStructureId: feeStructure._id,
          amount: parseFloat(amount),
          feeName: name,
          feeType: feeType,
          classLevel: classLevel,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          dueDate: new Date(endDate),
          lateFeeAmount: parseFloat(lateFeeAmount) || 0,
          gracePeriodDays: parseInt(gracePeriodDays) || 0,
          semester: semester,
          academicYear: academicYear,
          status: 'pending',
        });

        await studentFee.save();
        assignedCount++;
        assignedStudents.push({ id: student._id, name: student.name });
        console.log(`✅ Assigned fee to ${student.name}`);
      }
    }

    console.log(`✅ Assigned to ${assignedCount} students`);

    res.status(201).json({ 
      success: true, 
      message: `Fee structure created successfully! Assigned to ${assignedCount} students.`, 
      data: {
        feeStructure,
        assignedCount: assignedCount,
        assignedStudents: assignedStudents,
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating fee:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, errors });
    }
    
    res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
});

// ============================================
// 📌 GET ALL FEE STRUCTURES
// ============================================

router.get('/fee-structures', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const { classLevel, isActive } = req.query;
    const filter = {};
    
    if (classLevel) filter.classLevel = classLevel;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const feeStructures = await FeeStructure.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: feeStructures.length, data: feeStructures });
  } catch (error) {
    console.error('❌ Error fetching fees:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 GET STUDENT FEES (Admin/Finance)
// ============================================

router.get('/student-fees', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const { studentId, status } = req.query;
    const filter = {};
    
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    const studentFees = await StudentFee.find(filter)
      .populate('studentId', 'name email class')
      .populate('feeStructureId', 'name amount feeType startDate endDate lateFeeAmount gracePeriodDays')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: studentFees.length, data: studentFees });
  } catch (error) {
    console.error('❌ Error fetching student fees:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 GET ALL PAYMENTS - FIXED
// ============================================

router.get('/payments', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const { status, studentId } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (studentId) filter.studentId = studentId;

    const payments = await Payment.find(filter)
      .populate({
        path: 'studentId',
        select: 'name email class role',
        populate: {
          path: 'parentId',
          select: 'name email phone'
        }
      })
      .populate('paidBy', 'name email')
      .populate('studentFeeId', 'feeName amount')
      .populate('confirmedBy', 'name email')
      .sort({ createdAt: -1 });
      
    const transformedPayments = payments.map(payment => {
      const paymentObj = payment.toObject();
      const student = payment.studentId;
      const payer = payment.paidBy;
      
      const paidFor = student?.name || 'Unknown';
      let paidBy = payer?.name || student?.name || 'Unknown';
      
      if (payer?.role === 'parent') {
        paidBy = payer.name;
      }
      
      return {
        ...paymentObj,
        paidBy,
        paidFor,
        studentName: student?.name || 'N/A',
        parentName: student?.parentId?.name || null,
        payerName: payer?.name || null,
      };
    });
    
    res.json({ 
      success: true, 
      count: transformedPayments.length, 
      data: transformedPayments 
    });
  } catch (error) {
    console.error('❌ Error fetching payments:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 GET SINGLE PAYMENT - FIXED
// ============================================

router.get('/payments/:id', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id)
      .populate({
        path: 'studentId',
        select: 'name email class role',
        populate: {
          path: 'parentId',
          select: 'name email phone'
        }
      })
      .populate('paidBy', 'name email') // ✅ ADD THIS
      .populate('studentFeeId', 'feeName amount')
      .populate('confirmedBy', 'name email');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    const paymentObj = payment.toObject();
    const student = payment.studentId;
    const payer = payment.paidBy;
    
    const paidFor = student?.name || 'Unknown';
    let paidBy = payer?.name || student?.name || 'Unknown';
    
    if (payer?.role === 'parent') {
      paidBy = payer.name;
    }
    
    res.json({
      success: true,
      data: {
        ...paymentObj,
        paidBy,
        paidFor,
        studentName: student?.name || 'N/A',
        parentName: student?.parentId?.name || null,
        payerName: payer?.name || null,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching payment:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 CONFIRM PAYMENT - FIXED



// 📌 CONFIRM PAYMENT - WITH RECEIPT GENERATION
router.put('/payments/:id/confirm', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const payment = await Payment.findById(id)
      .populate('studentId', 'name email class')
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
    payment.receiptNumber = `REC-${year}${month}${day}-${random}`;

    payment.status = 'confirmed';
    payment.confirmedBy = req.user.id;
    payment.confirmedAt = new Date();
    if (notes) payment.notes = notes;

    // ✅ Generate receipt file
  const schoolInfo = {
      name: 'Kamara School',
      address: 'Adama, Ethiopia',
      phone: '+251-XXX-XXXX',
    };

    try {
      const confirmedBy = await User.findById(req.user.id);
      const receipt = await generateReceipt(payment, payment.studentId, schoolInfo, confirmedBy);
      payment.receiptUrl = receipt.url;
    } catch (receiptError) {
      console.error('⚠️ Receipt generation failed:', receiptError.message);
    }

    await payment.save();

    // ✅ Update student fee status
    const studentFee = await StudentFee.findById(payment.studentFeeId);
    if (studentFee) {
      studentFee.status = 'paid';
      studentFee.paidAt = new Date();
      await studentFee.save();
    }

    // ✅ Get updated stats
    const pendingCount = await Payment.countDocuments({ status: 'pending' });
    const confirmedCount = await Payment.countDocuments({ status: 'confirmed' });
    const rejectedCount = await Payment.countDocuments({ status: 'rejected' });
    const totalCollected = await Payment.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({ 
      success: true, 
      message: 'Payment confirmed!', 
      data: {
        payment,
        stats: {
          pending: pendingCount,
          confirmed: confirmedCount,
          rejected: rejectedCount,
          totalCollected: totalCollected[0]?.total || 0,
        }
      }
    });
  } catch (error) {
    console.error('❌ Error confirming payment:', error);
    res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
});

// ============================================
// 📌 REJECT PAYMENT - FIXED
// ============================================

router.put('/payments/:id/reject', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    if (payment.status === 'confirmed') {
      return res.status(400).json({ success: false, error: 'Cannot reject a confirmed payment' });
    }

    payment.status = 'rejected';
    payment.rejectionReason = reason || 'Payment rejected';
    await payment.save();

    const pendingCount = await Payment.countDocuments({ status: 'pending' });
    const confirmedCount = await Payment.countDocuments({ status: 'confirmed' });
    const rejectedCount = await Payment.countDocuments({ status: 'rejected' });
    const totalCollected = await Payment.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({ 
      success: true, 
      message: 'Payment rejected!', 
      data: {
        payment,
        stats: {
          pending: pendingCount,
          confirmed: confirmedCount,
          rejected: rejectedCount,
          totalCollected: totalCollected[0]?.total || 0,
        }
      }
    });
  } catch (error) {
    console.error('❌ Error rejecting payment:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 GET REVENUE SUMMARY
// ============================================

router.get('/revenue', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const pendingCount = await Payment.countDocuments({ status: 'pending' });
    const confirmedCount = await Payment.countDocuments({ status: 'confirmed' });
    const rejectedCount = await Payment.countDocuments({ status: 'rejected' });
    const totalCollected = await Payment.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        pending: pendingCount,
        confirmed: confirmedCount,
        rejected: rejectedCount,
        totalCollected: totalCollected[0]?.total || 0,
      }
    });
  } catch (error) {
    console.error('❌ Error fetching revenue:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 TOGGLE FEE ACTIVE STATUS
// ============================================

router.patch('/fee-structures/:id/toggle', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const feeStructure = await FeeStructure.findById(id);
    if (!feeStructure) {
      return res.status(404).json({ success: false, error: 'Fee structure not found' });
    }

    feeStructure.isActive = !feeStructure.isActive;
    feeStructure.updatedAt = new Date();
    
    if (!feeStructure.dueDate) {
      feeStructure.dueDate = feeStructure.endDate || new Date();
    }
    
    await feeStructure.save();

    res.json({
      success: true,
      message: `Fee ${feeStructure.isActive ? 'activated' : 'deactivated'} successfully!`,
      data: feeStructure,
    });
  } catch (error) {
    console.error('❌ Error toggling fee:', error);
    res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
});

// ============================================
// 📌 DELETE FEE STRUCTURE
// ============================================

router.delete('/fee-structures/:id', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const { id } = req.params;

    const assignedFees = await StudentFee.findOne({ feeStructureId: id });
    if (assignedFees) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete: This fee is already assigned to students',
      });
    }

    const feeStructure = await FeeStructure.findByIdAndDelete(id);
    
    if (!feeStructure) {
      return res.status(404).json({ success: false, error: 'Fee structure not found' });
    }

    res.json({
      success: true,
      message: 'Fee structure deleted successfully!',
    });
  } catch (error) {
    console.error('❌ Error deleting fee:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 DASHBOARD STATS - FIXED
// ============================================

router.get('/dashboard/stats', auth, roleCheck('admin', 'finance_officer'), async (req, res) => {
  try {
    const confirmedPayments = await Payment.find({ status: 'confirmed' });
    const totalCollected = confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const pendingPayments = await Payment.find({ status: 'pending' });
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const overdueFees = await StudentFee.find({ status: 'overdue' });
    const overdueAmount = overdueFees.reduce((sum, f) => sum + (f.amount || 0), 0);
    
    const totalFees = await StudentFee.countDocuments();
    const paidFees = await StudentFee.countDocuments({ status: 'paid' });
    const collectionRate = totalFees > 0 ? (paidFees / totalFees) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalCollected: totalCollected || 0,
        pendingAmount: pendingAmount || 0,
        overdueAmount: overdueAmount || 0,
        collectionRate: Math.round(collectionRate * 100) / 100 || 0,
        totalFees,
        paidFees,
        pendingCount: await Payment.countDocuments({ status: 'pending' }),
      }
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});


// 📌 DOWNLOAD RECEIPT - FIXED
router.get('/payments/:id/receipt', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    if (!payment.receiptNumber) {
      return res.status(404).json({ success: false, error: 'Receipt not available for this payment' });
    }

    // ✅ Check if user has access
    const user = await User.findById(req.user.id);
    if (user.role === 'student' && user._id.toString() !== payment.studentId.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    if (user.role === 'parent') {
      const isChild = user.children.some(child => child.toString() === payment.studentId.toString());
      if (!isChild && user.role !== 'admin' && user.role !== 'finance_officer') {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    // ✅ Try to find the receipt file
    const filename = `receipt-${payment.receiptNumber}.pdf`;
    let filePath = path.join(__dirname, '../uploads/receipts', filename);
    
    // ✅ If not found with receipt number, try with payment ID
    if (!fs.existsSync(filePath)) {
      const altFilename = `receipt-${payment._id}.pdf`;
      const altPath = path.join(__dirname, '../uploads/receipts', altFilename);
      if (fs.existsSync(altPath)) {
        filePath = altPath;
      } else {
        // ✅ If still not found, check if receiptUrl exists in database
        if (payment.receiptUrl) {
          const dbPath = path.join(__dirname, '..', payment.receiptUrl);
          if (fs.existsSync(dbPath)) {
            filePath = dbPath;
          } else {
            return res.status(404).json({ success: false, error: 'Receipt file not found' });
          }
        } else {
          return res.status(404).json({ success: false, error: 'Receipt file not found' });
        }
      }
    }
    
    // ✅ Send the file
    res.download(filePath, `receipt-${payment.receiptNumber || payment._id}.pdf`);
    
  } catch (error) {
    console.error('❌ Error downloading receipt:', error);
    res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
});
module.exports = router;