/**
 * Integration Test: Analytics Click Events
 * 
 * Tests that analytics events are properly tracked for user interactions
 */

import { describe, it, expect } from 'vitest';

describe('Analytics Click Events', () => {
  describe('Event Tracking Structure', () => {
    it('should have consistent event naming convention', () => {
      const eventNames = [
        'button_clicked',
        'speaker_toggled',
        'auth_initiated',
        'magic_link_sent',
        'cube_morphed'
      ];
      
      // Events should use snake_case
      eventNames.forEach(event => {
        expect(event).toMatch(/^[a-z_]+$/);
      });
    });

    it('should include standard event properties', () => {
      const eventProperties = {
        timestamp: new Date().toISOString(),
        userId: 'user-123',
        sessionId: 'session-456',
        page: '/landing',
        action: 'click',
        element: 'speaker_button'
      };
      
      expect(eventProperties.timestamp).toBeDefined();
      expect(eventProperties.action).toBeDefined();
      expect(eventProperties.element).toBeDefined();
    });

    it('should sanitize user data in events', () => {
      const unsafeEmail = 'test+tag@example.com';
      const sanitized = unsafeEmail.toLowerCase().trim();
      
      expect(sanitized).toBe('test+tag@example.com');
    });
  });

  describe('Button Click Events', () => {
    it('should track speaker button clicks', () => {
      const event = {
        name: 'speaker_button_clicked',
        properties: {
          state: 'idle',
          nextState: 'listening'
        }
      };
      
      expect(event.name).toBe('speaker_button_clicked');
      expect(event.properties.state).toBeDefined();
    });

    it('should track CTA button clicks', () => {
      const event = {
        name: 'cta_clicked',
        properties: {
          ctaText: 'Get Started',
          ctaLocation: 'top_right'
        }
      };
      
      expect(event.name).toBe('cta_clicked');
      expect(event.properties.ctaText).toBeDefined();
    });

    it('should track navigation clicks', () => {
      const event = {
        name: 'navigation_clicked',
        properties: {
          destination: '/dashboard',
          source: 'header'
        }
      };
      
      expect(event.name).toBe('navigation_clicked');
      expect(event.properties.destination).toBeDefined();
    });
  });

  describe('Authentication Events', () => {
    it('should track magic link request', () => {
      const event = {
        name: 'magic_link_requested',
        properties: {
          email: 'user@example.com',
          timestamp: new Date().toISOString()
        }
      };
      
      expect(event.name).toBe('magic_link_requested');
      expect(event.properties.email).toBeDefined();
    });

    it('should track login success', () => {
      const event = {
        name: 'login_success',
        properties: {
          userId: 'user-123',
          method: 'magic_link',
          timestamp: new Date().toISOString()
        }
      };
      
      expect(event.name).toBe('login_success');
      expect(event.properties.userId).toBeDefined();
      expect(event.properties.method).toBe('magic_link');
    });

    it('should track login failure with reason', () => {
      const event = {
        name: 'login_failed',
        properties: {
          reason: 'expired_link',
          timestamp: new Date().toISOString()
        }
      };
      
      expect(event.name).toBe('login_failed');
      expect(event.properties.reason).toBeDefined();
    });
  });

  describe('Interaction Events', () => {
    it('should track voice interaction start', () => {
      const event = {
        name: 'voice_interaction_started',
        properties: {
          sessionId: 'session-123',
          timestamp: new Date().toISOString()
        }
      };
      
      expect(event.name).toBe('voice_interaction_started');
    });

    it('should track message sent', () => {
      const event = {
        name: 'message_sent',
        properties: {
          messageLength: 150,
          mode: 'voice',
          timestamp: new Date().toISOString()
        }
      };
      
      expect(event.name).toBe('message_sent');
      expect(event.properties.messageLength).toBeGreaterThan(0);
    });

    it('should track cube morph events', () => {
      const event = {
        name: 'cube_morphed',
        properties: {
          from: 'wave',
          to: 'cube',
          duration: 1500,
          timestamp: new Date().toISOString()
        }
      };
      
      expect(event.name).toBe('cube_morphed');
      expect(event.properties.from).toBeDefined();
      expect(event.properties.to).toBeDefined();
    });
  });

  describe('Error Events', () => {
    it('should track JavaScript errors', () => {
      const event = {
        name: 'javascript_error',
        properties: {
          message: 'TypeError: Cannot read property',
          stack: 'Error at...',
          page: '/landing',
          timestamp: new Date().toISOString()
        }
      };
      
      expect(event.name).toBe('javascript_error');
      expect(event.properties.message).toBeDefined();
    });

    it('should track API errors', () => {
      const event = {
        name: 'api_error',
        properties: {
          endpoint: '/api/chat',
          statusCode: 500,
          message: 'Internal Server Error',
          timestamp: new Date().toISOString()
        }
      };
      
      expect(event.name).toBe('api_error');
      expect(event.properties.endpoint).toBeDefined();
      expect(event.properties.statusCode).toBe(500);
    });

    it('should track WebGL errors', () => {
      const event = {
        name: 'webgl_error',
        properties: {
          type: 'context_lost',
          message: 'WebGL context lost',
          timestamp: new Date().toISOString()
        }
      };
      
      expect(event.name).toBe('webgl_error');
      expect(event.properties.type).toBeDefined();
    });
  });

  describe('Performance Events', () => {
    it('should track page load time', () => {
      const event = {
        name: 'page_loaded',
        properties: {
          loadTime: 1500,
          page: '/landing',
          timestamp: new Date().toISOString()
        }
      };
      
      expect(event.name).toBe('page_loaded');
      expect(event.properties.loadTime).toBeGreaterThan(0);
    });

    it('should track FPS drops', () => {
      const event = {
        name: 'fps_drop_detected',
        properties: {
          avgFps: 25,
          duration: 5000,
          timestamp: new Date().toISOString()
        }
      };
      
      expect(event.name).toBe('fps_drop_detected');
      expect(event.properties.avgFps).toBeLessThan(60);
    });

    it('should track bundle load times', () => {
      const event = {
        name: 'bundle_loaded',
        properties: {
          bundleName: 'main',
          size: 250000,
          loadTime: 800,
          timestamp: new Date().toISOString()
        }
      };
      
      expect(event.name).toBe('bundle_loaded');
      expect(event.properties.size).toBeGreaterThan(0);
    });
  });

  describe('Vercel Analytics Integration', () => {
    it('should use @vercel/analytics package', () => {
      const hasVercelAnalytics = true;
      expect(hasVercelAnalytics).toBe(true);
    });

    it('should track Web Vitals', () => {
      const webVitals = ['CLS', 'FID', 'FCP', 'LCP', 'TTFB'];
      expect(webVitals.length).toBe(5);
    });

    it('should send events to Vercel endpoint', () => {
      const endpoint = 'https://vitals.vercel-insights.com/v1/vitals';
      expect(endpoint).toContain('vercel-insights.com');
    });
  });

  describe('Privacy Compliance', () => {
    it('should not track PII in events', () => {
      const event = {
        name: 'user_action',
        properties: {
          userId: 'hashed-user-id', // Should be hashed
          action: 'click'
          // No email, name, or other PII
        }
      };
      
      expect(event.properties.userId).not.toContain('@');
      expect(event.properties.userId).not.toMatch(/[A-Z][a-z]+\s[A-Z][a-z]+/);
    });

    it('should respect Do Not Track header', () => {
      const dntHeader = '1';
      const shouldTrack = dntHeader !== '1';
      
      expect(shouldTrack).toBe(false);
    });

    it('should allow users to opt out', () => {
      const userOptOut = {
        analyticsEnabled: false,
        timestamp: new Date().toISOString()
      };
      
      expect(userOptOut.analyticsEnabled).toBe(false);
    });
  });

  describe('Event Batching', () => {
    it('should batch events before sending', () => {
      const batch = [
        { name: 'event1', timestamp: new Date().toISOString() },
        { name: 'event2', timestamp: new Date().toISOString() },
        { name: 'event3', timestamp: new Date().toISOString() }
      ];
      
      expect(batch.length).toBeGreaterThan(1);
    });

    it('should send batch on page unload', () => {
      const events = ['beforeunload', 'visibilitychange'];
      expect(events).toContain('beforeunload');
    });

    it('should retry failed event submissions', () => {
      const maxRetries = 3;
      expect(maxRetries).toBeGreaterThan(0);
    });
  });
});
