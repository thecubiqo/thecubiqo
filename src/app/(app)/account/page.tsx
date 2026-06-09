import { redirect } from 'next/navigation';

export default function AccountRoot() {
  redirect('/profile');
}
