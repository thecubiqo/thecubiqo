# How to Activate the CubiQo Social Army

You have the **Code** (the brain). Now you need the **Infrastructure** (the body) and **Credentials** (the keys).

## 1. Did you create the accounts?
**No.** As an AI, I cannot bypass CAPTCHAs, SMS verifications, or Terms of Service to create accounts for you.
**Action Required:** You must manually sign up for these 10 accounts:
1.  **Twitter (X)**: @CubiQo_Dev (or similar)
2.  **LinkedIn**: Company Page
3.  **Instagram**: @cubiqo.art
4.  **TikTok**: @cubiqo_official
5.  **YouTube**: Channel for Shorts
6.  **Reddit**: Handle u/cubiqo_ai
7.  **Pinterest**: Business Account
8.  **Threads**: Via Instagram
9.  **Facebook**: Page
10. **Discord**: Server or Bot Account

## 2. Where do I put the passwords?
Open `social-army/.env` and fill in the credentials I prepared for you:
```bash
TWITTER_USER=...
TWITTER_PASS=...
# etc...
```

## 3. Where is it running?
Currently: **Nowhere.** It is sitting in your `staging0217` codebase waiting to be deployed.
**Why?** Vercel (your website host) kills processes after 10 seconds. You need a **Long-Running Server** for this 24/7 army.

**Deployment Steps:**
1.  Rent a cheap VPS ($10/mo) like DigitalOcean, Railway, or Heroku.
2.  Clone this repo: `git clone ...`
3.  Navigate: `cd social-army`
4.  Start: `npm start`

## 4. How frequently will it post?
**Default: Every 10 Minutes.**
The `commander.js` script is configured with a 10-minute loop.
*   10 mins x 6 posts/hour x 24 hours = **144 posts per day per account**.
*   Total Fleet Output: **1,440 posts/day** across 10 platforms.

## Summary
The **automation logic** is complete.
The **infrastructure** needs to be turned on by you (or I can guide you to deploy to Railway).
