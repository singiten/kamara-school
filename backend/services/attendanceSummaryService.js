// services/attendanceSummaryService.js
const Attendance = require('../models/Attendance');
const AttendanceSummary = require('../models/AttendanceSummary');

// ✅ Generate weekly summaries
const generateWeeklySummaries = async (startDate, endDate) => {
  try {
    console.log(`📊 Generating weekly summaries from ${startDate} to ${endDate}`);

    // Find all attendance records in this week
    const records = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    });

    if (records.length === 0) {
      console.log('⚠️ No attendance records found for this week');
      return [];
    }

    // Group by student and class
    const grouped = new Map();

    for (const record of records) {
      for (const r of record.records) {
        const key = `${r.studentId.toString()}-${record.classId.toString()}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            studentId: r.studentId,
            classId: record.classId,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
          });
        }
        const data = grouped.get(key);
        if (data[r.status] !== undefined) {
          data[r.status] += 1;
        }
        data.total += 1;
      }
    }

    // Save summaries
    const summaries = [];
    const weekNumber = getWeekNumber(startDate);
    const academicYear = getAcademicYear(startDate);

    for (const [key, data] of grouped) {
      const summary = new AttendanceSummary({
        studentId: data.studentId,
        classId: data.classId,
        period: 'week',
        periodStart: startDate,
        periodEnd: endDate,
        weekNumber,
        academicYear,
        summary: {
          present: data.present || 0,
          absent: data.absent || 0,
          late: data.late || 0,
          excused: data.excused || 0,
          total: data.total || 0,
          attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
        },
      });
      summaries.push(summary);
    }

    if (summaries.length > 0) {
      await AttendanceSummary.insertMany(summaries);
      console.log(`✅ Created ${summaries.length} weekly summaries`);
    }

    // ✅ Delete daily records for this week
    const result = await Attendance.deleteMany({
      date: { $gte: startDate, $lte: endDate },
    });
    console.log(`🗑️ Deleted ${result.deletedCount} daily records for this week`);

    return summaries;
  } catch (error) {
    console.error('❌ Error generating weekly summaries:', error);
    throw error;
  }
};

// ✅ Generate monthly summaries
const generateMonthlySummaries = async (month, year) => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    console.log(`📊 Generating monthly summaries for ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);

    // Find all weekly summaries for this month
    const weeklySummaries = await AttendanceSummary.find({
      period: 'week',
      periodStart: { $gte: startDate, $lte: endDate },
    });

    if (weeklySummaries.length === 0) {
      console.log('⚠️ No weekly summaries found for this month');
      return [];
    }

    // Group by student and class
    const grouped = new Map();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    for (const summary of weeklySummaries) {
      const key = `${summary.studentId.toString()}-${summary.classId.toString()}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          studentId: summary.studentId,
          classId: summary.classId,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
        });
      }
      const data = grouped.get(key);
      data.present += summary.summary.present;
      data.absent += summary.summary.absent;
      data.late += summary.summary.late;
      data.excused += summary.summary.excused;
      data.total += summary.summary.total;
    }

    // Save monthly summaries
    const summaries = [];
    for (const [key, data] of grouped) {
      const summary = new AttendanceSummary({
        studentId: data.studentId,
        classId: data.classId,
        period: 'month',
        periodStart: startDate,
        periodEnd: endDate,
        month: monthNames[month - 1],
        academicYear: getAcademicYear(startDate),
        summary: {
          present: data.present || 0,
          absent: data.absent || 0,
          late: data.late || 0,
          excused: data.excused || 0,
          total: data.total || 0,
          attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
        },
      });
      summaries.push(summary);
    }

    if (summaries.length > 0) {
      await AttendanceSummary.insertMany(summaries);
      console.log(`✅ Created ${summaries.length} monthly summaries`);
    }

    // ✅ Delete weekly summaries for this month
    const result = await AttendanceSummary.deleteMany({
      period: 'week',
      periodStart: { $gte: startDate, $lte: endDate },
    });
    console.log(`🗑️ Deleted ${result.deletedCount} weekly summaries for this month`);

    return summaries;
  } catch (error) {
    console.error('❌ Error generating monthly summaries:', error);
    throw error;
  }
};

// ✅ Generate semester summaries
const generateSemesterSummaries = async (semester, year) => {
  try {
    console.log(`📊 Generating semester summaries for ${semester} ${year}`);

    let startDate, endDate;
    if (semester === 'Semester 1') {
      startDate = new Date(year, 8, 1); // September 1
      endDate = new Date(year, 11, 31); // December 31
    } else {
      startDate = new Date(year, 0, 1); // January 1
      endDate = new Date(year, 5, 30); // June 30
    }

    // Find all monthly summaries for this semester
    const monthlySummaries = await AttendanceSummary.find({
      period: 'month',
      periodStart: { $gte: startDate, $lte: endDate },
    });

    if (monthlySummaries.length === 0) {
      console.log('⚠️ No monthly summaries found for this semester');
      return [];
    }

    // Group by student and class
    const grouped = new Map();
    for (const summary of monthlySummaries) {
      const key = `${summary.studentId.toString()}-${summary.classId.toString()}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          studentId: summary.studentId,
          classId: summary.classId,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
        });
      }
      const data = grouped.get(key);
      data.present += summary.summary.present;
      data.absent += summary.summary.absent;
      data.late += summary.summary.late;
      data.excused += summary.summary.excused;
      data.total += summary.summary.total;
    }

    // Save semester summaries
    const summaries = [];
    const academicYear = getAcademicYear(startDate);
    for (const [key, data] of grouped) {
      const summary = new AttendanceSummary({
        studentId: data.studentId,
        classId: data.classId,
        period: 'semester',
        periodStart: startDate,
        periodEnd: endDate,
        semester: semester,
        academicYear,
        summary: {
          present: data.present || 0,
          absent: data.absent || 0,
          late: data.late || 0,
          excused: data.excused || 0,
          total: data.total || 0,
          attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
        },
      });
      summaries.push(summary);
    }

    if (summaries.length > 0) {
      await AttendanceSummary.insertMany(summaries);
      console.log(`✅ Created ${summaries.length} semester summaries`);
    }

    // ✅ Delete monthly summaries for this semester
    const result = await AttendanceSummary.deleteMany({
      period: 'month',
      periodStart: { $gte: startDate, $lte: endDate },
    });
    console.log(`🗑️ Deleted ${result.deletedCount} monthly summaries for this semester`);

    return summaries;
  } catch (error) {
    console.error('❌ Error generating semester summaries:', error);
    throw error;
  }
};

// ✅ Helper functions
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

const getAcademicYear = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (month >= 9) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
};

module.exports = {
  generateWeeklySummaries,
  generateMonthlySummaries,
  generateSemesterSummaries,
};