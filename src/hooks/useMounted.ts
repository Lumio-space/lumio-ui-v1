import { useEffect, useState } from 'react';

/**
 * useMounted hook
 *
 * Returns true once the component has mounted on the client.
 * Use this to ensure server-rendered markup and initial client hydration match,
 * preventing React hydration mismatches on client-persisted state.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
