import type { Meta, StoryObj } from '@storybook/react'
import { RGYChatsModal } from '../RGYChatsModal'

const meta: Meta<typeof RGYChatsModal> = {
  title: 'Components/RGYChatsModal',
  component: RGYChatsModal,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0a' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    isDark: {
      control: 'boolean',
      description: 'Whether to use a dark theme variant',
    },
    onClose: { action: 'modal closed' },
  },
}

export default meta
type Story = StoryObj<typeof RGYChatsModal>

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

export const OpenWithLightTheme: Story = {
  args: {
    isOpen: true,
    isDark: false,
  },
}
