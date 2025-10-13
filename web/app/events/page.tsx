'use client';
import React, { useEffect, useState } from 'react';
import EventCard from '../../components/EventCard';

export default function EventsPage() {
  const [lang, setLang] = useState<'fr'|'en'>((localStorage.getItem('lang') as any) || 'fr');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const resp = await fetch('/api/events');
      const data = await resp.json();
      setItems(data || []);
    } finally { setLoading(false); }
  }
  useEffect(()=>{ load(); }, []);

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">{lang==='fr'?'Événements':'Events'}</h1>
        <div className="ml-auto flex gap-2">
          <button onClick={()=>{localStorage.setItem('lang','fr'); setLang('fr');}} className={`px-2 py-1 border rounded ${lang==='fr'?'bg-black text-white':''}`}>FR</button>
          <button onClick={()=>{localStorage.setItem('lang','en'); setLang('en');}} className={`px-2 py-1 border rounded ${lang==='en'?'bg-black text-white':''}`}>EN</button>
        </div>
      </div>

      {loading ? <div>…</div> : (
        <div className="grid gap-4">
          {items.map(ev => <EventCard key={ev.id} ev={ev} lang={lang} onRSVPed={load} />)}
          {!items.length && <div className="text-sm text-gray-500">{lang==='fr'?'Aucun événement.':'No events.'}</div>}
        </div>
      )}
    </div>
  );
}



