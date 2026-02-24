'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }
  return (
    <button
      onClick={logout}
      className="text-[12px] text-[#A9A9A9] hover:text-[#F6F3EE] transition uppercase tracking-[0.16em]"
    >
      Sign out
    </button>
  )
}
