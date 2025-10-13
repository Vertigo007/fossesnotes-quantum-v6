'use client';
import React, { useState } from 'react';

type Lang = 'fr' | 'en';
export default function PostComposer({
  lang = (typeof window !== 'undefined' ? (localStorage.getItem('lang') as Lang) : 'fr') || 'fr',
  onCreated,
}: {
  lang?: Lang;
  onCreated?: () => void;
}) {
  const [titleFr, setTitleFr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyFr, setBodyFr] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [visibility, setVisibility] = useState<'public'|'pro'|'elite'>('public');
  const [loading, setLoading] = useState(false);
  const t = {
    fr: {
      newPost: 'Nouveau post',
      titleFr: 'Titre (FR)',
      titleEn: 'Titre (EN)',
      bodyFr: 'Texte (FR)',
      bodyEn: 'Texte (EN)',
      visibility: 'Visibilité',
      publish: 'Publier'
    },
    en: {
      newPost: 'New post',
      titleFr: 'Title (FR)',
      titleEn: 'Title (EN)',
      bodyFr: 'Body (FR)',
      bodyEn: 'Body (EN)',
      visibility: 'Visibility',
      publish: 'Publish'
    }
  }[lang];

  async function submit() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const resp = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title_fr: titleFr || null,
          title_en: titleEn || null,
          body_fr: bodyFr || null,
          body_en: bodyEn || null,
          visibility
        })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(()=> ({}));
        alert(err?.error || 'Error');
      } else {
        setTitleFr(''); setTitleEn(''); setBodyFr(''); setBodyEn('');
        onCreated?.();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm mb-4" data-testid="post-composer">
      <div className="text-lg font-semibold mb-3">{t.newPost}</div>
      <div className="grid md:grid-cols-2 gap-3">
        <input className="border rounded p-2" data-testid="title-fr" placeholder={t.titleFr} value={titleFr} onChange={e=>setTitleFr(e.target.value)} />
        <input className="border rounded p-2" data-testid="title-en" placeholder={t.titleEn} value={titleEn} onChange={e=>setTitleEn(e.target.value)} />
        <textarea className="border rounded p-2 min-h-[100px]" data-testid="body-fr" placeholder={t.bodyFr} value={bodyFr} onChange={e=>setBodyFr(e.target.value)} />
        <textarea className="border rounded p-2 min-h-[100px]" data-testid="body-en" placeholder={t.bodyEn} value={bodyEn} onChange={e=>setBodyEn(e.target.value)} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <label className="text-sm">{t.visibility}</label>
        <select className="border rounded p-2" data-testid="visibility-select"
          value={visibility} onChange={e=>setVisibility(e.target.value as any)}>
          <option value="public">Public</option>
          <option value="pro">Pro</option>
          <option value="elite">Elite</option>
        </select>
        <button onClick={submit} disabled={loading} data-testid="publish-button"
          className="ml-auto px-4 py-2 rounded bg-black text-white hover:opacity-90 disabled:opacity-50">
          {loading ? '…' : t.publish}
        </button>
      </div>
    </div>
  );
}
