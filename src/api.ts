import fetch from 'node-fetch';

const RESTINCLOUD_API = "https://restincloud.stevecohen.fr/api";

class HTTPResponseError extends Error {
    constructor(response) {
        super(`HTTP Error Response: ${response.status} ${response.statusText}`);
    }
}

interface Variable {
    "id": number,
    "key": string,
    "value": string,
    "owner_id": number,
    "created_at": string,
    "updated_at": string
}

export class RestInCloudAPI {
    private token;

    constructor(token) {
        this.token = token;
    }

    async getVar(key): Promise<{
        code: string,
        result: Variable
    }> {
        let params = new URLSearchParams();
        params.append('token', this.token);
        params.append('key', key);

        const response = await fetch(RESTINCLOUD_API + "/var?" + params.toString());
        return response.json().then((value) => {
            return value;
        }).catch(() => {
            throw new HTTPResponseError(response);
        });
    }

    async putVar(key, value): Promise<{
        code: string,
        result: Variable
    }> {
        let params = new URLSearchParams();
        params.append('token', this.token);
        params.append('key', key);
        params.append('value', value);

        const response = await fetch(RESTINCLOUD_API + "/var?" + params.toString(), {method: 'PUT'});
        return response.json().then((value) => {
            return value;
        }).catch(() => {
            throw new HTTPResponseError(response);
        });
    }

    async deleteVar(key): Promise<{
        code: string,
        result: Variable
    }> {
        let params = new URLSearchParams();
        params.append('token', this.token);
        params.append('key', key);

        const response = await fetch(RESTINCLOUD_API + "/var?" + params.toString(), {method: 'DELETE'});
        return response.json().then((value) => {
            return value;
        }).catch(() => {
            throw new HTTPResponseError(response);
        });
    }

    async getAllVars(): Promise<{
        code: string,
        result: Variable[]
    }> {
        let params = new URLSearchParams();
        params.append('token', this.token);

        const response = await fetch(RESTINCLOUD_API + "/var/all?" + params.toString());
        return response.json().then((value) => {
            return value;
        }).catch(() => {
            throw new HTTPResponseError(response);
        });
    }
}
