/**
 * Google OAuth & Gmail Integration
 */

// googleapis is isolated via eval('require') to bypass Turbopack static analysis
let google: any = null;
try {
  google = eval('require')('googleapis').google;
} catch (e) {
  // Ignored for build safety on Vercel
}
import type {
  OAuthTokens,
  OAuthUser,
  EmailMessage,
  SendEmailParams,
} from './types';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/oauth/google/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export class GoogleOAuthService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generate authorization URL for user consent
   */
  getAuthUrl(state?: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: state,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<OAuthTokens> {
    const { tokens } = await this.oauth2Client.getToken(code);

    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiry_date,
      token_type: tokens.token_type,
      scope: tokens.scope,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    return {
      access_token: credentials.access_token!,
      refresh_token: credentials.refresh_token || refreshToken,
      expires_at: credentials.expiry_date,
    };
  }

  /**
   * Get user profile info
   */
  async getUserInfo(accessToken: string): Promise<OAuthUser> {
    this.oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();

    return {
      id: data.id!,
      email: data.email,
      name: data.name,
      avatar: data.picture,
      provider: 'google',
    };
  }

  /**
   * Get recent emails
   */
  async getEmails(
    accessToken: string,
    maxResults: number = 10,
    query?: string
  ): Promise<EmailMessage[]> {
    this.oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    // List messages
    const { data } = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: query || 'is:unread', // Default to unread emails
    });

    if (!data.messages) {
      return [];
    }

    // Fetch full message details
    const messages = await Promise.all(
      data.messages.map(async (msg: any) => {
        const { data: fullMsg } = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full',
        });

        const headers = fullMsg.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

        // Decode body
        let body = '';
        if (fullMsg.payload?.body?.data) {
          body = Buffer.from(fullMsg.payload.body.data, 'base64').toString('utf-8');
        } else if (fullMsg.payload?.parts) {
          // Multi-part message
          const textPart = fullMsg.payload.parts.find((p: any) => p.mimeType === 'text/plain');
          if (textPart?.body?.data) {
            body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
          }
        }

        return {
          id: fullMsg.id!,
          from: getHeader('from'),
          to: [getHeader('to')],
          subject: getHeader('subject'),
          body,
          date: new Date(parseInt(fullMsg.internalDate || '0')),
          read: !fullMsg.labelIds?.includes('UNREAD'),
          labels: fullMsg.labelIds,
        };
      })
    );

    return messages;
  }

  /**
   * Send an email
   */
  async sendEmail(
    accessToken: string,
    params: SendEmailParams
  ): Promise<{ id: string; threadId: string }> {
    this.oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    // Construct email
    const toAddresses = Array.isArray(params.to) ? params.to.join(', ') : params.to;
    const messageParts = [
      `To: ${toAddresses}`,
      `Subject: ${params.subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      params.body,
    ];

    if (params.cc && params.cc.length > 0) {
      messageParts.splice(1, 0, `Cc: ${params.cc.join(', ')}`);
    }

    if (params.bcc && params.bcc.length > 0) {
      messageParts.splice(1, 0, `Bcc: ${params.bcc.join(', ')}`);
    }

    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send email
    const { data } = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return {
      id: data.id!,
      threadId: data.threadId!,
    };
  }

  /**
   * Search emails
   */
  async searchEmails(
    accessToken: string,
    query: string,
    maxResults: number = 10
  ): Promise<EmailMessage[]> {
    return this.getEmails(accessToken, maxResults, query);
  }

  /**
   * Mark email as read
   */
  async markAsRead(accessToken: string, messageId: string): Promise<void> {
    this.oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
  }
}

export const googleOAuth = new GoogleOAuthService();
