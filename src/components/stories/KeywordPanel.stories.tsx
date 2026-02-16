import type { Meta, StoryObj } from '@storybook/react'
import { KeywordPanel } from '../KeywordPanel'

const meta: Meta<typeof KeywordPanel> = {
  title: 'Components/KeywordPanel',
  component: KeywordPanel,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#000000' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the panel is open',
    },
    isDark: {
      control: 'boolean',
      description: 'Whether to use a dark theme variant',
    },
    onClose: { action: 'panel closed' },
  },
}

export default meta
type Story = StoryObj<typeof KeywordPanel>

export const Closed: Story = {
  args: {
    isOpen: false,
    isDark: true,
    sessionId: 'storybook-session',
  },
}

export const Open: Story = {
  args: {
    isOpen: true,
    isDark: true,
    sessionId: 'storybook-session',
  },
}

export const OpenLightTheme: Story = {
  args: {
    isOpen: true,
    isDark: false,
    sessionId: 'storybook-session',
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
}
