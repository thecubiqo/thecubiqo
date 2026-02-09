/**
 * Integration Client
 * Client-side utilities for managing integrations
 */

import type { Integration, ServiceType, IntegrationUpdate } from '@/types/integrations'

export class IntegrationClient {
  /**
   * Fetch all integrations for the current user
   */
  static async getAll(): Promise<Integration[]> {
    const response = await fetch('/api/integrations')
    if (!response.ok) throw new Error('Failed to fetch integrations')
    const data = await response.json()
    return data.integrations || []
  }

  /**
   * Get a specific integration
   */
  static async get(service: ServiceType): Promise<Integration | null> {
    const response = await fetch(`/api/integrations/${service}`)
    if (response.status === 404) return null
    if (!response.ok) throw new Error('Failed to fetch integration')
    const data = await response.json()
    return data.integration
  }

  /**
   * Update an integration (toggles, config)
   */
  static async update(
    service: ServiceType,
    updates: IntegrationUpdate
  ): Promise<Integration> {
    const response = await fetch(`/api/integrations/${service}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!response.ok) throw new Error('Failed to update integration')
    const data = await response.json()
    return data.integration
  }

  /**
   * Disconnect an integration (removes OAuth tokens)
   */
  static async disconnect(service: ServiceType): Promise<void> {
    const response = await fetch(`/api/integrations/${service}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to disconnect integration')
  }

  /**
   * Initiate OAuth flow for a service
   */
  static async connect(service: ServiceType, returnUrl?: string): Promise<void> {
    const params = new URLSearchParams({ service })
    if (returnUrl) params.append('returnUrl', returnUrl)
    
    // Redirect to OAuth initiation endpoint
    window.location.href = `/api/integrations/oauth/authorize?${params.toString()}`
  }

  /**
   * Toggle read permission
   */
  static async toggleRead(service: ServiceType, enabled: boolean): Promise<Integration> {
    return this.update(service, { read_enabled: enabled })
  }

  /**
   * Toggle write permission
   */
  static async toggleWrite(service: ServiceType, enabled: boolean): Promise<Integration> {
    return this.update(service, { write_enabled: enabled })
  }

  /**
   * Check if a service is enabled for the agent
   */
  static async isEnabled(
    service: ServiceType,
    permission: 'read' | 'write'
  ): Promise<boolean> {
    try {
      const integration = await this.get(service)
      if (!integration || !integration.is_connected) return false
      return permission === 'read' 
        ? integration.read_enabled 
        : integration.write_enabled
    } catch {
      return false
    }
  }

  /**
   * Get all enabled services for a permission type
   */
  static async getEnabled(permission: 'read' | 'write'): Promise<ServiceType[]> {
    const integrations = await this.getAll()
    return integrations
      .filter(i => 
        i.is_connected && 
        (permission === 'read' ? i.read_enabled : i.write_enabled)
      )
      .map(i => i.service)
  }
}
