const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export async function importKey(rawKey: string): Promise<CryptoKey> {
    const keyBytes = textEncoder.encode(rawKey);
    return crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-CBC" },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function encryptData(plaintext: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(16)); // CBC = 16 bytes IV
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-CBC", iv },
        key,
        encoded
    );
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
}

export async function decryptData(ciphertextBase64: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));
    const iv = combined.slice(0, 16);
    const data = combined.slice(16);
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-CBC", iv },
        key,
        data
    );
    return textDecoder.decode(decrypted);
}
