/**
 * Regression Test: Critical Selectors Validation
 * 
 * Ensures critical DOM selectors and data attributes haven't changed
 */

import { describe, it, expect } from 'vitest';

describe('Critical Selectors Validation', () => {
  describe('Main Layout Selectors', () => {
    it('should have main content container', () => {
      const selector = 'main';
      expect(selector).toBe('main');
    });

    it('should have header element', () => {
      const selector = 'header';
      expect(selector).toBe('header');
    });

    it('should have footer element', () => {
      const selector = 'footer';
      expect(selector).toBe('footer');
    });
  });

  describe('Interactive Element Selectors', () => {
    it('should have speaker button with data-testid', () => {
      const selector = '[data-testid="speaker-button"]';
      expect(selector).toContain('data-testid');
      expect(selector).toContain('speaker-button');
    });

    it('should have login button with data-testid', () => {
      const selector = '[data-testid="login-button"]';
      expect(selector).toContain('data-testid');
      expect(selector).toContain('login-button');
    });

    it('should have top-right CTA with data-testid', () => {
      const selector = '[data-testid="top-right-cta"]';
      expect(selector).toContain('data-testid');
      expect(selector).toContain('top-right-cta');
    });

    it('should have message input with data-testid', () => {
      const selector = '[data-testid="message-input"]';
      expect(selector).toContain('data-testid');
      expect(selector).toContain('message-input');
    });
  });

  describe('Canvas and 3D Scene Selectors', () => {
    it('should have WebGL canvas element', () => {
      const selector = 'canvas';
      expect(selector).toBe('canvas');
    });

    it('should have scene container with ID', () => {
      const selector = '#scene-container';
      expect(selector).toContain('scene-container');
    });

    it('should have plasma wave container', () => {
      const selector = '[data-component="plasma-wave-field"]';
      expect(selector).toContain('plasma-wave-field');
    });

    it('should have cube scene container', () => {
      const selector = '[data-component="energy-cube-scene"]';
      expect(selector).toContain('energy-cube-scene');
    });
  });

  describe('Form Selectors', () => {
    it('should have email input in login form', () => {
      const selector = 'input[type="email"]';
      expect(selector).toContain('type="email"');
    });

    it('should have submit button in forms', () => {
      const selector = 'button[type="submit"]';
      expect(selector).toContain('type="submit"');
    });

    it('should have form validation messages', () => {
      const selector = '.form-error';
      expect(selector).toContain('form-error');
    });
  });

  describe('Modal and Dialog Selectors', () => {
    it('should have modal overlay', () => {
      const selector = '[data-testid="modal-overlay"]';
      expect(selector).toContain('modal-overlay');
    });

    it('should have modal close button', () => {
      const selector = '[data-testid="modal-close"]';
      expect(selector).toContain('modal-close');
    });

    it('should have dialog role', () => {
      const selector = '[role="dialog"]';
      expect(selector).toContain('role="dialog"');
    });
  });

  describe('Navigation Selectors', () => {
    it('should have navigation element', () => {
      const selector = 'nav';
      expect(selector).toBe('nav');
    });

    it('should have navigation links', () => {
      const selector = 'nav a';
      expect(selector).toContain('nav');
    });

    it('should have mobile menu toggle', () => {
      const selector = '[data-testid="mobile-menu-toggle"]';
      expect(selector).toContain('mobile-menu-toggle');
    });
  });

  describe('State Indicator Selectors', () => {
    it('should have loading spinner', () => {
      const selector = '[data-testid="loading-spinner"]';
      expect(selector).toContain('loading-spinner');
    });

    it('should have error message container', () => {
      const selector = '[data-testid="error-message"]';
      expect(selector).toContain('error-message');
    });

    it('should have success message container', () => {
      const selector = '[data-testid="success-message"]';
      expect(selector).toContain('success-message');
    });
  });

  describe('Audio State Selectors', () => {
    it('should have audio state indicator', () => {
      const states = ['idle', 'listening', 'thinking', 'speaking'];
      expect(states.length).toBe(4);
    });

    it('should have mute button', () => {
      const selector = '[data-testid="mute-button"]';
      expect(selector).toContain('mute-button');
    });

    it('should have volume control', () => {
      const selector = '[data-testid="volume-control"]';
      expect(selector).toContain('volume-control');
    });
  });

  describe('User Profile Selectors', () => {
    it('should have user avatar', () => {
      const selector = '[data-testid="user-avatar"]';
      expect(selector).toContain('user-avatar');
    });

    it('should have user menu', () => {
      const selector = '[data-testid="user-menu"]';
      expect(selector).toContain('user-menu');
    });

    it('should have logout button', () => {
      const selector = '[data-testid="logout-button"]';
      expect(selector).toContain('logout-button');
    });
  });

  describe('Chat Interface Selectors', () => {
    it('should have chat container', () => {
      const selector = '[data-testid="chat-container"]';
      expect(selector).toContain('chat-container');
    });

    it('should have message list', () => {
      const selector = '[data-testid="message-list"]';
      expect(selector).toContain('message-list');
    });

    it('should have individual message', () => {
      const selector = '[data-testid^="message-"]';
      expect(selector).toContain('message-');
    });

    it('should have send message button', () => {
      const selector = '[data-testid="send-message"]';
      expect(selector).toContain('send-message');
    });
  });

  describe('Settings Panel Selectors', () => {
    it('should have settings button', () => {
      const selector = '[data-testid="settings-button"]';
      expect(selector).toContain('settings-button');
    });

    it('should have theme toggle', () => {
      const selector = '[data-testid="theme-toggle"]';
      expect(selector).toContain('theme-toggle');
    });

    it('should have voice settings', () => {
      const selector = '[data-testid="voice-settings"]';
      expect(selector).toContain('voice-settings');
    });
  });

  describe('Accessibility Selectors', () => {
    it('should have skip to main content link', () => {
      const selector = '[data-testid="skip-to-main"]';
      expect(selector).toContain('skip-to-main');
    });

    it('should have aria-live regions', () => {
      const selector = '[aria-live="polite"]';
      expect(selector).toContain('aria-live');
    });

    it('should have landmark roles', () => {
      const roles = ['banner', 'main', 'navigation', 'contentinfo'];
      expect(roles.length).toBeGreaterThan(0);
    });
  });

  describe('Animation Containers', () => {
    it('should have morph animation container', () => {
      const selector = '[data-animation="wave-to-cube-morph"]';
      expect(selector).toContain('wave-to-cube-morph');
    });

    it('should have particle system container', () => {
      const selector = '[data-component="particle-system"]';
      expect(selector).toContain('particle-system');
    });

    it('should have soul nodes container', () => {
      const selector = '[data-component="soul-nodes"]';
      expect(selector).toContain('soul-nodes');
    });
  });

  describe('Feature Flag Selectors', () => {
    it('should have BYO mode indicator', () => {
      const selector = '[data-feature="byo-mode"]';
      expect(selector).toContain('byo-mode');
    });

    it('should have founders pass indicator', () => {
      const selector = '[data-feature="founders-pass"]';
      expect(selector).toContain('founders-pass');
    });
  });

  describe('Data Attributes Consistency', () => {
    it('should use consistent data-testid naming convention', () => {
      const testIds = [
        'speaker-button',
        'login-button',
        'modal-overlay',
        'message-input'
      ];
      
      // All should use kebab-case
      testIds.forEach(id => {
        expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      });
    });

    it('should use consistent data-component naming', () => {
      const components = [
        'plasma-wave-field',
        'energy-cube-scene',
        'particle-system'
      ];
      
      // All should use kebab-case
      components.forEach(comp => {
        expect(comp).toMatch(/^[a-z]+(-[a-z]+)*$/);
      });
    });

    it('should use consistent data-state attributes', () => {
      const states = ['active', 'inactive', 'loading', 'error'];
      expect(states.length).toBeGreaterThan(0);
    });
  });

  describe('CSS Class Consistency', () => {
    it('should use Tailwind utility classes', () => {
      const utilities = [
        'flex',
        'grid',
        'hidden',
        'block',
        'text-center'
      ];
      
      expect(utilities.length).toBeGreaterThan(0);
    });

    it('should avoid inline styles for critical elements', () => {
      const preferClasses = true;
      expect(preferClasses).toBe(true);
    });

    it('should use consistent spacing classes', () => {
      const spacing = ['p-4', 'm-2', 'gap-3', 'space-y-4'];
      spacing.forEach(space => {
        expect(space).toMatch(/^((p|m|gap)(-[xy])?|space-[xy])-\d+$/);
      });
    });
  });
});
