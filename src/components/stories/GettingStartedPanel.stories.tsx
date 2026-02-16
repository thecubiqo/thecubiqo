import type { Meta, StoryObj } from '@storybook/react'
import { GettingStartedPanel } from '../GettingStartedPanel'

const meta: Meta<typeof GettingStartedPanel> = {
  title: 'Components/GettingStartedPanel',
  component: GettingStartedPanel,
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
    onExampleClick: { action: 'example clicked' },
  },
}

export default meta
type Story = StoryObj<typeof GettingStartedPanel>

export const Closed: Story = {
  args: {
    isOpen: false,
    isDark: true,
  },
}

export const Open: Story = {
  args: {
    isOpen: true,
    isDark: true,
  },
}

export const OpenLightTheme: Story = {
  args: {
    isOpen: true,
    isDark: false,
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
}

export const WithExampleCallback: Story = {
  args: {
    isOpen: true,
    isDark: true,
    onExampleClick: (text: string) => console.log('Example clicked:', text),
  },
}
