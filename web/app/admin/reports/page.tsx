'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const AdminReports = dynamic(() => import('../../../components/AdminReports'), {
  ssr: false
});

export default function AdminReportsPage() {
  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="text-2xl font-bold mb-4">Rapports Administratifs</h1>
      <div className="space-y-4">
        <AdminReports />
        {/* Add other admin components here */}
      </div>
    </div>
  );
}



