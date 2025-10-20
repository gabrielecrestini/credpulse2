// src/app/dashboard/page.tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useNhostClient, useAuthenticationStatus } from "@nhost/nextjs";
import { getErrorMessage } from "@/lib/errorUtils"; // Assicurati che esista

const StatCard = ({ value, label }: { value: string | number, label: string }) => (
  <div className="glass-card p-6 text-center rounded-xl">
    <p className="font-heading text-6xl text-electric-blue tracking-wider">{value}</p>
    <p className="text-gray-400 uppercase text-sm font-bold">{label}</p>
  </div>
);

export default function DashboardPage() {
  const nhost = useNhostClient();
  const { isAuthenticated, isLoading: authLoading } = useAuthenticationStatus();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) { setIsLoading(false); return; }
      setIsLoading(true);
      setError(null);
      try {
        // --- CHIAMATA CORRETTA A get-profile ---
        const { res, error: funcError } = await nhost.functions.call('get-profile'); // <-- MODIFICATO QUI
        // --------------------------------------

        if (funcError) throw funcError;
        if (res.status === 200) {
          setProfileData(await res.json());
        } else {
           const errorData = await res.json();
           // Lancia un oggetto che include lo status per debug
           throw { status: res.status, ...errorData };
        }
      } catch (err: any) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
        fetchProfile();
    }
  }, [isAuthenticated, authLoading, nhost.functions]);

  const credsBalance = isLoading ? "..." : (error ? "ERR" : (profileData?.creds_balance ?? 0)); // Usa ?? per default 0 se null/undefined
  const inviteCount = isLoading ? "..." : (error ? "ERR" : (profileData?.invite_count ?? 0)); // Usa ?? per default 0

  return (
    <div>
      <h1 className="font-heading text-6xl tracking-wider text-white mb-8">
        La Tua <span className="text-electric-blue">Dashboard</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard value={credsBalance} label="Creds Guadagnati" />
        <StatCard value={inviteCount} label="Amici Invitati" />
        <StatCard value="0" label="Missioni Completate" />
      </div>

      {error && <p className="text-red-500 mt-4 text-center glass-card p-3 mb-6">Errore recupero dati: {error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ... Link alle offerte e inviti ... */}
        <Link href="/dashboard/offers" className="glass-card p-8 ...">...</Link>
        <Link href="/dashboard/invite" className="glass-card p-8 ...">...</Link>
      </div>
    </div>
  );
}