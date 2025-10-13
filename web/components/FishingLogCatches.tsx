'use client';
import React, { useState } from 'react';

type Lang = 'fr' | 'en';

export default function FishingLogCatches({ log }: { log: any }) {
  const [lang, setLang] = useState<Lang>((localStorage.getItem('lang') as any) || 'fr');
  const [form, setForm] = useState<any>({ 
    caught_at: '', 
    species: 'Atlantic Salmon', 
    length_cm: '', 
    weight_kg: '', 
    method: 'dry', 
    fly_name: '',
    released: true
  });
  const [items, setItems] = useState<any[]>([]);

  const t = {
    fr: {
      title: 'Prises',
      caughtAt: 'Heure de capture',
      species: 'Espèce',
      flyName: 'Nom de la mouche',
      length: 'Longueur (cm)',
      weight: 'Poids (kg)',
      method: 'Méthode',
      released: 'Relâché',
      add: 'Ajouter',
      weather: 'Météo',
      flow: 'Débit',
      cms: 'm³/s'
    },
    en: {
      title: 'Catches',
      caughtAt: 'Caught at',
      species: 'Species',
      flyName: 'Fly name',
      length: 'Length (cm)',
      weight: 'Weight (kg)',
      method: 'Method',
      released: 'Released',
      add: 'Add',
      weather: 'Weather',
      flow: 'Flow',
      cms: 'cms'
    }
  }[lang];

  async function addCatch() {
    const token = localStorage.getItem('token') || '';
    const resp = await fetch(`/api/logs/${log.id}/catches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(form)
    });
    const data = await resp.json();
    if (!resp.ok) alert(data?.error || 'Error');
    else { 
      setItems([data, ...items]); 
      // Reset form
      setForm({ 
        caught_at: '', 
        species: 'Atlantic Salmon', 
        length_cm: '', 
        weight_kg: '', 
        method: 'dry', 
        fly_name: '',
        released: true
      });
    }
  }

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm mt-4">
      <div className="flex items-center mb-3">
        <div className="text-lg font-semibold">{t.title}</div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => { localStorage.setItem('lang', 'fr'); setLang('fr'); }} className={`px-2 py-1 border rounded ${lang === 'fr' ? 'bg-black text-white' : ''}`}>FR</button>
          <button onClick={() => { localStorage.setItem('lang', 'en'); setLang('en'); }} className={`px-2 py-1 border rounded ${lang === 'en' ? 'bg-black text-white' : ''}`}>EN</button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-2">
        <input 
          type="datetime-local" 
          className="border rounded p-2" 
          placeholder={t.caughtAt}
          value={form.caught_at} 
          onChange={e => setForm({ ...form, caught_at: e.target.value })} 
        />
        <input 
          className="border rounded p-2" 
          placeholder={t.species}
          value={form.species} 
          onChange={e => setForm({ ...form, species: e.target.value })} 
        />
        <input 
          className="border rounded p-2" 
          placeholder={t.flyName}
          value={form.fly_name} 
          onChange={e => setForm({ ...form, fly_name: e.target.value })} 
        />
        <input 
          className="border rounded p-2" 
          placeholder={t.length}
          value={form.length_cm} 
          onChange={e => setForm({ ...form, length_cm: e.target.value })} 
        />
        <input 
          className="border rounded p-2" 
          placeholder={t.weight}
          value={form.weight_kg} 
          onChange={e => setForm({ ...form, weight_kg: e.target.value })} 
        />
        <select 
          className="border rounded p-2" 
          value={form.method} 
          onChange={e => setForm({ ...form, method: e.target.value })}
        >
          <option value="dry">Dry</option>
          <option value="wet">Wet</option>
          <option value="nymph">Nymph</option>
          <option value="spey">Spey</option>
        </select>
      </div>
      
      <div className="mt-2 flex items-center gap-2">
        <label className="flex items-center gap-1">
          <input 
            type="checkbox" 
            checked={form.released} 
            onChange={e => setForm({ ...form, released: e.target.checked })}
          />
          <span className="text-sm">{t.released}</span>
        </label>
        <button className="px-3 py-2 border rounded bg-black text-white hover:opacity-90" onClick={addCatch}>
          {t.add}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((c: any) => (
          <div key={c.id} className="border rounded p-3 bg-gray-50">
            <div className="text-sm text-gray-500">
              {new Date(c.caught_at).toLocaleString()} • {c.species}
              {c.length_cm && ` • ${c.length_cm}cm`}
              {c.weight_kg && ` • ${c.weight_kg}kg`}
              {c.released ? ' • Relâché' : ' • Gardé'}
            </div>
            <div className="text-sm mt-1">
              <span className="font-medium">{t.method}:</span> {c.method} • 
              <span className="font-medium ml-2">Fly:</span> {c.fly_name || c.fly_id || '—'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t.weather}: {c.enrich_weather?.summary_fr ?? c.enrich_weather?.summary_en ?? '—'} | 
              {t.flow}: {c.enrich_hydro?.discharge_cms ?? '—'} {t.cms}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4">
            {lang === 'fr' ? 'Aucune prise enregistrée' : 'No catches recorded'}
          </div>
        )}
      </div>
    </div>
  );
}



