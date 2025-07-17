import * as crypto from './crypto';
export class GameDataService {

    private secretKey = "mcYX34=YX$62GNa}BkK=bKj6H&Jb%6wG";
    private cryptoKey: CryptoKey | null = null;
    private static API_URL = 'https://us-central1-baguettegameengine.cloudfunctions.net';
    private token: string;
    private apiUrl: string;

    constructor(token: string) {
        this.token = token;
        this.apiUrl = GameDataService.API_URL;
    }

    async initCryptoKey() {
        if (!this.cryptoKey) {
            this.cryptoKey = await crypto.importKey(this.secretKey);
        }
    }

    async encrypt(value: any): Promise<string> {
        await this.initCryptoKey();
        const plaintext = JSON.stringify(value);
        return crypto.encryptData(plaintext, this.cryptoKey!);
    }

    async decrypt(value: string): Promise<any> {
        await this.initCryptoKey();
        const decryptedText = await crypto.decryptData(value, this.cryptoKey!);
        return JSON.parse(decryptedText);
    }

    private async request(endpoint: string, method: string = "POST", body?: any): Promise<{ status: "success" | "fail", response: any }> {
        try {
            console.log(`Requesting [${method}] ${this.apiUrl}${endpoint} ${JSON.stringify(body)}`);
            const res = await fetch(`${this.apiUrl}${endpoint}`, {
                method,
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    "Content-Type": "text/plain"
                },
                body: body ? JSON.stringify(body) : undefined
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                return { status: "fail", response: json.message || json.error || res.statusText };
            }

            return { status: "success", response: json };
        } catch (err) {
            return { status: "fail", response: (err as Error).message };
        }
    }

    async verify(): Promise<{ status: "success" | "fail", response: any }> {
        return this.request("/verifyToken", "GET");
    }

    async get(key: string): Promise<{ status: "success" | "fail", response: any }> {
        const encryptedData = await this.encrypt({ key });
        return this.request("/get", "POST", encryptedData);
    }

    async set(key: string, value: any): Promise<{ status: "success" | "fail", response: any }> {
        const encryptedData = await this.encrypt({ key, value });
        return this.request("/set", "POST", encryptedData);
    }

    async update(key: string, value: any): Promise<{ status: "success" | "fail", response: any }> {
        const encryptedData = await this.encrypt({ key, value });
        return this.request("/update", "POST", encryptedData);
    }

    async delete(key: string): Promise<{ status: "success" | "fail", response: any }> {
        const encryptedData = await this.encrypt({ key });
        return this.request("/remove", "POST", encryptedData);
    }
}
