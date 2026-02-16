/**
 * Type definitions for browser automation
 */

export type BrowserActionType = 
  | 'navigate'
  | 'click'
  | 'type'
  | 'screenshot'
  | 'scrape'
  | 'fill-form'
  | 'wait'
  | 'scroll'
  | 'extract';

export interface BaseAction {
  type: BrowserActionType;
  requiresConsent?: boolean;
  description?: string;
}

export interface NavigateAction extends BaseAction {
  type: 'navigate';
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
}

export interface ClickAction extends BaseAction {
  type: 'click';
  selector: string;
  waitForNavigation?: boolean;
}

export interface TypeAction extends BaseAction {
  type: 'type';
  selector: string;
  text: string;
  delay?: number;
}

export interface ScreenshotAction extends BaseAction {
  type: 'screenshot';
  fullPage?: boolean;
  selector?: string;
}

export interface ScrapeAction extends BaseAction {
  type: 'scrape';
  selectors?: Record<string, string>;
  waitForSelector?: string;
}

export interface FillFormAction extends BaseAction {
  type: 'fill-form';
  fields: Record<string, string>;
  submitSelector?: string;
}

export interface WaitAction extends BaseAction {
  type: 'wait';
  condition: 'selector' | 'timeout' | 'navigation';
  value: string | number;
}

export interface ScrollAction extends BaseAction {
  type: 'scroll';
  direction: 'up' | 'down' | 'top' | 'bottom';
  amount?: number;
}

export interface ExtractAction extends BaseAction {
  type: 'extract';
  dataType: 'text' | 'links' | 'images' | 'table';
  selector?: string;
}

export type BrowserAction = 
  | NavigateAction
  | ClickAction
  | TypeAction
  | ScreenshotAction
  | ScrapeAction
  | FillFormAction
  | WaitAction
  | ScrollAction
  | ExtractAction;

export interface BrowserResult {
  success: boolean;
  data?: any;
  error?: string;
  screenshot?: string; // base64 encoded
  url?: string;
  timestamp: number;
}

export interface BrowserSession {
  id: string;
  url: string;
  startTime: number;
  actions: BrowserAction[];
  consentGiven: boolean;
}

export interface ConsentRequest {
  action: BrowserAction;
  reason: string;
  domain: string;
}
