import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { createDonation } from '../common/services/donation-service';
import { createAndUploadReceipt, getReceiptDownloadUrl } from '../common/services/receipt-artifact';
import { getDonationByReceiptNo } from '../common/db/queries';
import { CreateReceiptRequest } from '../common/types';
import { sanitizeForLogs } from '../common/utils/crypto';

// Organization ID (hardcoded for now, will come from auth context later)
const ORG_ID = 'DATTA-SAKHARAPA';

function json(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const { method, path } = { method: event.requestContext.http.method, path: event.rawPath };

  console.log(`${method} ${path}`, sanitizeForLogs({ headers: event.headers }));

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

      const payload: CreateReceiptRequest = JSON.parse(event.body);
      console.log('Creating donation:', sanitizeForLogs(payload));

      // Create donation (writes to DynamoDB)
      const response = await createDonation(ORG_ID, payload);

      // Fetch the created donation to get full details
      const donation = await getDonationByReceiptNo(ORG_ID, response.receiptNo);

      if (!donation) {
        throw new Error('Failed to retrieve created donation');
      }

      // Create and upload receipt artifact to S3
      const pdfKey = await createAndUploadReceipt(donation);

      console.log(`✅ Donation created: ${response.receiptNo}, Receipt: ${pdfKey}`);

      // Return success response
      return json(201, {
        ...response,
        pdfKey,
        message: 'Donation receipt created successfully',
      });
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
      const downloadUrl = await getReceiptDownloadUrl(receiptNo);

      return json(200, {
        success: true,
        receiptNo,
        downloadUrl,
        expiresIn: 3600, // 1 hour
      });
    }

    // Route not found
    return json(404, { success: false, error: 'Not found' });
  } catch (error) {
    console.error('❌ Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return json(500, {
      success: false,
      error: errorMessage,
    });
  }
};
