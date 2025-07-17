export class GameDataService {

    private static API_URL = 'https://us-central1-baguettegameengine.cloudfunctions.net';
    private token: string;
    private apiUrl: string;

    constructor(token: string) {
        this.token = token;
        this.apiUrl = GameDataService.API_URL;
    }

    private async request(endpoint: string, method: string = "POST", body?: any): Promise<{ status: "success" | "fail", response: any }> {
        try {
            console.log(`Requesting [${method}] ${this.apiUrl}${endpoint} ${JSON.stringify(body)}`);
            const res = await fetch(`${this.apiUrl}${endpoint}`, {
                method,
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    "Content-Type": "application/json"
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
        return this.request("/get", "POST", { key });
    }

    async set(key: string, value: any): Promise<{ status: "success" | "fail", response: any }> {
        return this.request("/set", "POST", { key, value });
    }

    async update(key: string, value: any): Promise<{ status: "success" | "fail", response: any }> {
        return this.request("/update", "POST", { key, value });
    }

    async delete(key: string): Promise<{ status: "success" | "fail", response: any }> {
        return this.request("/remove", "POST", { key });
    }
}
