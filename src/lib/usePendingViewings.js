"use client";
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function usePendingViewings(userId, pathname) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    if (!supabase || !userId) return;
    let active = true;
    let running = false;
    let rerun = false;
    async function refresh() {
      if (document.visibilityState === 'hidden') return;
      if (running) { rerun = true; return; }
      running = true;
      try {
        const { count: total, error } = await supabase.from('viewing_requests')
          .select('id,listings!inner(landlord_id)', { count: 'exact', head: true })
          .eq('status', 'pending').eq('listings.landlord_id', userId);
        if (active && !error) setCount(total ?? 0);
      } finally {
        running = false;
        if (active && rerun) { rerun = false; refresh(); }
      }
    }
    refresh();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('viewing-requests-changed', refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('viewing-requests-changed', refresh);
    };
  }, [userId, pathname]);
  return userId ? count : 0;
}
