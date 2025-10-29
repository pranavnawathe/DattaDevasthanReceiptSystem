"use strict";
/**
 * Receipt artifact service
 * Creates PDF receipts and uploads to S3
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const path = __importStar(require("path"));
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
            // Register Devanagari font
            const fontPath = path.join(__dirname, '../fonts/NotoSansDevanagari.ttf');
            doc.registerFont('Devanagari', fontPath);
            // Header - Guru Datta invocation
            doc
                .fontSize(12)
                .font('Devanagari')
                .fillColor('#8B0000') // Dark red
                .text('|| श्री गुरुदेव दत्त ||', { align: 'center' });
            doc.moveDown(0.3);
            // Temple name - main header
            doc
                .fontSize(18)
                .font('Devanagari')
                .fillColor('#8B0000')
                .text('श्री दत्त देवस्थान कोंडगांव (साखरपा)', { align: 'center' });
            doc.moveDown(0.5);
            // Registration details
            doc.fontSize(9).fillColor('#000');
            const regY = doc.y;
            doc.font('Devanagari').text('रजि. क्र. अे/१२६/रत्नागिरी', 50, regY);
            doc.font('Devanagari').text('पावती क्रमांक', 400, regY, { continued: true });
            doc.font('Helvetica-Bold').text(`: ${donation.receiptNo}`, { continued: false });
            doc.moveDown(0.3);
            const locY = doc.y;
            doc.font('Devanagari').text('ता. संगमेश्वर, जि. रत्नागिरी', 50, locY);
            doc.font('Devanagari').text('तारीख', 400, locY, { continued: true });
            doc.font('Helvetica-Bold').text(`: ${donation.date}`, { continued: false });
            doc.moveDown(0.8);
            // Horizontal line
            doc
                .strokeColor('#8B0000')
                .lineWidth(1.5)
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke();
            doc.moveDown(0.5);
            // Donor name section
            doc.fontSize(10).fillColor('#000');
            doc.font('Devanagari').text('श्री. / सौ. / श्रीमती', 50, doc.y);
            doc.moveDown(0.3);
            // Add donor name with underline
            const nameY = doc.y;
            doc.font('Devanagari').text(donation.donor.name, 50, nameY);
            doc.moveTo(50, nameY + 15).lineTo(545, nameY + 15).stroke();
            doc.moveDown(0.8);
            // "यांजकडून खालील तपशीलाप्रमाणे रक्कम मिळाली."
            doc.font('Devanagari').fontSize(10)
                .text('यांजकडून खालील तपशीलाप्रमाणे रक्कम मिळाली.', 50, doc.y);
            doc.moveDown(0.5);
            // Payment method field
            const paymentMethodMap = {
                'CASH': 'रोख',
                'UPI': 'यूपीआय',
                'CHEQUE': 'धनादेश',
                'NEFT': 'एनईएफटी',
                'IMPS': 'आयएमपीएस',
            };
            const modeString = String(donation.payment.mode);
            const paymentMethod = paymentMethodMap[modeString] || modeString;
            doc.font('Devanagari').fontSize(10);
            doc.text('देणगी पद्धत: ', 50, doc.y, { continued: true });
            doc.font('Devanagari').text(paymentMethod);
            // Reference number if available
            if (donation.payment.ref) {
                doc.font('Devanagari').text('संदर्भ क्रमांक: ', 50, doc.y, { continued: true });
                doc.font('Helvetica').text(donation.payment.ref);
            }
            doc.moveDown(0.8);
            // Table with donation purposes (matching current receipt)
            const tableStartY = doc.y;
            const col1X = 50;
            const col2X = 370;
            const tableWidth = 495;
            const rowHeight = 30;
            const categories = [
                'कार्यम निधी',
                'उत्सव देणगी',
                'धार्मिक कार्य',
                'अन्नदान',
                'इतर'
            ];
            // Draw table headers
            doc.fontSize(10).font('Devanagari').fillColor('#000');
            // Draw outer border
            doc.rect(col1X, tableStartY, tableWidth, rowHeight * (categories.length + 1)).stroke();
            // Header row
            doc.rect(col1X, tableStartY, tableWidth / 2 - 10, rowHeight).stroke();
            doc.rect(col1X + tableWidth / 2 - 10, tableStartY, tableWidth / 2 + 10, rowHeight).stroke();
            doc.text('तपशील', col1X + 10, tableStartY + 10);
            doc.text('रक्कम रुपये', col2X + 10, tableStartY + 10);
            // Map donation breakup to categories
            const categoryMap = {
                'TEMPLE_GENERAL': 'कार्यम निधी',
                'FESTIVAL': 'उत्सव देणगी',
                'POOJA': 'धार्मिक कार्य',
                'ANNADAAN': 'अन्नदान',
                'OTHER': 'इतर'
            };
            // Draw category rows
            categories.forEach((category, index) => {
                const rowY = tableStartY + rowHeight * (index + 1);
                // Draw row lines
                doc.rect(col1X, rowY, tableWidth / 2 - 10, rowHeight).stroke();
                doc.rect(col1X + tableWidth / 2 - 10, rowY, tableWidth / 2 + 10, rowHeight).stroke();
                // Category name
                doc.font('Devanagari').text(category, col1X + 10, rowY + 10);
                // Find matching amount
                let amount = '';
                for (const [purpose, amt] of Object.entries(donation.breakup)) {
                    if (categoryMap[purpose] === category) {
                        amount = `${amt.toFixed(2)}`;
                        break;
                    }
                }
                // Draw dots or amount
                if (amount) {
                    doc.font('Helvetica').text(amount, col2X + 10, rowY + 10);
                }
                else {
                    doc.font('Helvetica').text('.........', col2X + 10, rowY + 10);
                }
            });
            // Add total row with bold styling
            const totalRowY = tableStartY + rowHeight * (categories.length + 1);
            // Draw total row border - make it darker/bolder
            doc.strokeColor('#000').lineWidth(1.5);
            doc.rect(col1X, totalRowY, tableWidth / 2 - 10, rowHeight).stroke();
            doc.rect(col1X + tableWidth / 2 - 10, totalRowY, tableWidth / 2 + 10, rowHeight).stroke();
            // Total label and amount in bold
            doc.fontSize(11).font('Devanagari').fillColor('#000');
            doc.text('एकूण', col1X + 10, totalRowY + 10, { continued: true });
            doc.font('Helvetica-Bold').text(' / Total');
            doc.font('Helvetica-Bold').text(`₹ ${donation.total.toFixed(2)}`, col2X + 10, totalRowY + 10);
            doc.y = totalRowY + rowHeight + 10;
            doc.moveDown(0.8);
            // Amount in words (अक्षरी रक्कम रु.)
            doc.fontSize(10).font('Devanagari').fillColor('#000');
            doc.text('अक्षरी रक्कम रु.: ', 50, doc.y, { continued: true });
            const amountInWordsMarathi = numberToWordsMarathi(donation.total);
            const amountInWordsEnglish = numberToWordsEnglish(donation.total);
            doc.font('Devanagari').text(amountInWordsMarathi);
            doc.fontSize(9).font('Helvetica').fillColor('#666');
            doc.text(`(${amountInWordsEnglish})`, 50, doc.y);
            doc.fillColor('#000');
            doc.moveDown(1.5);
            // Bottom signature section (right-aligned)
            doc.fontSize(10).font('Devanagari').fillColor('#000');
            // First line: स्वीकारणार
            doc.text('स्वीकारणार', 420, doc.y, { align: 'right' });
            doc.moveDown(0.3);
            // Second line: कार्यवाह / अध्यक्ष
            doc.text('कार्यवाह / अध्यक्ष', 420, doc.y, { align: 'right' });
            doc.moveDown(0.3);
            // Third line: Temple name in red
            doc.fontSize(10).font('Devanagari').fillColor('#8B0000');
            doc.text('श्री दत्त देवस्थान कोंडगांव, साखरपा', 420, doc.y, { align: 'right' });
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
 * Convert number to words in English
 */
function numberToWordsEnglish(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    if (num === 0)
        return 'Zero';
    const convert = (n) => {
        if (n < 10)
            return ones[n];
        if (n < 20)
            return teens[n - 10];
        if (n < 100)
            return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        if (n < 1000)
            return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
        if (n < 100000)
            return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
        if (n < 10000000)
            return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    let result = convert(rupees) + ' Rupees';
    if (paise > 0) {
        result += ' and ' + convert(paise) + ' Paise';
    }
    result += ' Only';
    return result;
}
/**
 * Convert number to words in Marathi
 */
function numberToWordsMarathi(num) {
    const ones = ['', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ'];
    const tens = ['', '', 'वीस', 'तीस', 'चाळीस', 'पन्नास', 'साठ', 'सत्तर', 'ऐंशी', 'नव्वद'];
    const teens = ['दहा', 'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणीस'];
    if (num === 0)
        return 'शून्य';
    const convert = (n) => {
        if (n < 10)
            return ones[n];
        if (n < 20)
            return teens[n - 10];
        if (n < 100)
            return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        if (n < 1000)
            return ones[Math.floor(n / 100)] + ' शे' + (n % 100 ? ' ' + convert(n % 100) : '');
        if (n < 100000)
            return convert(Math.floor(n / 1000)) + ' हजार' + (n % 1000 ? ' ' + convert(n % 1000) : '');
        if (n < 10000000)
            return convert(Math.floor(n / 100000)) + ' लाख' + (n % 100000 ? ' ' + convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + ' कोटी' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    let result = convert(rupees) + ' रुपये';
    if (paise > 0) {
        result += ' आणि ' + convert(paise) + ' पैसे';
    }
    result += ' फक्त';
    return result;
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
