import utils from 'openhim-mediator-utils';

import clientRegistryConfig from '../config/clientRegistryMediator.json'
import shrConfig from '../config/shrMediator.json';

import { Agent } from 'https';
import * as crypto from 'crypto';

// ✅ Do this if using TYPESCRIPT
import { RequestInfo, RequestInit } from 'node-fetch';
import { FhirApi } from './utils';

// mediators to be registered
const mediators = [
    
    // utilsConfig,
    clientRegistryConfig,
    shrConfig
];

const fetch = (url: RequestInfo, init?: RequestInit) =>
    import('node-fetch').then(({ default: fetch }) => fetch(url, init));

const openhimApiUrl = process.env.OPENHIM_API_URL;
const openhimUsername = process.env.OPENHIM_USERNAME;
const openhimPassword = process.env.OPENHIM_PASSWORD;

const openhimConfig = {
    username: openhimUsername,
    password: openhimPassword,
    apiURL: openhimApiUrl,
    trustSelfSigned: true
}

utils.authenticate(openhimConfig, (e: any) => {
    console.log(e ? e : "✅ OpenHIM authenticated successfully");
    importMediators();
    installChannels();
})

export const importMediators = () => {
    try {
        mediators.map((mediator: any) => {
            utils.registerMediator(openhimConfig, mediator, (e: any) => {
                console.log(e ? e : "");
            });
        })
    } catch (error) {
        console.log(error);
    }
    return;
}

export const getOpenHIMToken = async () => {
    try {
        let token = await utils.genAuthHeaders(openhimConfig);
        return token
    } catch (error) {
        console.log(error);
        return { error, status: "error" }
    }
}

export const installChannels = async () => {
    let headers = await getOpenHIMToken();
    mediators.map(async (mediator: any) => {
        let response = await (await fetch(`${openhimApiUrl}/channels`, {
            headers: { ...headers, "Content-Type": "application/json" }, method: 'POST', body: JSON.stringify(mediator.defaultChannelConfig[0]), agent: new Agent({
                rejectUnauthorized: false
            })
        })).text();
        console.log(response);
    })
}

export const createClient = async (name: string, password: string) => {
    let headers = await getOpenHIMToken();
    const clientPassword = password
    const clientPasswordDetails: any = await genClientPassword(clientPassword)
    let response = await (await fetch(`${openhimApiUrl}/clients`, {
        headers: { ...headers, "Content-Type": "application/json" }, method: 'POST',
        body: JSON.stringify({
            passwordAlgorithm: "sha512",
            passwordHash: clientPasswordDetails.passwordHash,
            passwordSalt: clientPasswordDetails.passwordSalt,
            clientID: name, name: name, "roles": [
                "*"
            ],
        }), agent: new Agent({
            rejectUnauthorized: false
        })
    })).text();
    console.log("create client: ", response)
    return response
}

const genClientPassword = async (password: string) => {
    return new Promise((resolve) => {
        const passwordSalt = crypto.randomBytes(16);
        // create passhash
        let shasum = crypto.createHash('sha512');
        shasum.update(password);
        shasum.update(passwordSalt.toString('hex'));
        const passwordHash = shasum.digest('hex');
        resolve({
            "passwordSalt": passwordSalt.toString('hex'),
            "passwordHash": passwordHash
        })
    })
}


createClient(process.env['OPENHIM_CLIENT_ID'] || '', process.env['OPENHIM_CLIENT_PASSWORD'] || '');


const OPENHIM_DEV_URL = process.env.OPENHIM_DEV_URL ?? '';
const OPENHIM_DEV_CLIENT = process.env.OPENHIM_DEV_CLIENT ?? '';
const OPENHIM_DEV_CLIENT_PASSWORD = process.env.OPENHIM_DEV_CLIENT_PASSWORD ?? '';

export const sendRequestToMediator = async (path: string, data: any, method: string = "POST") => {
    try {
        console.log(data);
        console.log(OPENHIM_DEV_URL + path);
        let response = await fetch(OPENHIM_DEV_URL + path, {
            method: method, ...(method !== "GET") && { body: JSON.stringify(data) },
            headers: {
                "Authorization": 'Basic ' + Buffer.from(OPENHIM_DEV_CLIENT + ':' + OPENHIM_DEV_CLIENT_PASSWORD).toString('base64'),
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        })
        let statusCode = response.status;
        let responseData = await response.json();
        // if (statusCode > 201 && statusCode !== 404){
        //     return responseData;
        // }
        return responseData;
    } catch (error) {
        return {
            resourceType: "OperationOutcome",
            id: "exception",
            issue: [{
                severity: "error",
                code: "exception",
                details: {
                    text: `${JSON.stringify(error)}`
                }
            }]
        }
    }

}