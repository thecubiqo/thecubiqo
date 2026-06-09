import { redirect } from 'next/navigation';

// Legacy alias → new app. (Was the CRA shell.)
export default function ActionsPage() {
  redirect('/chat');
}
