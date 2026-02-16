/**
 * FoundersPass Layout
 * Layout for founder-only features and experiments
 */

export default function FoundersPassLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Simple layout - can be enhanced later */}
      {children}
    </div>
  )
}