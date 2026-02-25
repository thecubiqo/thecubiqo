/**
 * Settings Cube Layout
 * Terminal-style dark theme
 */

export default function SettingsCubeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {children}
    </div>
  )
}
