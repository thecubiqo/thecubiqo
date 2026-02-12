/**
 * FoundersPass Home
 * Redirects to experiments or shows founder dashboard
 */

import { redirect } from 'next/navigation'

export default function FoundersPassPage() {
  // Redirect to experiments page for now
  redirect('/founderspass/experiments')
  
  // This won't render due to redirect
  return null
}