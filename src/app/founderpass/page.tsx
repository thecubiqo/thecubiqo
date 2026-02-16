/**
 * Redirect from /founderpass to /founderspass
 * Handles typo in URL
 */

import { redirect } from 'next/navigation'

export default function FounderPassRedirect() {
  redirect('/founderspass')
}
