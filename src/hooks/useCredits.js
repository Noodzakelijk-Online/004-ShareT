import { useState, useEffect, useCallback } from 'react';
import { auth as authAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

export const useCredits = () => {
  const { currentUser } = useAuth();
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      if (currentUser?.role === 'admin') {
        setCredits(Infinity);
        return;
      }
      const res = await authAPI.getCredits();
      if (res.success) {
        setCredits(res.credits === null ? Infinity : res.credits);
      }
    } catch (requestError) {
      setCredits(null);
      setError(requestError.message || 'Credits are unavailable');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  return {
    credits,
    freeSharesLeft: credits === Infinity ? Infinity : credits,
    loading,
    error,
    refetch: fetchCredits
  };
};
