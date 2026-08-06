import { openDB } from "idb";
import type { TradeVaultData } from "@/domain/types";
import { decryptJson, encryptJson, type EncryptedEnvelope } from "./crypto";

const DATABASE_NAME = "tradevault";
const STORE_NAME = "vault";
const RECORD_KEY = "primary";

export type StoredVault =
  | { mode: "plain"; data: TradeVaultData }
  | { mode: "encrypted"; envelope: EncryptedEnvelope };

async function database() {
  return openDB(DATABASE_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME))
        db.createObjectStore(STORE_NAME);
    },
  });
}

export async function loadVault(): Promise<StoredVault | undefined> {
  return (await database()).get(STORE_NAME, RECORD_KEY);
}

export async function savePlainVault(data: TradeVaultData): Promise<void> {
  await (await database()).put(STORE_NAME, { mode: "plain", data }, RECORD_KEY);
}

export async function saveEncryptedVault(
  data: TradeVaultData,
  passphrase: string,
): Promise<void> {
  const envelope = await encryptJson(data, passphrase);
  await (
    await database()
  ).put(STORE_NAME, { mode: "encrypted", envelope }, RECORD_KEY);
}

export async function unlockVault(
  envelope: EncryptedEnvelope,
  passphrase: string,
): Promise<TradeVaultData> {
  return decryptJson<TradeVaultData>(envelope, passphrase);
}

export async function clearVault(): Promise<void> {
  await (await database()).delete(STORE_NAME, RECORD_KEY);
}
