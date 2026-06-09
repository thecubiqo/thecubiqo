import { redirect } from 'next/navigation';

// Root entry: launch straight into the app. CubiQo is usable anonymously
// (try-before-signup — chat + capsules work without auth), and signing in is
// optional from inside the app. Logged-in users keep their session on /chat.
export default function HomePage() {
  redirect('/chat');
}
