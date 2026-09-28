"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal async data hook for the Superuser dashboard pages.
 *
 * Encapsulates the load / reload / error / cancelled-request dance that every
 * data-driven page needs, so a page body is just "call the hook, render the
 * state". Requests are keyed by `deps`; changing them discards the in-flight
 * response so a slow earlier request can never overwrite fresher data.
 */
export interface AsyncData<T> {
  data: T | null;
  isLoading: boolean;
  /** True only for the first load, so refreshes don't blank the page. */
  isInitialLoading: boolean;
  error: string | null;
  reload: () => void;
  setData: (updater: T | ((current: T | null) => T | null)) => void;
}

export interface UseAsyncDataOptions {
  /** Skip fetching entirely (e.g. while a prerequisite is unmet). */
  enabled?: boolean;
  /** Convert a thrown value into the message shown to the user. */
  toMessage?: (error: unknown) => string;
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: unknown[],
  options: UseAsyncDataOptions = {}
): AsyncData<T> {
  const { enabled = true, toMessage } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  // Guards against a stale response landing after deps changed or unmount.
  const requestId = useRef(0);
  const mounted = useRef(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = await loaderRef.current();
      if (!mounted.current || currentRequest !== requestId.current) return;
      setData(result);
    } catch (caught) {
      if (!mounted.current || currentRequest !== requestId.current) return;
      const message = toMessage
        ? toMessage(caught)
        : caught instanceof Error && caught.message
          ? caught.message
          : "The request failed.";
      setError(message);
    } finally {
      if (mounted.current && currentRequest === requestId.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, toMessage]);

  useEffect(() => {
    void run();
    // `run` is stable for a given enabled/toMessage pair; `deps` drives reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  const reload = useCallback(() => {
    void run();
  }, [run]);

  const updateData = useCallback((updater: T | ((current: T | null) => T | null)) => {
    setData((current) =>
      typeof updater === "function" ? (updater as (c: T | null) => T | null)(current) : updater
    );
  }, []);

  return {
    data,
    isLoading,
    isInitialLoading: isLoading && data === null,
    error,
    reload,
    setData: updateData,
  };
}
