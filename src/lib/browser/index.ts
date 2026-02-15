/**
 * Browser Automation Service
 * Provides headless browser capabilities for Cubiqo AI
 */

export { BrowserService } from './browser-service';
export { BrowserCommandParser } from './command-parser';
export type { 
  BrowserAction, 
  BrowserResult, 
  NavigateAction,
  ClickAction,
  TypeAction,
  ScreenshotAction,
  ScrapeAction,
  FillFormAction,
  WaitAction
} from './types';
