import type { Meta, StoryObj } from '@storybook/react'
import { AuthButton } from '../AuthButton.client'

const meta: Meta<typeof AuthButton> = {
  title: 'Components/AuthButton',
  component: AuthButton,
  parameters: {
    layout: 'centered',
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
    isDark: {
      control: 'boolean',
      description: 'Whether to use a dark theme variant',
    },
    onSignInClick: { action: 'sign-in clicked' },
    onUserClick: { action: 'user avatar clicked' },
  },
}

export default meta
type Story = StoryObj<typeof AuthButton>

export const Default: Story = {
  args: {
    isDark: true,
  },
}

export const LightTheme: Story = {
  args: {
    isDark: false,
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
}

export const WithCallbacks: Story = {
  args: {
    isDark: true,
    onSignInClick: () => console.log('Sign in clicked'),
    onUserClick: () => console.log('User clicked'),
  },
}
