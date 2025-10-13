'use client';
import React, { useEffect, useState } from 'react';

export default function AdminReports(){
  const [river, setRiver] = useState('');
  const [from, setFrom]   = useState('');
  const [to, setTo]       = useState('');
  const [summary, setSummary] = useState<any[]>([]);
  const [mf, setMF] = useState<{methods:any[],flies:any[]}>({methods:[],flies:[]});

  async function load(){
    const token = localStorage.getItem('token') || '';
    const q = `?river_slug=${encodeURIComponent(river)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const s = await fetch('/api/admin/reports/summary'+q, { headers: token?{Authorization:`Bearer ${token}`}:{}} );
    const j = await s.json(); if (s.ok) setSummary(j); else alert(j?.error||'error');
    const f = await fetch('/api/admin/reports/methods_flies'+q, { headers: token?{Authorization:`Bearer ${token}`}:{}} );
    const jf = await f.json(); if (f.ok) setMF(jf);
  }
  function dlCSV(){
    const q = `?river_slug=${encodeURIComponent(river)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    window.location.href = '/api/admin/exports/csv'+q;
  }

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <div className="text-lg font-semibold mb-3">Rapports Big Data (Admin)</div>
      <div className="grid md:grid-cols-4 gap-2 mb-3">
        <input className="border rounded p-2" placeholder="river_slug" value={river} onChange={e=>setRiver(e.target.value)} />
        <input className="border rounded p-2" type="date" value={from} onChange={e=>setFrom(e.target.value)} />
        <input className="border rounded p-2" type="date" value={to} onChange={e=>setTo(e.target.value)} />
        <button className="px-3 py-2 border rounded" onClick={load}>Charger</button>
      </div>

      <div className="mb-3">
        <button className="px-3 py-2 border rounded" onClick={dlCSV}>Exporter CSV</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="font-medium mb-2">CPUE & tailles</div>
          <div className="space-y-1">
            {summary.map((r,i)=>(
              <div key={i} className="text-sm border-b py-1">
                {r.river_slug || '—'} • {r.date_utc} • prises: {r.total_catches} • L moy: {Number(r.avg_length||0).toFixed(1)} cm
              </div>
            ))}
            {!summary.length && <div className="text-sm text-gray-500">Aucune donnée.</div>}
          </div>
        </div>
        <div>
          <div className="font-medium mb-2">Méthodes & Mouches (top)</div>
          <div className="text-sm">
            <b>Méthodes:</b> {mf.methods.map(m=>`${m.method||'—'}(${m.count})`).join(', ')||'—'}<br/>
            <b>Mouches:</b> {mf.flies.map(f=>`${f.fly_name_norm||'—'}(${f.count})`).join(', ')||'—'}
          </div>
        </div>
      </div>
    </div>
  );
}



