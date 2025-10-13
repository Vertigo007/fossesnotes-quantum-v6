'use client';
import React, { useEffect, useState } from 'react';

export default function ProfileConsent(){
  const [me, setMe] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function load(){
    const token = localStorage.getItem('token') || '';
    const r = await fetch('/api/profile/me', { headers: token?{Authorization:`Bearer ${token}`}:{}} );
    const j = await r.json(); if (r.ok) setMe(j);
  }
  useEffect(()=>{ load(); }, []);

  async function setConsent(share:boolean){
    setBusy(true);
    try{
      const token = localStorage.getItem('token') || '';
      const r = await fetch('/api/profile/consent', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) },
        body: JSON.stringify({ share })
      });
      const j = await r.json();
      if (r.ok) load(); else alert(j?.error || 'Error');
    } finally { setBusy(false); }
  }

  if (!me) return <div>…</div>;
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <div className="text-lg font-semibold mb-2">Partage de données</div>
      <p className="text-sm text-gray-600 mb-3">
        En cochant, vous autorisez l'utilisation <b>anonymisée</b> de vos journaux/prises (agrégats) pour des rapports scientifiques.
      </p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            data-testid="consent-checkbox"
            checked={!!me.consent_share} 
            onChange={e=>setConsent(e.target.checked)} 
            disabled={busy}
          />
          <span>{me.consent_share ? 'Opt-in activé' : 'Opt-in désactivé'}</span>
        </label>
        <div className="text-xs text-gray-500 ml-auto">
          Version: {me.consent_version || '—'} {me.consent_updated_at ? `• ${new Date(me.consent_updated_at).toLocaleString()}`:''}
        </div>
      </div>
    </div>
  );
}



