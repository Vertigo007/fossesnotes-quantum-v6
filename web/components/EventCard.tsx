'use client';
import React from 'react';

type Lang = 'fr'|'en';
export default function EventCard({ ev, lang='fr', onRSVPed }:{
  ev:any; lang?:Lang; onRSVPed?:()=>void;
}) {
  const t = {
    fr: { rsvp:'Je participe', wait:'Liste d\'attente', decline:'Je passe', date:'Date' },
    en: { rsvp:'RSVP',         wait:'Waitlist',        decline:'Decline', date:'Date' }
  }[lang];

  async function rsvp(status:'going'|'waitlist'|'declined') {
    const token = localStorage.getItem('token') || '';
    const resp = await fetch(`/api/events/${ev.slug}/rsvp`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) },
      body: JSON.stringify({ status })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(()=> ({}));
      alert(err?.error || 'RSVP error');
    } else {
      onRSVPed?.();
    }
  }

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm" data-testid="event-card">
      <div className="text-lg font-semibold" data-testid="event-title">{lang==='fr'?ev.title_fr:ev.title_en}</div>
      <div className="text-sm text-gray-500" data-testid="event-date">
        {t.date}: {new Date(ev.start_at).toLocaleString()} — {new Date(ev.end_at).toLocaleString()}
      </div>
      {ev.location_text && <div className="text-sm mt-1">{ev.location_text}</div>}
      <div className="text-sm mt-2 whitespace-pre-wrap" data-testid="event-description">
        {(lang==='fr'?ev.description_fr:ev.description_en) || ''}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="px-3 py-1 border rounded" data-testid="rsvp-going" onClick={()=>rsvp('going')}>{t.rsvp}</button>
        <button className="px-3 py-1 border rounded" data-testid="rsvp-waitlist" onClick={()=>rsvp('waitlist')}>{t.wait}</button>
        <button className="px-3 py-1 border rounded" data-testid="rsvp-declined" onClick={()=>rsvp('declined')}>{t.decline}</button>
      </div>
    </div>
  );
}
