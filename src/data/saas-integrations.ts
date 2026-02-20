// SaaS & Business Integration Ecosystem Data

export interface IntegrationItem {
  name: string;
  subcategory?: string;
}

export interface IntegrationCategory {
  id: string;
  label: string;
  icon: string;
  items: IntegrationItem[];
}

export const SAAS_INTEGRATIONS: IntegrationCategory[] = [
  {
    id: 'workflow-automation',
    label: 'Workflow & Automation',
    icon: '⚡',
    items: [
      { name: 'API integrations' },
      { name: 'Webhooks' },
      { name: 'Zapier', subcategory: 'iPaaS' },
      { name: 'Make', subcategory: 'iPaaS' },
      { name: 'n8n', subcategory: 'iPaaS' },
      { name: 'ETL / Data pipelines' },
    ],
  },
  {
    id: 'core-business',
    label: 'Core Business Systems',
    icon: '🏢',
    items: [
      { name: 'Salesforce', subcategory: 'CRM' },
      { name: 'HubSpot', subcategory: 'CRM' },
      { name: 'Zoho', subcategory: 'CRM' },
      { name: 'Dynamics 365', subcategory: 'CRM' },
      { name: 'QuickBooks', subcategory: 'ERP / Accounting' },
      { name: 'Xero', subcategory: 'ERP / Accounting' },
      { name: 'NetSuite', subcategory: 'ERP / Accounting' },
      { name: 'SAP', subcategory: 'ERP / Accounting' },
      { name: 'BambooHR', subcategory: 'HR' },
      { name: 'Workday', subcategory: 'HR' },
      { name: 'ADP', subcategory: 'HR' },
      { name: 'Gusto', subcategory: 'HR' },
    ],
  },
  {
    id: 'marketing-stack',
    label: 'Marketing Stack',
    icon: '📢',
    items: [
      { name: 'Mailchimp', subcategory: 'Email & SMS' },
      { name: 'Klaviyo', subcategory: 'Email & SMS' },
      { name: 'Twilio', subcategory: 'Email & SMS' },
      { name: 'SendGrid', subcategory: 'Email & SMS' },
      { name: 'Google Ads', subcategory: 'Ads & Analytics' },
      { name: 'Meta Ads', subcategory: 'Ads & Analytics' },
      { name: 'LinkedIn Ads', subcategory: 'Ads & Analytics' },
      { name: 'Supermetrics', subcategory: 'Ads & Analytics' },
      { name: 'ActiveCampaign', subcategory: 'Marketing Automation' },
      { name: 'Marketo', subcategory: 'Marketing Automation' },
      { name: 'HubSpot Marketing', subcategory: 'Marketing Automation' },
    ],
  },
  {
    id: 'ecommerce-payments',
    label: 'E-Commerce & Payments',
    icon: '🛒',
    items: [
      { name: 'Shopify', subcategory: 'E-Commerce' },
      { name: 'WooCommerce', subcategory: 'E-Commerce' },
      { name: 'Magento', subcategory: 'E-Commerce' },
      { name: 'BigCommerce', subcategory: 'E-Commerce' },
      { name: 'Stripe', subcategory: 'Payments' },
      { name: 'PayPal', subcategory: 'Payments' },
      { name: 'Square', subcategory: 'Payments' },
      { name: 'Adyen', subcategory: 'Payments' },
      { name: 'FedEx', subcategory: 'Shipping' },
      { name: 'UPS', subcategory: 'Shipping' },
      { name: 'DHL', subcategory: 'Shipping' },
    ],
  },
  {
    id: 'customer-support',
    label: 'Customer Support',
    icon: '💬',
    items: [
      { name: 'Zendesk' },
      { name: 'Intercom' },
      { name: 'Drift' },
      { name: 'Freshdesk' },
      { name: 'HelpScout' },
    ],
  },
  {
    id: 'communication-productivity',
    label: 'Communication & Productivity',
    icon: '💼',
    items: [
      { name: 'Slack', subcategory: 'Chat' },
      { name: 'Microsoft Teams', subcategory: 'Chat' },
      { name: 'Zoom', subcategory: 'Video' },
      { name: 'Google Workspace', subcategory: 'Productivity' },
      { name: 'Outlook / Gmail', subcategory: 'Email' },
      { name: 'Notion', subcategory: 'Docs' },
      { name: 'Confluence', subcategory: 'Docs' },
    ],
  },
  {
    id: 'data-bi',
    label: 'Data & BI',
    icon: '📊',
    items: [
      { name: 'GA4' },
      { name: 'Looker' },
      { name: 'Tableau' },
      { name: 'Power BI' },
      { name: 'Snowflake' },
      { name: 'Elasticsearch' },
    ],
  },
  {
    id: 'identity-compliance',
    label: 'Identity & Compliance',
    icon: '🔐',
    items: [
      { name: 'Auth0', subcategory: 'Identity' },
      { name: 'Okta', subcategory: 'Identity' },
      { name: 'OneLogin', subcategory: 'Identity' },
      { name: 'DocuSign', subcategory: 'E-Signature' },
      { name: 'Adobe Sign', subcategory: 'E-Signature' },
    ],
  },
  {
    id: 'developer-enablement',
    label: 'Developer Enablement',
    icon: '👨‍💻',
    items: [
      { name: 'GitHub' },
      { name: 'GitLab' },
      { name: 'Bitbucket' },
      { name: 'Webhooks', subcategory: 'Developer Tools' },
      { name: 'SDK embeds' },
      { name: 'Custom APIs' },
    ],
  },
  {
    id: 'ai-integrations',
    label: 'AI Integrations',
    icon: '🤖',
    items: [
      { name: 'OpenAI' },
      { name: 'Anthropic' },
      { name: 'Gemini' },
      { name: 'Local LLM hosting' },
      { name: 'Predictive analytics' },
    ],
  },
];
