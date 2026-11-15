import { useState, useEffect, useCallback } from 'react';
import { checkHealth } from '../services/api.js';

/**
 * Custom React hook for monitoring backend and database health.
 */
export const useHealthCheck = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await checkHealth();
      setData(response.data || response);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { data, loading, error, refetch: fetchHealth };
};

export default useHealthCheck;
