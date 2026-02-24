/**
 * GFXToolz.ai Integration Wrapper
 *
 * Handles authentication and asset generation requests to the GFXToolz API.
 *
 * NOTE: Real API integration requires valid GFX_TOOLZ_USER / GFX_TOOLZ_PASS.
 * When credentials are missing the module runs in **dry-run mode** — every
 * method logs what it *would* do and returns `null` so callers can fall back
 * to the next content-generation tier.
 */

// axios is lazily required so the module can be loaded in test environments
// where social-army/node_modules may not be installed.
let _axios = null;
function getAxios() {
    if (!_axios) { _axios = require('axios'); }
    return _axios;
}

class GFXToolz {
    /**
     * @param {string} user  GFXToolz username (env: GFX_TOOLZ_USER)
     * @param {string} pass  GFXToolz password (env: GFX_TOOLZ_PASS)
     */
    constructor(user, pass) {
        this.user = user || null;
        this.pass = pass || null;
        // Keep legacy .apiKey accessor so existing tests still pass
        this.apiKey = user || null;
        this.baseUrl = 'https://api.gfxtoolz.ai/v1';
        this.authenticated = false;
        this.token = null;
    }

    /**
     * Authenticate with the GFXToolz API.
     * @returns {Promise<boolean>} true on success, false otherwise
     */
    async login() {
        console.log('[GFXToolz] Authenticating...');
        if (!this.user || !this.pass) {
            console.warn('[GFXToolz] No credentials provided — running in dry-run mode');
            this.authenticated = false;
            return false;
        }

        try {
            const res = await getAxios().post(`${this.baseUrl}/auth/login`, {
                username: this.user,
                password: this.pass,
            }, { timeout: 10000 });

            if (res.data && res.data.token) {
                this.token = res.data.token;
                this.authenticated = true;
                console.log('[GFXToolz] ✅ Authenticated');
                return true;
            }
            console.warn('[GFXToolz] ⚠️ Auth response missing token — dry-run mode');
            this.authenticated = false;
            return false;
        } catch (err) {
            console.warn(`[GFXToolz] ⚠️ Auth failed (${err.message}) — dry-run mode`);
            this.authenticated = false;
            return false;
        }
    }

    /** @private Common headers for authenticated requests */
    _headers() {
        return this.token
            ? { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }
            : { 'Content-Type': 'application/json' };
    }

    /**
     * Initialize a new creative project
     */
    async createProject(name, type = 'social_video') {
        console.log(`[GFXToolz] Creating project: ${name} (${type})`);
        if (!this.authenticated) return { id: 'proj_' + Date.now() };

        try {
            const res = await getAxios().post(`${this.baseUrl}/projects`, { name, type }, { headers: this._headers(), timeout: 15000 });
            return res.data || { id: 'proj_' + Date.now() };
        } catch (err) {
            console.warn(`[GFXToolz] createProject failed (${err.message}) — returning placeholder`);
            return { id: 'proj_' + Date.now() };
        }
    }

    /**
     * Upload raw footage (the CubiQo screen recording) for processing
     */
    async uploadAsset(projectId, filePath) {
        console.log(`[GFXToolz] Uploading raw asset: ${filePath}`);
        if (!this.authenticated) return { assetId: 'asset_' + Date.now() };

        try {
            const fs = require('fs');
            const FormData = require('form-data');
            const form = new FormData();
            form.append('file', fs.createReadStream(filePath));
            form.append('projectId', projectId);

            const res = await getAxios().post(`${this.baseUrl}/assets/upload`, form, {
                headers: { ...this._headers(), ...form.getHeaders() },
                timeout: 60000,
            });
            return res.data || { assetId: 'asset_' + Date.now() };
        } catch (err) {
            console.warn(`[GFXToolz] uploadAsset failed (${err.message}) — returning placeholder`);
            return { assetId: 'asset_' + Date.now() };
        }
    }

    /**
     * Generate final social clip with templates
     */
    async generateSocialClip(projectId, assetId, templateId, caption) {
        console.log(`[GFXToolz] Generating clip with template ${templateId}...`);
        console.log(`[GFXToolz] Caption: "${caption}"`);

        if (!this.authenticated) {
            return { status: 'dry-run', downloadUrl: null };
        }

        try {
            const res = await getAxios().post(`${this.baseUrl}/render`, {
                projectId, assetId, templateId, caption,
            }, { headers: this._headers(), timeout: 120000 });
            return res.data || { status: 'completed', downloadUrl: null };
        } catch (err) {
            console.warn(`[GFXToolz] generateSocialClip failed (${err.message})`);
            return { status: 'failed', downloadUrl: null };
        }
    }

    // ─── Methods expected by content-engine.ts ────────────

    /**
     * Generate a text caption for a campaign topic and platform.
     * @returns {Promise<string|null>} The caption text, or null in dry-run mode
     */
    async generateCaption(topic, platform) {
        console.log(`[GFXToolz] Generating caption for "${topic}" on ${platform}...`);
        if (!this.authenticated) return null;

        try {
            const res = await getAxios().post(`${this.baseUrl}/content/caption`, {
                topic, platform,
            }, { headers: this._headers(), timeout: 30000 });
            return (res.data && res.data.caption) || null;
        } catch (err) {
            console.warn(`[GFXToolz] generateCaption failed (${err.message})`);
            return null;
        }
    }

    /**
     * Generate an image from a prompt.
     * @returns {Promise<string|null>} URL or local path to the image, or null
     */
    async generateImage(prompt) {
        console.log(`[GFXToolz] Generating image: "${prompt.substring(0, 60)}..."`);
        if (!this.authenticated) return null;

        try {
            const res = await getAxios().post(`${this.baseUrl}/content/image`, {
                prompt,
            }, { headers: this._headers(), timeout: 60000 });
            return (res.data && res.data.url) || null;
        } catch (err) {
            console.warn(`[GFXToolz] generateImage failed (${err.message})`);
            return null;
        }
    }

    /**
     * Generate a video from a prompt.
     * @returns {Promise<string|null>} URL or local path to the video, or null
     */
    async generateVideo(prompt) {
        console.log(`[GFXToolz] Generating video: "${prompt.substring(0, 60)}..."`);
        if (!this.authenticated) return null;

        try {
            const res = await getAxios().post(`${this.baseUrl}/content/video`, {
                prompt,
            }, { headers: this._headers(), timeout: 120000 });
            return (res.data && res.data.url) || null;
        } catch (err) {
            console.warn(`[GFXToolz] generateVideo failed (${err.message})`);
            return null;
        }
    }

    /**
     * End-to-end convenience: upload raw video and produce a social-ready clip
     */
    async processVideo(rawVideoPath, personaType) {
        const project = await this.createProject(`${personaType}_${Date.now()}`);
        const asset = await this.uploadAsset(project.id, rawVideoPath);
        const result = await this.generateSocialClip(project.id, asset.assetId, personaType, `Auto-generated ${personaType} content`);
        return result.downloadUrl;
    }
}

module.exports = GFXToolz;
