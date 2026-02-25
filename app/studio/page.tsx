import { Metadata } from 'next';
import StudioLayout from '@/components/studio/StudioLayout';

export const metadata: Metadata = {
  title: 'Studio - Build with AI | CubiQo',
  description: 'Build applications through conversation with AI',
};

export default function StudioPage() {
  return <StudioLayout />;
}
