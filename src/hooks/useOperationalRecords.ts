'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createOperational,
  deleteOperational,
  listOperational,
  updateOperational,
  type OperationalItem,
} from '@/api/operations';

export function useOperationalRecords(module: string, subtype?: string) {
  const [items, setItems] = useState<OperationalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listOperational(module, subtype);
      setItems(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [module, subtype]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createRow = useCallback(
    async (
      subtypeKey: string,
      data: Record<string, unknown>,
      opts?: { is_catalog?: boolean; owner_id?: string | null; branch?: string | null }
    ) => {
      setError(null);
      try {
        await createOperational(module, {
          subtype: subtypeKey,
          data,
          ...opts,
        });
        await reload();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to add record');
        return false;
      }
    },
    [module, reload]
  );

  const patchRow = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      setError(null);
      try {
        await updateOperational(module, id, data);
        await reload();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update record');
        return false;
      }
    },
    [module, reload]
  );

  const removeRow = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deleteOperational(module, id);
        await reload();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete record');
        return false;
      }
    },
    [module, reload]
  );

  return { items, loading, error, reload, createRow, patchRow, removeRow };
}
