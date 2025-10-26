import type { CreateReceiptRequest, CreateReceiptResponse, ApiError } from '../types';

const API_BASE_URL = 'https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async createReceipt(data: CreateReceiptRequest): Promise<CreateReceiptResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/receipts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(errorData.error || errorData.message || 'Failed to create receipt');
      }

      const result: CreateReceiptResponse = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error: Unable to connect to server');
    }
  }

  async checkHealth(): Promise<{ status: string; timestamp: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      throw new Error('Unable to connect to server');
    }
  }

  async getReceiptDownloadUrl(receiptNo: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/receipts/${receiptNo}/download`);

      if (!response.ok) {
        throw new Error(`Failed to get download URL: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.downloadUrl) {
        throw new Error('Invalid response from server');
      }

      return data.downloadUrl;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error: Unable to get download URL');
    }
  }
}

export const api = new ApiClient(API_BASE_URL);
