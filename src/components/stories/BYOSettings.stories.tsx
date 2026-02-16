import type { Meta, StoryObj } from '@storybook/react'
import { BYOSettings } from '../byo/BYOSettings'

const meta: Meta<typeof BYOSettings> = {
  title: 'Components/BYOSettings',
  component: BYOSettings,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0a' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onClose: { action: 'settings closed' },
  },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full bg-zinc-900 rounded-lg border border-zinc-800 text-white">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof BYOSettings>

export const Default: Story = {}

export const InModal: Story = {
  decorators: [
    (Story) => (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-zinc-900 rounded-lg border border-zinc-800 text-white">
          <Story />
        </div>
      </div>
    ),
  ],
}
