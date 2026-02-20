/**
 * Type definitions for verbal commands system
 */

export type CommandType =
  | 'email'
  | 'twitter'
  | 'maps'
  | 'uber'
  | 'whatsapp'
  | 'discord'
  | 'slack'
  | 'notion'
  | 'trello'
  | 'spotify';

export interface CommandIntent {
  type: CommandType;
  action: string;
  parameters: Record<string, any>;
  requiresAuth?: boolean;
  requiresConfirmation?: boolean;
  description?: string;
}

export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  needsAuth?: boolean;
  needsConsent?: boolean;
  message?: string;
}

// Email types
export interface EmailCommand {
  action: 'send' | 'read' | 'search';
  to?: string;
  subject?: string;
  body?: string;
  query?: string;
  maxResults?: number;
}

export interface Email {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
}

// Twitter types
export interface TwitterCommand {
  action: 'post' | 'read' | 'reply' | 'search';
  text?: string;
  query?: string;
  tweetId?: string;
  media?: string[];
}

// Maps types
export interface MapsCommand {
  action: 'search' | 'directions' | 'nearby';
  query?: string;
  origin?: string;
  destination?: string;
  category?: string;
}

export interface Location {
  name: string;
  address: string;
  rating?: number;
  coordinates?: { lat: number; lng: number };
}

// Uber types
export interface UberCommand {
  action: 'request' | 'estimate' | 'status';
  pickup?: string;
  destination?: string;
  rideType?: 'pool' | 'x' | 'xl' | 'black';
}

// WhatsApp types
export interface WhatsAppCommand {
  action: 'send' | 'read';
  contact?: string;
  message?: string;
  phone?: string;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  scope?: string;
}
