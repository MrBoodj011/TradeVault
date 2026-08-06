import { describe, expect, it } from "vitest";
import { decryptJson, encryptJson } from "./crypto";

describe("encrypted vault envelopes", () => {
  it("round-trips authenticated data", async () => {
    const value = { strategy: "reclaim", trades: 42 };
    const envelope = await encryptJson(value, "correct horse battery staple");
    expect(envelope.ciphertext).not.toContain("reclaim");
    await expect(
      decryptJson(envelope, "correct horse battery staple"),
    ).resolves.toEqual(value);
  });

  it("rejects short passphrases and incorrect keys", async () => {
    await expect(encryptJson({}, "short")).rejects.toThrow(/10 characters/);
    const envelope = await encryptJson({ private: true }, "a-long-passphrase");
    await expect(decryptJson(envelope, "wrong-passphrase")).rejects.toThrow(
      /Unable to decrypt/,
    );
  });
});
