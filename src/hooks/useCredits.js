import { useState, useEffect, useCallback } from 'react';
import { auth as authAPI } from '../api';

const ADMIN_EMAIL = 'noodzakelijkonline@gmail.com';

export const useCredits = () => {
  const [credits, setCredits] = useState(Infinity);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }
      const user = JSON.parse(localStorage.getItem('sharetUser') || '{}');
      if (user?.email === ADMIN_EMAIL || user?.role === 'admin') {
        setCredits(Infinity);
        setLoading(false);
        return;
      }
      const res = await authAPI.getCredits();
      if (res.success) {
        setCredits(res.credits === null ? Infinity : res.credits);
      }
    } catch {
      // fall back to Infinity if not logged in / endpoint unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  return {
    credits,
    freeSharesLeft: credits === Infinity ? Infinity : credits,
    loading,
    refetch: fetchCredits
  };
};
