'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const ProfileConsent = dynamic(() => import('../../components/ProfileConsent'), {
  ssr: false
});

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="text-2xl font-bold mb-4">Profil</h1>
      <div className="space-y-4">
        <ProfileConsent />
        {/* Add other profile components here */}
      </div>
    </div>
  );
}



