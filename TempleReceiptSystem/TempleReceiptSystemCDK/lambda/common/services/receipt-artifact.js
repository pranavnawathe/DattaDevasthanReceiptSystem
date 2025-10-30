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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPDFReceipt = createPDFReceipt;
exports.uploadReceiptToS3 = uploadReceiptToS3;
exports.createAndUploadReceipt = createAndUploadReceipt;
exports.getReceiptDownloadUrl = getReceiptDownloadUrl;
var client_s3_1 = require("@aws-sdk/client-s3");
var s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
var dynamo_client_1 = require("../db/dynamo-client");
var pdfkit_1 = __importDefault(require("pdfkit"));
var path = __importStar(require("path"));
var s3Client = new client_s3_1.S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
/**
 * Create a PDF receipt from donation data
 * Generates a bilingual (Marathi/English) PDF receipt
 *
 * @param donation - Donation item
 * @returns PDF as Buffer
 */
function createPDFReceipt(donation) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    try {
                        var doc_1 = new pdfkit_1.default({
                            size: 'A4',
                            margins: { top: 50, bottom: 50, left: 50, right: 50 },
                        });
                        var chunks_1 = [];
                        doc_1.on('data', function (chunk) { return chunks_1.push(chunk); });
                        doc_1.on('end', function () { return resolve(Buffer.concat(chunks_1)); });
                        doc_1.on('error', reject);
                        // Register Devanagari font
                        var fontPath = path.join(__dirname, '../fonts/NotoSansDevanagari.ttf');
                        doc_1.registerFont('Devanagari', fontPath);
                        // Header - Guru Datta invocation
                        doc_1
                            .fontSize(12)
                            .font('Devanagari')
                            .fillColor('#8B0000') // Dark red
                            .text('|| श्री गुरुदेव दत्त ||', { align: 'center' });
                        doc_1.moveDown(0.3);
                        // Temple name - main header
                        doc_1
                            .fontSize(18)
                            .font('Devanagari')
                            .fillColor('#8B0000')
                            .text('श्री दत्त देवस्थान कोंडगांव (साखरपा)', { align: 'center' });
                        doc_1.moveDown(0.5);
                        // Registration details
                        doc_1.fontSize(9).fillColor('#000');
                        var regY = doc_1.y;
                        doc_1.font('Devanagari').text('रजि. क्र. अे/१२६/रत्नागिरी', 50, regY);
                        doc_1.font('Devanagari').text('पावती क्रमांक', 400, regY, { continued: true });
                        doc_1.font('Helvetica-Bold').text(": ".concat(donation.receiptNo), { continued: false });
                        doc_1.moveDown(0.3);
                        var locY = doc_1.y;
                        doc_1.font('Devanagari').text('ता. संगमेश्वर, जि. रत्नागिरी', 50, locY);
                        doc_1.font('Devanagari').text('तारीख', 400, locY, { continued: true });
                        doc_1.font('Helvetica-Bold').text(": ".concat(donation.date), { continued: false });
                        doc_1.moveDown(0.8);
                        // Horizontal line
                        doc_1
                            .strokeColor('#8B0000')
                            .lineWidth(1.5)
                            .moveTo(50, doc_1.y)
                            .lineTo(545, doc_1.y)
                            .stroke();
                        doc_1.moveDown(0.5);
                        // Donor name section
                        doc_1.fontSize(10).fillColor('#000');
                        doc_1.font('Devanagari').text('श्री. / सौ. / श्रीमती', 50, doc_1.y);
                        doc_1.moveDown(0.3);
                        // Add donor name with underline
                        var nameY = doc_1.y;
                        doc_1.font('Devanagari').text(donation.donor.name, 50, nameY);
                        doc_1.moveTo(50, nameY + 15).lineTo(545, nameY + 15).stroke();
                        doc_1.moveDown(0.8);
                        // "यांजकडून खालील तपशीलाप्रमाणे रक्कम मिळाली."
                        doc_1.font('Devanagari').fontSize(10)
                            .text('यांजकडून खालील तपशीलाप्रमाणे रक्कम मिळाली.', 50, doc_1.y);
                        doc_1.moveDown(0.5);
                        // Payment method field
                        var paymentMethodMap = {
                            'CASH': 'रोख',
                            'UPI': 'यूपीआय',
                            'CHEQUE': 'धनादेश',
                            'NEFT': 'एनईएफटी',
                            'IMPS': 'आयएमपीएस',
                        };
                        var modeString = String(donation.payment.mode);
                        var paymentMethod = paymentMethodMap[modeString] || modeString;
                        doc_1.font('Devanagari').fontSize(10);
                        doc_1.text('देणगी पद्धत: ', 50, doc_1.y, { continued: true });
                        doc_1.font('Devanagari').text(paymentMethod);
                        // Reference number if available
                        if (donation.payment.ref) {
                            doc_1.font('Devanagari').text('संदर्भ क्रमांक: ', 50, doc_1.y, { continued: true });
                            doc_1.font('Helvetica').text(donation.payment.ref);
                        }
                        doc_1.moveDown(0.8);
                        // Table with donation purposes (matching current receipt)
                        var tableStartY_1 = doc_1.y;
                        var col1X_1 = 50;
                        var col2X_1 = 370;
                        var tableWidth_1 = 495;
                        var rowHeight_1 = 30;
                        var categories = [
                            'कार्यम निधी',
                            'उत्सव देणगी',
                            'धार्मिक कार्य',
                            'अन्नदान',
                            'इतर'
                        ];
                        // Draw table headers
                        doc_1.fontSize(10).font('Devanagari').fillColor('#000');
                        // Draw outer border
                        doc_1.rect(col1X_1, tableStartY_1, tableWidth_1, rowHeight_1 * (categories.length + 1)).stroke();
                        // Header row
                        doc_1.rect(col1X_1, tableStartY_1, tableWidth_1 / 2 - 10, rowHeight_1).stroke();
                        doc_1.rect(col1X_1 + tableWidth_1 / 2 - 10, tableStartY_1, tableWidth_1 / 2 + 10, rowHeight_1).stroke();
                        doc_1.text('तपशील', col1X_1 + 10, tableStartY_1 + 10);
                        doc_1.text('रक्कम रुपये', col2X_1 + 10, tableStartY_1 + 10);
                        // Map donation breakup to categories
                        var categoryMap_1 = {
                            'TEMPLE_GENERAL': 'कार्यम निधी',
                            'FESTIVAL': 'उत्सव देणगी',
                            'POOJA': 'धार्मिक कार्य',
                            'ANNADAAN': 'अन्नदान',
                            'OTHER': 'इतर'
                        };
                        // Draw category rows
                        categories.forEach(function (category, index) {
                            var rowY = tableStartY_1 + rowHeight_1 * (index + 1);
                            // Draw row lines
                            doc_1.rect(col1X_1, rowY, tableWidth_1 / 2 - 10, rowHeight_1).stroke();
                            doc_1.rect(col1X_1 + tableWidth_1 / 2 - 10, rowY, tableWidth_1 / 2 + 10, rowHeight_1).stroke();
                            // Category name
                            doc_1.font('Devanagari').text(category, col1X_1 + 10, rowY + 10);
                            // Find matching amount
                            var amount = '';
                            for (var _i = 0, _a = Object.entries(donation.breakup); _i < _a.length; _i++) {
                                var _b = _a[_i], purpose = _b[0], amt = _b[1];
                                if (categoryMap_1[purpose] === category) {
                                    amount = "".concat(amt.toFixed(2));
                                    break;
                                }
                            }
                            // Draw dots or amount
                            if (amount) {
                                doc_1.font('Helvetica').text(amount, col2X_1 + 10, rowY + 10);
                            }
                            else {
                                doc_1.font('Helvetica').text('.........', col2X_1 + 10, rowY + 10);
                            }
                        });
                        // Add total row with bold styling
                        var totalRowY = tableStartY_1 + rowHeight_1 * (categories.length + 1);
                        // Draw total row border - make it darker/bolder
                        doc_1.strokeColor('#000').lineWidth(1.5);
                        doc_1.rect(col1X_1, totalRowY, tableWidth_1 / 2 - 10, rowHeight_1).stroke();
                        doc_1.rect(col1X_1 + tableWidth_1 / 2 - 10, totalRowY, tableWidth_1 / 2 + 10, rowHeight_1).stroke();
                        // Total label and amount in bold
                        doc_1.fontSize(11).font('Devanagari').fillColor('#000');
                        doc_1.text('एकूण', col1X_1 + 10, totalRowY + 10, { continued: true });
                        doc_1.font('Helvetica-Bold').text(' / Total');
                        doc_1.font('Helvetica-Bold').text("\u20B9 ".concat(donation.total.toFixed(2)), col2X_1 + 10, totalRowY + 10);
                        doc_1.y = totalRowY + rowHeight_1 + 10;
                        doc_1.moveDown(0.8);
                        // Amount in words (अक्षरी रक्कम रु.)
                        doc_1.fontSize(10).font('Devanagari').fillColor('#000');
                        doc_1.text('अक्षरी रक्कम रु.: ', 50, doc_1.y, { continued: true });
                        var amountInWordsMarathi = numberToWordsMarathi(donation.total);
                        var amountInWordsEnglish = numberToWordsEnglish(donation.total);
                        doc_1.font('Devanagari').text(amountInWordsMarathi);
                        doc_1.fontSize(9).font('Helvetica').fillColor('#666');
                        doc_1.text("(".concat(amountInWordsEnglish, ")"), 50, doc_1.y);
                        doc_1.fillColor('#000');
                        doc_1.moveDown(1.5);
                        // Bottom signature section (right-aligned)
                        doc_1.fontSize(10).font('Devanagari').fillColor('#000');
                        // First line: स्वीकारणार
                        doc_1.text('स्वीकारणार', 420, doc_1.y, { align: 'right' });
                        doc_1.moveDown(0.3);
                        // Second line: कार्यवाह / अध्यक्ष
                        doc_1.text('कार्यवाह / अध्यक्ष', 420, doc_1.y, { align: 'right' });
                        doc_1.moveDown(0.3);
                        // Third line: Temple name in red
                        doc_1.fontSize(10).font('Devanagari').fillColor('#8B0000');
                        doc_1.text('श्री दत्त देवस्थान कोंडगांव, साखरपा', 420, doc_1.y, { align: 'right' });
                        // Finalize PDF
                        doc_1.end();
                    }
                    catch (error) {
                        reject(error);
                    }
                })];
        });
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
function uploadReceiptToS3(receiptNo_1, content_1) {
    return __awaiter(this, arguments, void 0, function (receiptNo, content, contentType) {
        var bucketName, year, key, error_1;
        if (contentType === void 0) { contentType = 'application/pdf'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    bucketName = (0, dynamo_client_1.getReceiptsBucketName)();
                    year = receiptNo.split('-')[0];
                    key = "receipts/".concat(year, "/").concat(receiptNo, ".pdf");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, s3Client.send(new client_s3_1.PutObjectCommand({
                            Bucket: bucketName,
                            Key: key,
                            Body: content,
                            ContentType: contentType,
                            Metadata: {
                                receiptNo: receiptNo,
                                generatedAt: new Date().toISOString(),
                            },
                        }))];
                case 2:
                    _a.sent();
                    console.log("\u2705 Receipt uploaded to S3: s3://".concat(bucketName, "/").concat(key));
                    return [2 /*return*/, key];
                case 3:
                    error_1 = _a.sent();
                    console.error('❌ Failed to upload receipt to S3:', error_1);
                    throw new Error("Failed to upload receipt: ".concat(error_1.message));
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Create and upload PDF receipt
 * Convenience function that combines creation and upload
 *
 * @param donation - Donation item
 * @returns S3 key where receipt was stored
 */
function createAndUploadReceipt(donation) {
    return __awaiter(this, void 0, void 0, function () {
        var pdfBuffer, s3Key;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, createPDFReceipt(donation)];
                case 1:
                    pdfBuffer = _a.sent();
                    return [4 /*yield*/, uploadReceiptToS3(donation.receiptNo, pdfBuffer)];
                case 2:
                    s3Key = _a.sent();
                    return [2 /*return*/, s3Key];
            }
        });
    });
}
/**
 * Convert number to words in English
 */
function numberToWordsEnglish(num) {
    var ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    var tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    var teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    if (num === 0)
        return 'Zero';
    var convert = function (n) {
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
    var rupees = Math.floor(num);
    var paise = Math.round((num - rupees) * 100);
    var result = convert(rupees) + ' Rupees';
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
    var ones = ['', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ'];
    var tens = ['', '', 'वीस', 'तीस', 'चाळीस', 'पन्नास', 'साठ', 'सत्तर', 'ऐंशी', 'नव्वद'];
    var teens = ['दहा', 'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणीस'];
    if (num === 0)
        return 'शून्य';
    var convert = function (n) {
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
    var rupees = Math.floor(num);
    var paise = Math.round((num - rupees) * 100);
    var result = convert(rupees) + ' रुपये';
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
function getReceiptDownloadUrl(receiptNo) {
    return __awaiter(this, void 0, void 0, function () {
        var bucketName, year, key, command, presignedUrl, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    bucketName = (0, dynamo_client_1.getReceiptsBucketName)();
                    year = receiptNo.split('-')[0];
                    key = "receipts/".concat(year, "/").concat(receiptNo, ".pdf");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    command = new client_s3_1.GetObjectCommand({
                        Bucket: bucketName,
                        Key: key,
                    });
                    return [4 /*yield*/, (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, {
                            expiresIn: 3600, // 1 hour
                        })];
                case 2:
                    presignedUrl = _a.sent();
                    console.log("\u2705 Generated presigned URL for receipt: ".concat(receiptNo));
                    return [2 /*return*/, presignedUrl];
                case 3:
                    error_2 = _a.sent();
                    console.error('❌ Failed to generate presigned URL:', error_2);
                    throw new Error("Failed to generate download URL: ".concat(error_2.message));
                case 4: return [2 /*return*/];
            }
        });
    });
}
