import type { Meta, StoryObj } from '@storybook/react'
import { LoginForm } from '../auth/LoginForm'

const meta: Meta<typeof LoginForm> = {
  title: 'Auth/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#000000' },
      ],
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-96 p-8 bg-zinc-900 rounded-lg">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof LoginForm>

export const Default: Story = {}

export const InModal: Story = {
  decorators: [
    (Story) => (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 p-8">
          <Story />
        </div>
      </div>
    ),
  ],
}
