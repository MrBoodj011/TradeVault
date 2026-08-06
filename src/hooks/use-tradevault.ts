"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createDemoData, createEmptyData } from "@/domain/demo-data";
import { tradeVaultDataSchema } from "@/domain/schema";
import {
  createId,
  type PlaybookSetup,
  type Trade,
  type TradeVaultData,
} from "@/domain/types";
import {
  clearVault,
  loadVault,
  saveEncryptedVault,
  savePlainVault,
  unlockVault,
  type StoredVault,
} from "@/lib/storage";

type ReadyState = "loading" | "locked" | "ready" | "error";

export function useTradeVault() {
  const [status, setStatus] = useState<ReadyState>("loading");
  const [data, setData] = useState<TradeVaultData | null>(null);
  const [lockedVault, setLockedVault] = useState<Extract<
    StoredVault,
    { mode: "encrypted" }
  > | null>(null);
  const [error, setError] = useState("");
  const passphraseRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    void loadVault()
      .then(async (record) => {
        if (!record) {
          const empty = createEmptyData();
          await savePlainVault(empty);
          setData(empty);
          setStatus("ready");
        } else if (record.mode === "encrypted") {
          setLockedVault(record);
          setStatus("locked");
        } else {
          setData(tradeVaultDataSchema.parse(record.data));
          setStatus("ready");
        }
        hydratedRef.current = true;
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load the local vault.",
        );
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    if (!hydratedRef.current || status !== "ready" || !data) return;
    const timeout = window.setTimeout(() => {
      const write = data.settings.encryptionEnabled
        ? passphraseRef.current
          ? saveEncryptedVault(data, passphraseRef.current)
          : Promise.resolve()
        : savePlainVault(data);
      void write.catch(() =>
        setError("The latest change could not be saved locally."),
      );
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [data, status]);

  const mutate = useCallback(
    (recipe: (current: TradeVaultData) => TradeVaultData) => {
      setData((current) =>
        current
          ? { ...recipe(current), updatedAt: new Date().toISOString() }
          : current,
      );
    },
    [],
  );

  const addTrade = useCallback(
    (input: Omit<Trade, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const trade = {
        ...input,
        id: createId("trade"),
        createdAt: now,
        updatedAt: now,
      };
      mutate((current) => ({ ...current, trades: [trade, ...current.trades] }));
      return trade;
    },
    [mutate],
  );

  const updateTrade = useCallback(
    (trade: Trade) =>
      mutate((current) => ({
        ...current,
        trades: current.trades.map((item) =>
          item.id === trade.id
            ? { ...trade, updatedAt: new Date().toISOString() }
            : item,
        ),
      })),
    [mutate],
  );

  const deleteTrade = useCallback(
    (id: string) =>
      mutate((current) => ({
        ...current,
        trades: current.trades.filter((trade) => trade.id !== id),
      })),
    [mutate],
  );

  const importTrades = useCallback(
    (trades: Trade[]) =>
      mutate((current) => ({
        ...current,
        trades: [...trades, ...current.trades],
      })),
    [mutate],
  );

  const addPlaybookSetup = useCallback(
    (input: Omit<PlaybookSetup, "id">) =>
      mutate((current) => ({
        ...current,
        playbook: [...current.playbook, { ...input, id: createId("setup") }],
      })),
    [mutate],
  );

  const updateSettings = useCallback(
    (settings: TradeVaultData["settings"]) =>
      mutate((current) => ({ ...current, settings })),
    [mutate],
  );

  const importData = useCallback(async (next: TradeVaultData) => {
    const parsed = tradeVaultDataSchema.parse(next);
    const normalized = {
      ...parsed,
      settings: { ...parsed.settings, encryptionEnabled: false },
      updatedAt: new Date().toISOString(),
    };
    passphraseRef.current = null;
    await savePlainVault(normalized);
    setData(normalized);
    setStatus("ready");
  }, []);

  const loadDemo = useCallback(async () => {
    const demo = createDemoData();
    passphraseRef.current = null;
    await savePlainVault(demo);
    setData(demo);
    setStatus("ready");
  }, []);

  const reset = useCallback(async () => {
    const empty = createEmptyData();
    passphraseRef.current = null;
    await clearVault();
    await savePlainVault(empty);
    setData(empty);
    setStatus("ready");
  }, []);

  const unlock = useCallback(
    async (passphrase: string) => {
      if (!lockedVault) return;
      try {
        const unlocked = tradeVaultDataSchema.parse(
          await unlockVault(lockedVault.envelope, passphrase),
        );
        passphraseRef.current = passphrase;
        setData(unlocked);
        setLockedVault(null);
        setError("");
        setStatus("ready");
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to unlock the vault.",
        );
      }
    },
    [lockedVault],
  );

  const enableEncryption = useCallback(
    async (passphrase: string) => {
      if (!data) return;
      const encrypted = {
        ...data,
        settings: { ...data.settings, encryptionEnabled: true },
        updatedAt: new Date().toISOString(),
      };
      await saveEncryptedVault(encrypted, passphrase);
      passphraseRef.current = passphrase;
      setData(encrypted);
    },
    [data],
  );

  const disableEncryption = useCallback(async () => {
    if (!data) return;
    const plain = {
      ...data,
      settings: { ...data.settings, encryptionEnabled: false },
      updatedAt: new Date().toISOString(),
    };
    await savePlainVault(plain);
    passphraseRef.current = null;
    setData(plain);
  }, [data]);

  const lock = useCallback(async () => {
    if (!data?.settings.encryptionEnabled || !passphraseRef.current) return;
    await saveEncryptedVault(data, passphraseRef.current);
    const record = await loadVault();
    if (record?.mode === "encrypted") {
      passphraseRef.current = null;
      setData(null);
      setLockedVault(record);
      setStatus("locked");
    }
  }, [data]);

  return {
    status,
    data,
    error,
    setError,
    addTrade,
    updateTrade,
    deleteTrade,
    importTrades,
    addPlaybookSetup,
    updateSettings,
    importData,
    loadDemo,
    reset,
    unlock,
    enableEncryption,
    disableEncryption,
    lock,
  };
}

export type TradeVaultController = ReturnType<typeof useTradeVault>;
