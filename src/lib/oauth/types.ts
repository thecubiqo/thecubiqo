/**
 * OAuth Types and Interfaces
 */

export interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
}

export interface OAuthUser {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  provider: 'google' | 'twitter' | 'whatsapp';
}

export interface StoredOAuthConnection {
  user_id: string;
  provider: 'google' | 'twitter' | 'whatsapp';
  provider_user_id: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  scopes: string[];
  connected_at: string;
  last_used_at?: string;
}

// Email types
export interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  html?: string;
  date: Date;
  read: boolean;
  labels?: string[];
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

// Social media types
export interface TwitterPost {
  text: string;
  media_ids?: string[];
  reply_to?: string;
  quote?: string;
}

export interface TwitterMessage {
  recipient_id: string;
  text: string;
  media_id?: string;
}

// Location types
export interface LocationSearchParams {
  query: string;
  location?: { lat: number; lng: number };
  radius?: number; // in meters
  type?: string; // restaurant, cafe, etc.
}

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating?: number;
  types?: string[];
  phone?: string;
  website?: string;
}

// Uber types (via headless browser)
export interface UberBookingParams {
  pickup?: string; // address or "current location"
  destination: string;
  product_type?: 'UberX' | 'UberXL' | 'Comfort' | 'Black';
}

export interface UberEstimate {
  product_name: string;
  price_estimate: string;
  eta_minutes: number;
  available: boolean;
}

// WhatsApp types
export interface WhatsAppMessage {
  to: string; // phone number with country code
  message: string;
  media_url?: string;
}
