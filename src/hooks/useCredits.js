import { useState, useEffect } from 'react';

export const useCredits = () => {
  const [credits, setCredits] = useState(0);
  const [freeSharesLeft, setFreeSharesLeft] = useState(3);

  useEffect(() => {
    // Load credits and free shares from localStorage or API
    const storedCredits = localStorage.getItem('credits');
    const storedFreeShares = localStorage.getItem('freeShares');
    const currentMonth = new Date().getMonth();
    const lastResetMonth = localStorage.getItem('lastResetMonth');

    if (storedCredits) setCredits(parseFloat(storedCredits));
    
    if (lastResetMonth && parseInt(lastResetMonth) !== currentMonth) {
      // Reset free shares at the start of a new month
      setFreeSharesLeft(3);
      localStorage.setItem('freeShares', '3');
      localStorage.setItem('lastResetMonth', currentMonth.toString());
    } else if (storedFreeShares) {
      setFreeSharesLeft(parseInt(storedFreeShares));
    }
  }, []);

  const updateCredits = (newCredits, newFreeShares) => {
    setCredits(newCredits);
    setFreeSharesLeft(newFreeShares);
    localStorage.setItem('credits', newCredits.toString());
    localStorage.setItem('freeShares', newFreeShares.toString());
  };

  return { credits, freeSharesLeft, updateCredits };
};
