// services/receiptService.js - COMPLETE WITH LOGO & STAMP

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// ✅ School Information
const SCHOOL_NAME = 'Kamara School';
const SCHOOL_TAGLINE = 'Empowering Ethiopian Futures';
const SCHOOL_ADDRESS = 'Adama, Ethiopia';
const SCHOOL_PHONE = '+251-XXX-XXXX';
const SCHOOL_EMAIL = 'info@kamaraschool.edu.et';

// ✅ Asset paths
const ASSETS_DIR = path.join(__dirname, '../assets');
const LOGO_PATH = path.join(ASSETS_DIR, 'logo.png');
const STAMP_PATH = path.join(ASSETS_DIR, 'stamp.png');

// ✅ Ensure receipts directory exists
const receiptsDir = path.join(__dirname, '../uploads/receipts');
if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
}

/**
 * Generate a PDF receipt for a confirmed payment
 */
const generateReceipt = async (payment, student, schoolInfo, confirmedBy) => {
    try {
        const filename = `receipt-${payment.receiptNumber || payment._id}.pdf`;
        const filePath = path.join(receiptsDir, filename);
        const url = `/uploads/receipts/${filename}`;

        // ✅ Create PDF
        const doc = new PDFDocument({ 
            margin: 50,
            size: 'A4',
            layout: 'portrait',
        });
        
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // ============================================
        // 📌 HEADER WITH LOGO
        // ============================================
        
        // ✅ Try to load logo
        let logoLoaded = false;
        if (fs.existsSync(LOGO_PATH)) {
            try {
                doc.image(LOGO_PATH, 50, 40, { width: 70, height: 70 });
                logoLoaded = true;
            } catch (err) {
                console.warn('⚠️ Could not load logo:', err.message);
            }
        }

        // ✅ School Name & Info (adjust position based on logo)
        const titleX = logoLoaded ? 130 : 50;
        const titleY = logoLoaded ? 40 : 50;
        
        doc
            .fontSize(18)
            .font('Helvetica-Bold')
            .fillColor('#1a237e')
            .text(SCHOOL_NAME, titleX, titleY, { align: logoLoaded ? 'left' : 'center' })
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#424242')
            .text(SCHOOL_TAGLINE, titleX, titleY + 22, { align: logoLoaded ? 'left' : 'center' })
            .fontSize(8)
            .fillColor('#757575')
            .text(`${SCHOOL_ADDRESS} | Phone: ${SCHOOL_PHONE} | Email: ${SCHOOL_EMAIL}`, 
                titleX, titleY + 38, { align: logoLoaded ? 'left' : 'center' });

        // ✅ Divider Line
        doc
            .strokeColor('#1a237e')
            .lineWidth(1.5)
            .moveTo(50, 120)
            .lineTo(550, 120)
            .stroke()
            .moveDown(1);

        // ============================================
        // 📌 RECEIPT TITLE
        // ============================================
        
        doc
            .fontSize(16)
            .font('Helvetica-Bold')
            .fillColor('#1a237e')
            .text('PAYMENT RECEIPT', { align: 'center' })
            .moveDown(0.5);

        // ✅ Receipt Number & Date
        doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#424242')
            .text(`Receipt No: ${payment.receiptNumber || 'N/A'}`, { align: 'right' })
            .text(`Date: ${new Date(payment.confirmedAt || Date.now()).toLocaleDateString('en-ET', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`, { align: 'right' })
            .moveDown(0.5);

        // ============================================
        // 📌 PAYMENT DETAILS TABLE
        // ============================================
        
        const tableTop = doc.y + 10;
        const col1X = 50;
        const col2X = 200;
        const col3X = 350;
        const rowHeight = 25;

        // ✅ Table Header
        doc
            .rect(50, tableTop, 500, rowHeight)
            .fill('#1a237e')
            .fillColor('#ffffff')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Description', col1X + 10, tableTop + 8)
            .text('Details', col2X + 10, tableTop + 8)
            .fillColor('#1a237e');

        // ✅ Table Rows
        const rows = [
            ['Student Name:', student?.name || 'N/A'],
            ['Student Class:', student?.class || 'N/A'],
            ['Fee Name:', payment.studentFeeId?.feeName || 'N/A'],
            ['Amount Paid:', `ETB ${payment.amount || 0}`],
            ['Payment Method:', payment.bankName || 'N/A'],
            ['Reference:', payment.referenceNumber || 'N/A'],
            ['Status:', 'CONFIRMED'],
        ];

        let currentY = tableTop + rowHeight;
        rows.forEach((row, index) => {
            const isAlternate = index % 2 === 0;
            const bgColor = isAlternate ? '#f5f5f5' : '#ffffff';
            
            doc
                .rect(50, currentY, 500, rowHeight)
                .fill(bgColor)
                .fillColor('#212121')
                .fontSize(9)
                .font('Helvetica')
                .text(row[0], col1X + 10, currentY + 8)
                .text(row[1], col2X + 10, currentY + 8);
            
            currentY += rowHeight;
        });

        // ============================================
        // 📌 STATUS & STAMP SECTION
        // ============================================
        
        const stampSectionY = currentY + 15;

        // ✅ PAID Badge
        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#2e7d32')
            .text('✅ PAID', col1X, stampSectionY);

        // ✅ Confirmed By
        doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#424242')
            .text(`Confirmed by: ${confirmedBy?.name || 'Finance Officer'}`, col1X, stampSectionY + 20);

        // ✅ School Stamp (Right side)
        if (fs.existsSync(STAMP_PATH)) {
            try {
                // Draw stamp with a slight rotation for realism
                const stampSize = 90;
                const stampX = 460;
                const stampY = stampSectionY - 20;
                
                // ✅ Add a circle border around the stamp
                doc
                    .circle(stampX + stampSize/2, stampY + stampSize/2, stampSize/2 + 8)
                    .stroke('#c62828')
                    .lineWidth(1.5);
                
                doc
                    .image(STAMP_PATH, stampX, stampY, { width: stampSize, height: stampSize });
                
                // ✅ Add "OFFICIAL SEAL" text around the stamp
                doc
                    .fontSize(7)
                    .font('Helvetica-Bold')
                    .fillColor('#c62828')
                    .text('OFFICIAL SEAL', stampX + 12, stampY + stampSize + 5, { 
                        width: stampSize - 24, 
                        align: 'center' 
                    });
            } catch (err) {
                console.warn('⚠️ Could not load stamp:', err.message);
            }
        }

        // ============================================
        // 📌 FOOTER
        // ============================================
        
        const footerY = Math.max(stampSectionY + 120, 650);
        
        doc
            .strokeColor('#1a237e')
            .lineWidth(1)
            .moveTo(50, footerY)
            .lineTo(550, footerY)
            .stroke()
            .moveDown(0.5);

        doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#757575')
            .text('This is a computer-generated receipt. No signature required.', { align: 'center' })
            .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
            .moveDown(0.3)
            .text(`© ${new Date().getFullYear()} ${SCHOOL_NAME}. All rights reserved.`, { align: 'center' });

        // ✅ Finalize PDF
        doc.end();

        // ✅ Wait for file to be written
        await new Promise((resolve) => {
            writeStream.on('finish', resolve);
        });

        console.log(`✅ Receipt generated: ${filename}`);
        return { url, filePath, filename };

    } catch (error) {
        console.error('❌ Error generating receipt:', error);
        throw error;
    }
};

module.exports = { generateReceipt };