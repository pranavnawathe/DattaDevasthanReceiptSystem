// Format currency in Indian Rupees
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date in IST timezone
export function formatDate(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// Get today's date in YYYY-MM-DD format (IST)
export function getTodayIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().split('T')[0];
}

// Format phone number for display
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.substring(2, 7)} ${digits.substring(7)}`;
  }
  return phone;
}

// Normalize phone to E.164 format
export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (digits.length === 13 && digits.startsWith('091')) {
    return `+91${digits.slice(3)}`;
  }

  return null;
}

// Validate and format PAN
export function normalizePAN(pan: string): string | null {
  const cleaned = pan.toUpperCase().replace(/\s/g, '');
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

  if (panRegex.test(cleaned)) {
    return cleaned;
  }

  return null;
}

// Normalize email
export function normalizeEmail(email: string): string | null {
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (emailRegex.test(cleaned)) {
    return cleaned;
  }

  return null;
}
