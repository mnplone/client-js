
import fetch from 'node-fetch';
import ExtWS from 'extws-client';

const apiUrl = 'https://monopoly-one.com/api/';

const polling_false = () => {
    throw new Error('Cannot subscribe to events without polling.');
};

class M1APIError extends Error {
    constructor (response) {
        super(`${response.description} (code: ${response.code})`);
        this.code = response.code;
        this.description = response.description;
        if (Object.prototype.hasOwnProperty.call(response, 'data')) {
            this.data = response.data;
        }
    }
}

class M1 {

    #access_token;
    #refresh_token;

    constructor ({ access_token, refresh_token, polling = false, subs }) {
        this.#access_token = access_token;
        this.#refresh_token = refresh_token;
        
        if (true === polling) {
            const ws_url = new URL('wss://monopoly-one.com/ws');

            const params = new URLSearchParams();

            if (this.#access_token) {
                params.set('access_token', this.#access_token);
            }            
            if (typeof subs === 'string') {
                params.set('subs', subs);
            }
            ws_url.search = params.toString();

            const ws = new ExtWS(ws_url.toString());

            this.on = ws.on;
            this.once = ws.once;
            this.off = ws.off;
        }
        else {
            this.on = polling_false;
            this.off = polling_false;
            this.once = polling_false;
        }
    }

    async callMethod (method, params = {}) {
        const url = new URL(apiUrl + method);

        const url_params = new URLSearchParams();
        if (this.#access_token) {
            url_params.set('access_token', this.#access_token);
        }
        if (Object.keys(params).length > 0) {
            for (const [ key, value ] of Object.entries(params)) {
                url_params.set(key, value);
            }
        }

        url.search = url_params.toString();

        const response = await fetch(url.toString());
        const response_json = await response.json();

        // Authorization Error
        if (response_json.code === 1) {
            if (typeof this.#refresh_token !== 'string') {
                throw new Error('Invalid access token. Cannot refresh without valid refresh token.');
            }

            const refresh_url = new URL(apiUrl + 'auth.refresh');

            const refresh_params = new URLSearchParams();
            refresh_params.set('refresh_token', this.#refresh_token);

            refresh_url.search = refresh_params.toString();

            // refreshing access token
            const refresh_response = await fetch(refresh_url);

            // error while refreshing
            if (refresh_response.status !== 200) {
                const error = new Error('Invalid refresh token.');
                error.http_code = refresh_response.status;
                throw error;
            }

            // refreshing success
            const { access_token: new_access_token, 
                    refresh_token: new_refresh_token } = await refresh_response.json();
            
            this.#access_token = new_access_token;
            this.#refresh_token = new_refresh_token;

            return await this.callMethod(method, params);
        }
        else if (response_json.code !== 0) {
            throw new M1APIError(response_json);
        }

        return response_json;
    }
}

export default M1;