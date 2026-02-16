import type { Meta, StoryObj } from '@storybook/react'
import { AuthNudgeModal } from '../auth/AuthNudgeModal'

const meta: Meta<typeof AuthNudgeModal> = {
  title: 'Auth/AuthNudgeModal',
  component: AuthNudgeModal,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#000000' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    cta: {
      control: 'text',
      description: 'AI-generated personalized CTA',
    },
    onClose: { action: 'modal closed' },
  },
}

export default meta
type Story = StoryObj<typeof AuthNudgeModal>

export const Closed: Story = {
  args: {
    isOpen: false,
    cta: "Let's stay connected",
  },
}

export const Open: Story = {
  args: {
    isOpen: true,
    cta: "Let's stay connected",
  },
}

export const WithPersonalizedCTA: Story = {
  args: {
    isOpen: true,
    cta: "Save your journey & unlock AI insights",
  },
}

export const WithLongCTA: Story = {
  args: {
    isOpen: true,
    cta: "Continue exploring your personal growth journey with CubiQo",
  },
}
