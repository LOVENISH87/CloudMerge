import assert from "assert";
process.env.TOKEN_ENCRYPTION_KEY = "test_key";
import { encrypt, decrypt } from "./crypto";

const plaintext = "ya29.a0AfH6SMB_secret_token";
const enc = encrypt(plaintext);
assert.notStrictEqual(enc, plaintext);
assert.strictEqual(decrypt(enc), plaintext);
assert.throws(() => decrypt("garbage"));
console.log("crypto.test.ts OK");
