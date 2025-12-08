import { FullscreenApp } from "@/components/FullscreenApp"
import { WorldBadge } from "@/components/WorldBadge"

/**
 * World Page
 *
 * Renders the main experience for all worlds:
 * - Regional worlds: /uk, /in
 * - Product worlds: /headlines, /vocspad
 */
export default function WorldPage() {
  return (
    <>
      <WorldBadge />
      <FullscreenApp />
    </>
  )
}
