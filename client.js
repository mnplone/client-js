
import fetch from 'node-fetch';
import ExtWS from 'extws-client';

class M1 {

    constructor (access_token, { polling = false, rooms = false }) {

        if (typeof access_token !== 'string') {
            throw new TypeError('Invalid access token.');
        }

        this._access_token = access_token;
        
        if (true === polling) {
            const ws_url = 'wss://monopoly-one.com/ws?access_token=' + this._access_token + ( rooms ? '&subs=rooms' : '' );

            const ws = new ExtWS(ws_url);

            this.on = ws.on;
            this.once = ws.once;
            this.off = ws.off;
        }
    }

    async callMethod (method, params = {}) {

        const response = await fetch('https://monopoly-one.com/api/' + method + '?access_token=' + this._access_token, {
            method: 'POST',
            body: JSON.stringify(params),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const response_json = await response.json();

        if (response_json.code !== 0) {
            throw new Error(response_json);
        }

        return response_json;

        // return new Promise((resolve, reject) => {
        //     restler.post(
        //         'https://monopoly-one.com/api/' + method + '?access_token=' + tokens.monopoly_token,
        //         {
        //             data: params,
        //             parser: restler.parsers.json,
                    
        //         }
        //     )
        //     .on('success', (response) => {
        //         resolve(response);
        //     })
        //     .on('error', (error) => {
        //         reject(error);
        //     })
        //     .on('fail', (_, res) => {
        //         reject(new Error('HTTP ' + res.statusCode));
        //     });
        // });
    }
}

export default M1;