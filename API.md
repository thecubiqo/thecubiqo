# Cubiqo API Documentation

## Overview

Cubiqo provides a comprehensive API for building intelligent applications. This document covers available endpoints, authentication, and usage examples.

## 🔐 Authentication

### API Keys
Most endpoints require authentication via API key in the header:

```http
Authorization: Bearer YOUR_API_KEY
```

### Session Authentication
For user-facing endpoints, use session cookies from Supabase auth.

## 📋 Base URL

**Development:** `http://localhost:3000/api`  
**Production:** `https://your-domain.com/api`

## 📊 Rate Limiting

- **Free tier:** 100 requests/hour
- **Premium tier:** 10,000 requests/hour
- **Enterprise:** Custom limits

## 🚀 Quick Start

### 1. Get API Key
```bash
curl -X POST https://your-domain.com/api/auth/api-key \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### 2. Make Your First Request
```bash
curl -X GET https://your-domain.com/api/health \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## 📁 API Endpoints

### Health & Status

#### GET `/api/health`
Check API status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-19T10:30:00Z",
  "version": "1.0.0"
}
```

### Chat & Conversation

#### POST `/api/chat`
Send a message to the AI assistant.

**Request:**
```json
{
  "message": "Hello, how are you?",
  "sessionId": "optional-session-id",
  "context": {
    "userId": "user-123",
    "preferences": {}
  }
}
```

**Response:**
```json
{
  "response": "I'm doing well, thank you! How can I help you today?",
  "sessionId": "generated-session-id",
  "tokensUsed": 42
}
```

### Journal

#### GET `/api/journal/entries`
Get journal entries for a user.

**Query Parameters:**
- `userId` (required): User ID
- `limit`: Number of entries (default: 10)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "entries": [
    {
      "id": "entry-123",
      "content": "Today I worked on the new feature...",
      "createdAt": "2026-02-19T10:00:00Z",
      "mood": "productive"
    }
  ],
  "total": 1
}
```

#### POST `/api/journal/entries`
Create a new journal entry.

**Request:**
```json
{
  "userId": "user-123",
  "content": "Today's reflections...",
  "mood": "happy",
  "tags": ["work", "progress"]
}
```

### Memory System

#### GET `/api/memory`
Retrieve memories for context.

**Query Parameters:**
- `userId` (required): User ID
- `query`: Search query
- `limit`: Number of memories (default: 5)

#### POST `/api/memory`
Store a new memory.

**Request:**
```json
{
  "userId": "user-123",
  "content": "User prefers dark mode interface",
  "type": "preference",
  "importance": 0.7
}
```

### Admin Endpoints

#### GET `/api/admin/stats`
Get system statistics (admin only).

**Response:**
```json
{
  "users": {
    "total": 150,
    "activeToday": 42
  },
  "api": {
    "requestsToday": 1250,
    "averageResponseTime": 120
  },
  "system": {
    "uptime": "99.8%",
    "memoryUsage": "65%"
  }
}
```

## 🔧 Webhooks

### Available Webhooks
- `user.created` - New user registered
- `chat.completed` - Chat session completed
- `error.occurred` - System error occurred

### Webhook Payload Example
```json
{
  "event": "user.created",
  "data": {
    "userId": "user-123",
    "email": "user@example.com",
    "createdAt": "2026-02-19T10:00:00Z"
  },
  "timestamp": "2026-02-19T10:00:00Z"
}
```

## 🛡️ Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: userId",
    "details": {
      "field": "userId",
      "expected": "string"
    }
  }
}
```

### Common Error Codes
- `AUTH_REQUIRED` - Authentication required
- `INVALID_TOKEN` - Invalid API key
- `RATE_LIMITED` - Rate limit exceeded
- `VALIDATION_ERROR` - Invalid request data
- `NOT_FOUND` - Resource not found
- `SERVER_ERROR` - Internal server error

## 📈 Best Practices

### 1. Implement Retry Logic
```javascript
async function makeRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

### 2. Handle Rate Limiting
Check response headers:
- `X-RateLimit-Limit` - Total requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - When limit resets

### 3. Use Exponential Backoff
For 429 (Too Many Requests) errors, implement exponential backoff.

## 🧪 Testing

### Test Environment
Use the test environment for development:
- **Base URL:** `https://test.your-domain.com/api`
- **Test API Key:** Provided in dashboard

### Mock Responses
For testing without hitting the API:
```javascript
// Use environment variable to switch between real and mock API
const API_URL = process.env.NODE_ENV === 'test' 
  ? 'http://localhost:3001/mock-api'
  : 'https://your-domain.com/api';
```

## 🔄 Versioning

API version is included in the URL path:
- `v1` - Current stable version
- `beta` - Preview features

Example: `https://your-domain.com/api/v1/chat`

## 📞 Support

### Getting Help
1. Check this documentation
2. Review error messages
3. Contact support: api-support@cubiqo.com

### Status Page
Check system status: https://status.cubiqo.com

### Updates
Subscribe to API updates:
- Changelog: https://docs.cubiqo.com/changelog
- Twitter: @CubiqoAPI

---

**Last Updated:** 2026-02-19  
**API Version:** v1.0.0