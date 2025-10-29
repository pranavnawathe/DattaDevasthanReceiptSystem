"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const donation_service_1 = require("../common/services/donation-service");
const receipt_artifact_1 = require("../common/services/receipt-artifact");
const queries_1 = require("../common/db/queries");
const crypto_1 = require("../common/utils/crypto");
const receipt_listing_1 = require("../common/services/receipt-listing");
// Organization ID (hardcoded for now, will come from auth context later)
const ORG_ID = 'DATTA-SAKHARAPA';
function json(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(body),
    };
}
const handler = async (event) => {
    const { method, path } = { method: event.requestContext.http.method, path: event.rawPath };
    console.log(`${method} ${path}`, (0, crypto_1.sanitizeForLogs)({ headers: event.headers }));
    try {
        // Health endpoint
        if (method === 'GET' && path === '/health') {
            return json(200, { ok: true, service: 'temple-backend', ts: Date.now() });
        }
        // Create donation receipt
        if (method === 'POST' && path === '/receipts') {
            if (!event.body) {
                return json(400, { success: false, error: 'Request body is required' });
            }
            const payload = JSON.parse(event.body);
            console.log('Creating donation:', (0, crypto_1.sanitizeForLogs)(payload));
            // Create donation (writes to DynamoDB)
            const response = await (0, donation_service_1.createDonation)(ORG_ID, payload);
            // Fetch the created donation to get full details
            const donation = await (0, queries_1.getDonationByReceiptNo)(ORG_ID, response.receiptNo);
            if (!donation) {
                throw new Error('Failed to retrieve created donation');
            }
            // Create and upload receipt artifact to S3
            const pdfKey = await (0, receipt_artifact_1.createAndUploadReceipt)(donation);
            console.log(`✅ Donation created: ${response.receiptNo}, Receipt: ${pdfKey}`);
            // Return success response
            return json(201, {
                ...response,
                pdfKey,
                message: 'Donation receipt created successfully',
            });
        }
        // List/search receipts (GET /receipts with query params)
        if (method === 'GET' && path === '/receipts') {
            const queryParams = event.queryStringParameters || {};
            console.log('Listing receipts with params:', queryParams);
            const { date, startDate, endDate, rangeId, receiptNo, donorId, includeVoided, limit, nextToken, } = queryParams;
            const pagination = {
                limit: limit ? parseInt(limit, 10) : undefined,
                lastEvaluatedKey: nextToken,
            };
            const includeVoidedFlag = includeVoided === 'true';
            // Exact receipt number lookup
            if (receiptNo) {
                const receipt = await (0, receipt_listing_1.getReceiptByNumber)(ORG_ID, receiptNo);
                return json(200, {
                    success: true,
                    items: receipt ? [receipt] : [],
                    count: receipt ? 1 : 0,
                });
            }
            // List by donor ID
            if (donorId) {
                const result = await (0, receipt_listing_1.listReceiptsByDonor)(ORG_ID, donorId, pagination, includeVoidedFlag);
                return json(200, { success: true, ...result });
            }
            // List by range ID
            if (rangeId) {
                const result = await (0, receipt_listing_1.listReceiptsByRange)(ORG_ID, rangeId, pagination, includeVoidedFlag);
                return json(200, { success: true, ...result });
            }
            // List by date range
            if (startDate && endDate) {
                const result = await (0, receipt_listing_1.listReceiptsByDateRange)(ORG_ID, startDate, endDate, pagination, includeVoidedFlag);
                return json(200, { success: true, ...result });
            }
            // List by single date (default to today if not specified)
            const targetDate = date || new Date().toISOString().split('T')[0];
            const result = await (0, receipt_listing_1.listReceiptsByDate)(ORG_ID, targetDate, pagination, includeVoidedFlag);
            return json(200, { success: true, ...result });
        }
        // Search donor and get receipts (GET /receipts/search?donor=<query>)
        if (method === 'GET' && path === '/receipts/search') {
            const queryParams = event.queryStringParameters || {};
            const { donor, type } = queryParams;
            if (!donor) {
                return json(400, { success: false, error: 'donor query parameter is required' });
            }
            console.log(`Searching donor: ${donor} (type: ${type || 'auto'})`);
            // Search donor by identifier
            const donorItem = await (0, receipt_listing_1.searchDonorByIdentifier)(ORG_ID, donor, type);
            if (!donorItem) {
                return json(200, {
                    success: true,
                    found: false,
                });
            }
            // Get recent receipts for this donor (last 5)
            const receiptsResult = await (0, receipt_listing_1.listReceiptsByDonor)(ORG_ID, donorItem.donorId, { limit: 5 });
            return json(200, {
                success: true,
                found: true,
                donor: donorItem,
                recentReceipts: receiptsResult.items,
            });
        }
        // Get donor's receipt history (GET /receipts/donor/{donorId})
        if (method === 'GET' && path.startsWith('/receipts/donor/')) {
            const donorId = path.split('/')[3];
            if (!donorId) {
                return json(400, { success: false, error: 'Donor ID is required' });
            }
            const queryParams = event.queryStringParameters || {};
            const pagination = {
                limit: queryParams.limit ? parseInt(queryParams.limit, 10) : undefined,
                lastEvaluatedKey: queryParams.nextToken,
            };
            const includeVoidedFlag = queryParams.includeVoided === 'true';
            console.log(`Fetching receipts for donor: ${donorId}`);
            const result = await (0, receipt_listing_1.listReceiptsByDonor)(ORG_ID, donorId, pagination, includeVoidedFlag);
            return json(200, { success: true, ...result });
        }
        // Get receipt download URL
        if (method === 'GET' && path.startsWith('/receipts/') && path.endsWith('/download')) {
            // Extract receipt number from path: /receipts/2025-00008/download
            const receiptNo = path.split('/')[2];
            if (!receiptNo || !receiptNo.match(/^\d{4}-\d{5}$/)) {
                return json(400, { success: false, error: 'Invalid receipt number format' });
            }
            console.log(`Generating download URL for receipt: ${receiptNo}`);
            // Generate presigned S3 URL
            const downloadUrl = await (0, receipt_artifact_1.getReceiptDownloadUrl)(receiptNo);
            return json(200, {
                success: true,
                receiptNo,
                downloadUrl,
                expiresIn: 3600, // 1 hour
            });
        }
        // Route not found
        return json(404, { success: false, error: 'Not found' });
    }
    catch (error) {
        console.error('❌ Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return json(500, {
            success: false,
            error: errorMessage,
        });
    }
};
exports.handler = handler;
