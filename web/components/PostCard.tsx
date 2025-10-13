'use client';
import React, { useState } from 'react';

type Lang = 'fr'|'en';
export default function PostCard({ item, lang, onReacted }:{
  item: any; lang: Lang; onReacted?: ()=>void;
}) {
  const t = {
    fr: { comment:'Commenter', like:"J'aime", helpful:'Utile', insightful:'Pertinent' },
    en: { comment:'Comment', like:'Like', helpful:'Helpful', insightful:'Insightful' }
  }[lang];

  const [likeBusy, setLikeBusy] = useState(false);

  async function react(type:'like'|'helpful'|'insightful') {
    setLikeBusy(true);
    try {
      const token = localStorage.getItem('token') || '';
      const r = await fetch(`/api/community/posts/${item.id}/react`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) },
        body: JSON.stringify({ type })
      });
      if (!r.ok) {
        const e = await r.json().catch(()=> ({}));
        alert(e?.error || 'Error');
      } else {
        onReacted?.();
      }
    } finally { setLikeBusy(false); }
  }

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm" data-testid="post-card">
      <div className="text-sm text-gray-500">{item.author_email} • {new Date(item.created_at).toLocaleString()}</div>
      <div className="text-lg font-semibold mt-1">
        {(lang==='fr' ? item.title_fr : item.title_en) || (item.title_fr || item.title_en || '(sans titre)')}
      </div>
      <div className="text-sm mt-2 whitespace-pre-wrap">
        {(lang==='fr' ? item.body_fr : item.body_en) || (item.body_fr || item.body_en || '')}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="px-3 py-1 border rounded" data-testid="like-button" disabled={likeBusy} onClick={()=>react('like')}>{t.like}</button>
        <button className="px-3 py-1 border rounded" data-testid="helpful-button" disabled={likeBusy} onClick={()=>react('helpful')}>{t.helpful}</button>
        <button className="px-3 py-1 border rounded" data-testid="insightful-button" disabled={likeBusy} onClick={()=>react('insightful')}>{t.insightful}</button>
      </div>
    </div>
  );
}
