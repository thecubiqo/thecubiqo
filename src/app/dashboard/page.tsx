import { redirect } from 'next/navigation';

// Legacy alias → DuoMode (the dashboard surface). (Was the CRA shell.)
export default function DashboardPage() {
  redirect('/duo');
}
