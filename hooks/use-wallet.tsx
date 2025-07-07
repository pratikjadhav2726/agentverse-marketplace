import { useState, useEffect, useCallback } from "react";

export function useWallet(userId?: string) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wallet?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch wallet balance");
      const { balance } = await res.json();
      setBalance(balance);
    } catch (err) {
      setError((err as Error).message);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchBalance();
    }
  }, [userId, fetchBalance]);

  return { balance, loading, error, refetch: fetchBalance };
} 