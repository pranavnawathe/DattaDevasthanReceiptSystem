"use strict";
/**
 * Receipt artifact service
 * Creates PDF receipts and uploads to S3
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPDFReceipt = createPDFReceipt;
exports.uploadReceiptToS3 = uploadReceiptToS3;
exports.createAndUploadReceipt = createAndUploadReceipt;
exports.getReceiptDownloadUrl = getReceiptDownloadUrl;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const dynamo_client_1 = require("../db/dynamo-client");
const pdfkit_1 = __importDefault(require("pdfkit"));
const s3Client = new client_s3_1.S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
/**
 * Create a PDF receipt from donation data
 * Generates a bilingual (Marathi/English) PDF receipt
 *
 * @param donation - Donation item
 * @returns PDF as Buffer
 */
async function createPDFReceipt(donation) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
            });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            // Header with temple name
            doc
                .fontSize(20)
                .font('Helvetica-Bold')
                .fillColor('#FF6B35') // Saffron color
                .text('श्री दत्त देवस्थान, साखरपा', { align: 'center' });
            doc
                .fontSize(16)
                .fillColor('#004E89') // Deep blue
                .text('Shri Datta Devasthan, Sakharapa', { align: 'center' });
            doc.moveDown(0.5);
            // Decorative line
            doc
                .strokeColor('#F7B801') // Gold
                .lineWidth(2)
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke();
            doc.moveDown();
            // Receipt header
            doc
                .fontSize(14)
                .fillColor('#000')
                .font('Helvetica-Bold')
                .text('DONATION RECEIPT / देणगी पावती', { align: 'center' });
            doc.moveDown();
            // Receipt number and date
            doc.fontSize(10).font('Helvetica');
            const leftX = 50;
            const rightX = 300;
            const currentY = doc.y;
            doc.text(`Receipt No / पावती क्रमांक:`, leftX, currentY, { continued: true });
            doc.font('Helvetica-Bold').text(` ${donation.receiptNo}`);
            doc.font('Helvetica').text(`Date / दिनांक:`, rightX, currentY, { continued: true });
            doc.font('Helvetica-Bold').text(` ${donation.date}`);
            doc.moveDown(1.5);
            // Donor Details Section
            doc
                .fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#004E89')
                .text('DONOR DETAILS / दातार माहिती');
            doc
                .strokeColor('#E0E0E0')
                .lineWidth(1)
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke();
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').fillColor('#000');
            // Name
            doc.text(`Name / नाव: `, { continued: true });
            doc.font('Helvetica-Bold').text(donation.donor.name);
            // Mobile
            if (donation.donor.mobile) {
                doc.font('Helvetica').text(`Mobile / मोबाइल: `, { continued: true });
                doc.font('Helvetica-Bold').text(donation.donor.mobile);
            }
            // Email
            if (donation.donor.email) {
                doc.font('Helvetica').text(`Email / ईमेल: `, { continued: true });
                doc.font('Helvetica-Bold').text(donation.donor.email);
            }
            // PAN
            if (donation.donor.pan) {
                doc.font('Helvetica').text(`PAN: `, { continued: true });
                doc.font('Helvetica-Bold').text(donation.donor.pan);
            }
            // Address
            if (donation.donor.address) {
                const addr = donation.donor.address;
                const addressLines = [
                    addr.line1,
                    addr.line2,
                    addr.city,
                    addr.state,
                    addr.pincode,
                ].filter(Boolean);
                if (addressLines.length > 0) {
                    doc.font('Helvetica').text(`Address / पत्ता: `, { continued: true });
                    doc.font('Helvetica-Bold').text(addressLines.join(', '));
                }
            }
            doc.moveDown(1.5);
            // Donation Details Section
            doc
                .fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#004E89')
                .text('DONATION DETAILS / दान तपशील');
            doc
                .strokeColor('#E0E0E0')
                .lineWidth(1)
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke();
            doc.moveDown(0.5);
            // Table header
            doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .fillColor('#000');
            const tableTop = doc.y;
            doc.text('Purpose / उद्देश', 50, tableTop);
            doc.text('Amount / रक्कम', 450, tableTop, { width: 100, align: 'right' });
            doc
                .strokeColor('#E0E0E0')
                .lineWidth(0.5)
                .moveTo(50, doc.y + 5)
                .lineTo(545, doc.y + 5)
                .stroke();
            doc.moveDown(0.5);
            // Donation items
            doc.font('Helvetica');
            for (const [purpose, amount] of Object.entries(donation.breakup)) {
                const purposeName = formatPurposeName(purpose);
                const itemY = doc.y;
                doc.text(purposeName, 50, itemY, { width: 350 });
                doc.text(`₹ ${amount.toFixed(2)}`, 450, itemY, { width: 100, align: 'right' });
                doc.moveDown(0.3);
            }
            // Total line
            doc
                .strokeColor('#F7B801')
                .lineWidth(2)
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke();
            doc.moveDown(0.3);
            const totalY = doc.y;
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('TOTAL / एकूण', 50, totalY);
            doc.text(`₹ ${donation.total.toFixed(2)}`, 450, totalY, { width: 100, align: 'right' });
            doc.moveDown(1.5);
            // Payment Details
            doc.fontSize(10).font('Helvetica').fillColor('#000');
            doc.text(`Payment Mode / भरणा पद्धत: `, { continued: true });
            doc.font('Helvetica-Bold').text(donation.payment.mode);
            if (donation.payment.ref) {
                doc.font('Helvetica').text(`Reference / संदर्भ: `, { continued: true });
                doc.font('Helvetica-Bold').text(donation.payment.ref);
            }
            doc.moveDown(1);
            // 80G Notice
            if (donation.eligible80G) {
                doc
                    .fontSize(9)
                    .font('Helvetica-Bold')
                    .fillColor('#06A77D')
                    .text('✓ This donation is eligible for 80G tax deduction');
                doc.text('✓ हा देणगी 80G कर सवलतीसाठी पात्र आहे');
                doc.moveDown();
            }
            // Thank you message
            doc.moveDown(1.5);
            doc
                .fontSize(11)
                .font('Helvetica-BoldOblique')
                .fillColor('#004E89')
                .text('Thank you for your generous contribution!', { align: 'center' });
            doc.text('आपल्या उदार योगदानाबद्दल धन्यवाद!', { align: 'center' });
            // Footer
            doc.moveDown(2);
            doc
                .fontSize(8)
                .font('Helvetica')
                .fillColor('#666')
                .text(`Generated on: ${new Date(donation.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, { align: 'center' });
            doc
                .fontSize(7)
                .text(`Donor ID: ${donation.donorId}`, { align: 'center' });
            // Finalize PDF
            doc.end();
        }
        catch (error) {
            reject(error);
        }
    });
}
/**
 * Upload receipt to S3
 * Stores receipt in receipts/<year>/<receiptNo>.pdf
 *
 * @param receiptNo - Receipt number (e.g., "2025-00071")
 * @param content - Receipt content (PDF buffer)
 * @param contentType - MIME type (default: application/pdf)
 * @returns S3 key where receipt was stored
 */
async function uploadReceiptToS3(receiptNo, content, contentType = 'application/pdf') {
    const bucketName = (0, dynamo_client_1.getReceiptsBucketName)();
    const year = receiptNo.split('-')[0];
    const key = `receipts/${year}/${receiptNo}.pdf`;
    try {
        await s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: content,
            ContentType: contentType,
            Metadata: {
                receiptNo,
                generatedAt: new Date().toISOString(),
            },
        }));
        console.log(`✅ Receipt uploaded to S3: s3://${bucketName}/${key}`);
        return key;
    }
    catch (error) {
        console.error('❌ Failed to upload receipt to S3:', error);
        throw new Error(`Failed to upload receipt: ${error.message}`);
    }
}
/**
 * Create and upload PDF receipt
 * Convenience function that combines creation and upload
 *
 * @param donation - Donation item
 * @returns S3 key where receipt was stored
 */
async function createAndUploadReceipt(donation) {
    const pdfBuffer = await createPDFReceipt(donation);
    const s3Key = await uploadReceiptToS3(donation.receiptNo, pdfBuffer);
    return s3Key;
}
/**
 * Format purpose name for display
 * Converts UPPER_SNAKE_CASE to readable bilingual format
 */
function formatPurposeName(purpose) {
    const purposeMap = {
        'TEMPLE_GENERAL': 'Temple General / मंदिर सामान्य',
        'EDUCATION': 'Education / शिक्षण',
        'ANNADAAN': 'Annadaan / अन्नदान',
        'GAUSHALA': 'Gaushala / गौशाळा',
        'CONSTRUCTION': 'Construction / बांधकाम',
        'FESTIVAL': 'Festival / उत्सव',
        'GENERAL': 'General Donation / सामान्य देणगी',
        'PRASAD': 'Prasad / प्रसाद',
        'POOJA': 'Pooja / पूजा',
        'MAINTENANCE': 'Maintenance / देखभाल',
        'SEVA': 'Seva / सेवा',
        'OTHER': 'Other / इतर',
    };
    return purposeMap[purpose] || purpose.replace(/_/g, ' ');
}
/**
 * Generate presigned URL for downloading receipt from S3
 * Creates a temporary URL valid for 1 hour
 *
 * @param receiptNo - Receipt number (e.g., "2025-00008")
 * @returns Presigned URL for downloading the PDF
 */
async function getReceiptDownloadUrl(receiptNo) {
    const bucketName = (0, dynamo_client_1.getReceiptsBucketName)();
    const year = receiptNo.split('-')[0];
    const key = `receipts/${year}/${receiptNo}.pdf`;
    try {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        // Generate presigned URL valid for 1 hour
        const presignedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, {
            expiresIn: 3600, // 1 hour
        });
        console.log(`✅ Generated presigned URL for receipt: ${receiptNo}`);
        return presignedUrl;
    }
    catch (error) {
        console.error('❌ Failed to generate presigned URL:', error);
        throw new Error(`Failed to generate download URL: ${error.message}`);
    }
}
