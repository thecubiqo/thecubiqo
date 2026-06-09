function truthy(value: string | undefined) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

export function allowGlobalCommerceConnectors() {
  return truthy(process.env.ALLOW_GLOBAL_COMMERCE_CONNECTORS_FOR_ADMIN_ONLY);
}

export function allowGlobalSocialConnectors() {
  return truthy(process.env.ALLOW_GLOBAL_SOCIAL_CONNECTORS_FOR_ADMIN_ONLY);
}

export function globalConnectorWarning(provider: string) {
  return `${provider} is using a shared server env connector. This is only allowed for explicit admin/single-tenant deployments.`;
}
