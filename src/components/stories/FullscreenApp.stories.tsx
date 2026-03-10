import type { Meta, StoryObj } from '@storybook/react'
import { FullscreenApp } from '../FullscreenApp'

const meta: Meta<typeof FullscreenApp> = {
  title: 'App/FullscreenApp',
  component: FullscreenApp,
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
    showParticleLanding: {
      control: 'boolean',
      description: 'Whether to show the particle landing screen',
    },
  },
}

export default meta
type Story = StoryObj<typeof FullscreenApp>

export const Default: Story = {
  args: {
    showParticleLanding: false,
  },
}

export const WithParticleLanding: Story = {
  args: {
    showParticleLanding: true,
  },
}

export const FullExperience: Story = {
  args: {
    showParticleLanding: true,
  },
}
