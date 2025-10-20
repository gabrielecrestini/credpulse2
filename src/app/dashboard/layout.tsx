// src/app/dashboard/layout.tsx
"use client";

import Link from 'next/link';
import { useNhostClient } from '@nhost/nextjs';
import { useRouter } from 'next/navigation';

const SignOutButton = () => {
  const nhost = useNhostClient();
  const router = useRouter();
  const handleSignOut = async () => {
    await nhost.auth.signOut();
    router.push('/');
  };
  return <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-gray-400 hover:bg-electric-blue hover:text-space-deep rounded-md transition-colors">Esci</button>;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-160px)]">
      <aside className="w-64 glass-card p-4 m-4 rounded-2xl flex-shrink-0">
        <nav className="flex flex-col h-full">
          <Link href="/dashboard" className="px-4 py-2 font-bold text-white hover:bg-white/10 rounded-md transition-colors">Home</Link>
          <Link href="/dashboard/offers" className="px-4 py-2 font-bold text-white hover:bg-white/10 rounded-md transition-colors">Offerte</Link>
          <Link href="/dashboard/invite" className="px-4 py-2 font-bold text-white hover:bg-white/10 rounded-md transition-colors">Invita un Amico</Link>
          <Link href="/dashboard/account" className="px-4 py-2 font-bold text-white hover:bg-white/10 rounded-md transition-colors">Account</Link>
          <div className="mt-auto">
             <SignOutButton />
          </div>
        </nav>
      </aside>
      <main className="flex-grow p-8">
        {children}
      </main>
    </div>
  );
}