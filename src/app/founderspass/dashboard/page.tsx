'use client'

import { useState, useEffect } from 'react'
import { HealthIndicator } from '@/components/common/HealthIndicator'
import { DesignSelector } from '@/components/founderspass/DesignSelector'
import { FeatureToggleList, type Feature } from '@/components/founderspass/FeatureToggleList'
import { AuditActivitySidebar } from '@/components/founderspass/AuditActivitySidebar'

interface CatalogResponse {
  features: Feature[]
  categories: string[]
  active_design: string
  error?: string
}

export default function Dashboard() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [filterState, setFilterState] = useState<'all' | 'enabled' | 'disabled'>('all')

  useEffect(() => {
    fetchCatalog()
  }, [])

  const fetchCatalog = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await fetch('/api/founderspass/catalog', { cache: 'no-store' })
      
      if (!res.ok) {
        throw new Error(`Failed to fetch catalog: ${res.status}`)
      }
      
      const data: CatalogResponse = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setCatalog(data)
    } catch (err: any) {
      console.error('Catalog fetch error:', err)
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (feature: Feature, enabled: boolean) => {
    if (!catalog) return
    
    // Optimistic update
    const updatedFeatures = catalog.features.map(f =>
      f.feature_key === feature.feature_key
        ? { ...f, user_enabled: enabled, has_user_override: true }
        : f
    )
    
    setCatalog({ ...catalog, features: updatedFeatures })
    
    try {
      const res = await fetch('/api/founderspass/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_key: feature.feature_key,
          enabled,
          is_design_variant: false
        })
      })
      
      if (!res.ok) {
        throw new Error('Failed to update toggle')
      }
      
      // Refresh catalog to get latest state
      await fetchCatalog()
    } catch (err: any) {
      console.error('Toggle error:', err)
      
      // Rollback optimistic update
      const revertedFeatures = catalog.features.map(f =>
        f.feature_key === feature.feature_key
          ? feature
          : f
      )
      
      setCatalog({ ...catalog, features: revertedFeatures })
      
      alert('Failed to update toggle: ' + err.message)
    }
  }

  const handleDesignSelect = async (featureKey: string) => {
    if (!catalog) return
    
    try {
      const res = await fetch('/api/founderspass/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_key: featureKey,
          enabled: true,
          is_design_variant: true
        })
      })
      
      if (!res.ok) {
        throw new Error('Failed to update design')
      }
      
      // Refresh catalog
      await fetchCatalog()
    } catch (err: any) {
      console.error('Design selection error:', err)
      alert('Failed to update design: ' + err.message)
    }
  }

  // Filter features based on search and filters
  const getFilteredFeatures = () => {
    if (!catalog) return []
    
    return catalog.features.filter(f => {
      // Search filter
      const matchesSearch = !searchQuery || 
        f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.feature_key.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Category filter
      const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory
      
      // State filter
      const effectiveState = f.has_user_override ? f.user_enabled : f.default_enabled
      const matchesState = 
        filterState === 'all' ||
        (filterState === 'enabled' && effectiveState) ||
        (filterState === 'disabled' && !effectiveState)
      
      return matchesSearch && matchesCategory && matchesState && f.feature_type === 'toggle'
    })
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading FoundersPass Dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !catalog) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-gray-900/50 border border-red-800 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">Dashboard Error</h2>
          <p className="text-gray-400 mb-6">{error || 'Failed to load dashboard'}</p>
          <button
            onClick={fetchCatalog}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const designVariants = catalog.features.filter(f => f.feature_type === 'design_variant')
  const categories = catalog.categories.filter(c => c !== 'visuals')

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              👑 FoundersPass Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Unified control center for features and designs</p>
          </div>
          
          <div className="flex gap-4 items-start">
            <HealthIndicator />
            <button 
              onClick={fetchCatalog} 
              className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Search Features</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, description..."
                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            
            {/* Category Filter */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            
            {/* State Filter */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">State</label>
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value as any)}
                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All States</option>
                <option value="enabled">Enabled Only</option>
                <option value="disabled">Disabled Only</option>
              </select>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-4 text-sm text-gray-500">
            Showing {getFilteredFeatures().length} features
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column: Feature Toggles (2/3 width) */}
          <div className="xl:col-span-2 space-y-6">
            {categories.map(category => {
              const categoryFeatures = getFilteredFeatures().filter(f => f.category === category)
              if (categoryFeatures.length === 0) return null
              
              return (
                <div key={category} className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-800">
                    <h2 className="font-semibold uppercase text-sm tracking-wider text-gray-300">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </h2>
                  </div>
                  
                  <FeatureToggleList
                    features={catalog.features}
                    category={category}
                    onToggle={handleToggle}
                    searchQuery={searchQuery}
                  />
                </div>
              )
            })}
            
            {getFilteredFeatures().length === 0 && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-400">No features match your filters</p>
              </div>
            )}
          </div>

          {/* Right Column: Design Selector + Audit Log (1/3 width) */}
          <div className="space-y-6">
            {/* Design Selector */}
            <DesignSelector
              variants={designVariants}
              activeDesign={catalog.active_design}
              onSelect={handleDesignSelect}
            />
            
            {/* Audit Activity */}
            <AuditActivitySidebar />
          </div>
        </div>
      </div>
    </div>
  )
}
