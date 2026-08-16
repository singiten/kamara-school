// scheduler.js - Automated cron jobs for attendance summaries
const cron = require('node-cron');
const {
  generateWeeklySummaries,
  generateMonthlySummaries,
  generateSemesterSummaries,
} = require('./services/attendanceSummaryService');

// ============================================
// 📅 CRON SCHEDULES
// ============================================

// ✅ 1. Weekly Summaries - Every Sunday at 11:59 PM
cron.schedule('59 23 * * 0', async () => {
  console.log('📊 [CRON] Running weekly summary generation...');
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    await generateWeeklySummaries(startOfWeek, endOfWeek);
    console.log('✅ [CRON] Weekly summaries generated successfully!');
  } catch (error) {
    console.error('❌ [CRON] Error generating weekly summaries:', error);
  }
});

// ✅ 2. Monthly Summaries - 1st of every month at 11:59 PM
cron.schedule('59 23 1 * *', async () => {
  console.log('📊 [CRON] Running monthly summary generation...');
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    await generateMonthlySummaries(month, year);
    console.log('✅ [CRON] Monthly summaries generated successfully!');
  } catch (error) {
    console.error('❌ [CRON] Error generating monthly summaries:', error);
  }
});

// ✅ 3. Semester Summaries - January 15 & July 15 at 11:59 PM
cron.schedule('59 23 15 1 *', async () => {
  console.log('📊 [CRON] Running Semester 1 summary generation...');
  try {
    const year = new Date().getFullYear();
    await generateSemesterSummaries('Semester 1', year);
    console.log('✅ [CRON] Semester 1 summaries generated successfully!');
  } catch (error) {
    console.error('❌ [CRON] Error generating Semester 1 summaries:', error);
  }
});

cron.schedule('59 23 15 7 *', async () => {
  console.log('📊 [CRON] Running Semester 2 summary generation...');
  try {
    const year = new Date().getFullYear();
    await generateSemesterSummaries('Semester 2', year);
    console.log('✅ [CRON] Semester 2 summaries generated successfully!');
  } catch (error) {
    console.error('❌ [CRON] Error generating Semester 2 summaries:', error);
  }
});

// ✅ 4. Annual Summaries - December 31 at 11:59 PM
cron.schedule('59 23 31 12 *', async () => {
  console.log('📊 [CRON] Running annual summary generation...');
  try {
    // Annual summaries combine semester summaries
    // We can use the semester summaries as the annual data
    const year = new Date().getFullYear();
    // Generate both semesters and combine
    await generateSemesterSummaries('Semester 1', year);
    await generateSemesterSummaries('Semester 2', year);
    console.log('✅ [CRON] Annual summaries generated successfully!');
  } catch (error) {
    console.error('❌ [CRON] Error generating annual summaries:', error);
  }
});

console.log('✅ Attendance Summary Cron Jobs Scheduled:');
console.log('  📅 Weekly: Every Sunday at 11:59 PM');
console.log('  📅 Monthly: 1st of every month at 11:59 PM');
console.log('  📅 Semester 1: January 15 at 11:59 PM');
console.log('  📅 Semester 2: July 15 at 11:59 PM');
console.log('  📅 Annual: December 31 at 11:59 PM');

module.exports = cron;