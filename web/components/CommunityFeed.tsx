'use client';
import React, { useEffect, useState } from 'react';
import PostComposer from './PostComposer';
import PostCard from './PostCard';

type Lang = 'fr'|'en';

export default function CommunityFeed() {
  const [lang, setLang] = useState<Lang>((localStorage.getItem('lang') as any) || 'fr');
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  async function load(p=1) {
    setLoading(true);
    try {
      const resp = await fetch(`/api/community/feed?search=${encodeURIComponent(q)}&page=${p}`);
      const data = await resp.json();
      setItems(data.items || []);
      setPage(data.page || 1);
    } finally { setLoading(false); }
  }
  useEffect(()=>{ load(1); /* on mount */ }, []);
  function reload(){ load(page); }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">{lang==='fr'?'Communauté Courant+':'Courant+ Community'}</h1>
        <div className="ml-auto flex gap-2">
          <button data-testid="lang-fr" onClick={()=>{localStorage.setItem('lang','fr'); setLang('fr');}} className={`px-2 py-1 border rounded ${lang==='fr'?'bg-black text-white':''}`}>FR</button>
          <button data-testid="lang-en" onClick={()=>{localStorage.setItem('lang','en'); setLang('en');}} className={`px-2 py-1 border rounded ${lang==='en'?'bg-black text-white':''}`}>EN</button>
        </div>
      </div>

      {/* Composer */}
      <PostComposer lang={lang} onCreated={reload} />

      {/* Search */}
      <div className="flex gap-2 mb-3">
        <input className="border rounded p-2 w-full" data-testid="search-input" placeholder={lang==='fr'?'Rechercher…':'Search…'} value={q} onChange={e=>setQ(e.target.value)} />
        <button className="px-3 py-2 border rounded" data-testid="search-button" onClick={()=>load(1)}>{lang==='fr'?'Chercher':'Search'}</button>
      </div>

      {/* Feed */}
      {loading ? <div>…</div> : (
        <div className="space-y-4">
          {items.map(x=> <PostCard key={x.id} item={x} lang={lang} onReacted={reload} />)}
          {!items.length && <div className="text-sm text-gray-500">{lang==='fr'?'Aucun résultat.':'No results.'}</div>}
        </div>
      )}
    </div>
  );
}
