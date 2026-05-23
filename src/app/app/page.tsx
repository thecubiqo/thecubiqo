import { redirect } from 'next/navigation';

export default function AppRootRedirect() {
  redirect('/chat');
}
