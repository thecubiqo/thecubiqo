import type { Meta, StoryObj } from '@storybook/react'
import NeonGlassCube from '../NeonGlassCube'

const meta: Meta<typeof NeonGlassCube> = {
  title: 'Components/NeonGlassCube',
  component: NeonGlassCube,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#050814' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: { type: 'range', min: 200, max: 800, step: 50 },
      description: 'Canvas width in pixels',
    },
    height: {
      control: { type: 'range', min: 200, max: 800, step: 50 },
      description: 'Canvas height in pixels',
    },
    autoRotate: {
      control: 'boolean',
      description: 'Whether the cube rotates automatically',
    },
    showControls: {
      control: 'boolean',
      description: 'Whether orbit controls are enabled',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#050814' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof NeonGlassCube>

export const Default: Story = {
  args: {
    width: 500,
    height: 500,
    autoRotate: true,
    showControls: true,
  },
}

export const Static: Story = {
  args: {
    width: 500,
    height: 500,
    autoRotate: false,
    showControls: true,
  },
}

export const NoControls: Story = {
  args: {
    width: 500,
    height: 500,
    autoRotate: true,
    showControls: false,
  },
}

export const Large: Story = {
  args: {
    width: 700,
    height: 700,
    autoRotate: true,
    showControls: true,
  },
}
