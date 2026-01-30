/**
 * Comprehensive configuration schema for template1
 * Based on analysis of all template1 components
 */

export interface Template1Config {
  // Site Metadata
  metadata: {
    title: string
    description: string
  }

  // Navigation
  navigation: {
    logoText: string
    logoIcon?: string
    links: Array<{
      label: string
      href: string
    }>
    coOpBadge?: {
      enabled: boolean
      text: string
      url: string
    }
  }

  // Hero Section
  hero: {
    tagline: string
    headingLine1: string
    headingLine2: string
    subtitle: string
    primaryCTA: {
      text: string
      href: string
    }
    secondaryCTA: {
      text: string
      href: string
    }
    previewButton: {
      text: string
      subtext: string
    }
    backgroundImage?: string
    backgroundVideo?: string
  }

  // Colors
  colors: {
    primary: string // Main brand color
    secondary: string // Secondary accent
    accent: string // Highlight color
    gradientFrom: string
    gradientTo: string
  }

  // Devices Section
  devices: {
    title?: string
    description?: string
    mobileImage?: string
    watchImage?: string
    tabletImage?: string
    features: Array<{
      icon?: string
      title: string
      description: string
    }>
  }

  // Intelligence Section
  intelligence: {
    title?: string
    description?: string
    content?: string
  }

  // Video Section
  video: {
    title?: string
    description?: string
    videoUrl?: string
    thumbnail?: string
  }

  // Contact Section
  contact: {
    sectionTagline: string
    title: string
    description: string
    formPlaceholder: string
    buttonText: string
    successMessage: string
    trustBadges: Array<{
      icon?: string
      text: string
    }>
  }

  // Footer
  footer: {
    brandName: string
    brandDescription: string
    logoIcon?: string
    productLinks: Array<{
      label: string
      href: string
    }>
    companyLinks: Array<{
      label: string
      href: string
    }>
    legalLinks: Array<{
      label: string
      href: string
    }>
    socialLinks: Array<{
      platform: string
      url: string
      icon?: string
    }>
    copyrightText: string
    appStoreLinks?: {
      enabled: boolean
      appStoreUrl?: string
      playStoreUrl?: string
    }
  }

  // Worlds Section
  worlds: {
    title?: string
    description?: string
    worlds: Array<{
      name: string
      description: string
      icon?: string
    }>
  }

  // Merch Section
  merch: {
    enabled: boolean
    title?: string
    description?: string
    items?: Array<{
      name: string
      price: string
      image?: string
      link?: string
    }>
  }

  // Cuboids Section
  cuboids: {
    enabled: boolean
    title?: string
  }
}

export const defaultTemplate1Config: Template1Config = {
  metadata: {
    title: 'My Site - Welcome',
    description: 'Website description',
  },
  navigation: {
    logoText: 'MySite',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Contact', href: '#contact' },
      { label: 'Worlds', href: '#worlds' },
    ],
    coOpBadge: {
      enabled: false,
      text: 'Co-op Assist',
      url: 'https://coop.ai',
    },
  },
  hero: {
    tagline: 'The Cooperative Virtual Assistant',
    headingLine1: 'Cuz life is',
    headingLine2: 'three dimensional',
    subtitle: 'Privacy-first AI companion with infinite memory',
    primaryCTA: {
      text: 'Start Talking',
      href: '#demo',
    },
    secondaryCTA: {
      text: 'Watch Demo',
      href: '#demo',
    },
    previewButton: {
      text: '15 sec preview',
      subtext: 'See in action',
    },
  },
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#10b981',
    gradientFrom: '#06b6d4',
    gradientTo: '#3b82f6',
  },
  devices: {
    features: [
      {
        title: 'Privacy First',
        description: 'Your data stays yours. Local-first architecture with optional sync.',
      },
      {
        title: 'Infinite Memory',
        description: 'Remember everything. Extract and recall memories across conversations.',
      },
      {
        title: 'Dual AI Models',
        description: 'Claude, GPT, and more. Choose the best model for each task.',
      },
      {
        title: 'Multi-World',
        description: 'Headlines, Vocspad, and more. Different modes for different needs.',
      },
    ],
  },
  intelligence: {},
  video: {},
  contact: {
    sectionTagline: 'Stay Connected',
    title: 'Get in Touch',
    description: 'Join VIP for early access, updates, and exclusive features.',
    formPlaceholder: 'Enter your email',
    buttonText: 'Join VIP',
    successMessage: 'Welcome to VIP! Check your email for confirmation.',
    trustBadges: [
      { text: 'No spam' },
      { text: 'Privacy-first' },
      { text: 'Early access' },
    ],
  },
  footer: {
    brandName: 'MySite™',
    brandDescription: 'The Cooperative Virtual Assistant. Privacy-first AI companion.',
    productLinks: [
      { label: 'Features', href: '#features' },
      { label: 'Demo', href: '#demo' },
      { label: 'Worlds', href: '#worlds' },
      { label: 'Pricing', href: '#' },
    ],
    companyLinks: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#contact' },
    ],
    legalLinks: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Cookies', href: '#' },
    ],
    socialLinks: [
      { platform: 'Twitter', url: '#' },
      { platform: 'Instagram', url: '#' },
      { platform: 'GitHub', url: '#' },
      { platform: 'Discord', url: '#' },
    ],
    copyrightText: `© ${new Date().getFullYear()} MySite. All rights reserved.`,
    appStoreLinks: {
      enabled: false,
    },
  },
  worlds: {},
  merch: {
    enabled: false,
  },
  cuboids: {
    enabled: true,
  },
}

