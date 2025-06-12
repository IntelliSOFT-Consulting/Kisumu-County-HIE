export const shrApiHost = process.env.SHR_BASE_URL;
export const crApiHost = process.env.CLIENT_REGISTRY_BASE_URL;

// a fetch wrapper for HAPI FHIR server.
export const FhirApi = async (params: any) => {
    let _defaultHeaders = { "Content-Type": 'application/json' }
    if (!params.method) {
        params.method = 'GET';
    }
    try {
        let response = await fetch(String(`${shrApiHost}${params.url}`), {
            headers: _defaultHeaders,
            method: params.method ? String(params.method) : 'GET',
            ...(params.method !== 'GET' && params.method !== 'DELETE') && { body: String(params.data) }
        });
        let responseJSON = await response.json();
        let res = {
            status: "success",
            statusText: response.statusText,
            data: responseJSON
        };
        return res;
    } catch (error) {
        console.error(error);
        let res = {
            statusText: "FHIRFetch: server error",
            status: "error",
            data: error
        };
        console.error(error);
        return res;
    }
}


export const OperationOutcome = (text: string) => {
    return {
        "resourceType": "OperationOutcome",
        "id": "exception",
        "issue": [{
            "severity": "error",
            "code": "exception",
            "details": { text }
        }]
    }
}

// a fetch wrapper for HAPI FHIR server.
export const ClientRegistryApi = async (url: string, params: any | null = {}) => {
    let _defaultHeaders = { "Content-Type": 'application/json', "Cache-Control": "no-cache" }
    if (!params?.method) {
        params.method = 'GET';
    }
    try {
        let response = await fetch(String(`${crApiHost}${url}`), {
            headers: _defaultHeaders,
            method: params.method ? String(params.method) : 'GET',
            ...(params.method !== 'GET' && params.method !== 'DELETE') && { body: JSON.stringify(params.data) }
        });
        let responseJSON = await response.json();
        let res = {
            status: "success",
            statusText: response.statusText,
            data: responseJSON,
            statusCode: response.status
        };
        return res;
    } catch (error) {
        console.error(error);
        let res = {
            statusText: "Client registry service error",
            status: "error",
            data: error,
            statusCode: 500
        };
        console.error(error);
        return res;
    }
}



export let createFHIRPatientSubscription = async () => {
    try {
        let FHIR_SUBSCRIPTION_ID = process.env['FHIR_PATIENT_SUBSCRIPTION_ID'];
        let FHIR_SUBSCRIPTION_CALLBACK_URL = process.env['FHIR_SUBSCRIPTION_CALLBACK_URL'];
        let response = await (await FhirApi({
            url: `/Subscription/${FHIR_SUBSCRIPTION_ID}`,
            method: "PUT", data: JSON.stringify({
                resourceType: 'Subscription',
                id: FHIR_SUBSCRIPTION_ID,
                status: "active",
                criteria: 'Patient?',
                channel: {
                    type: 'rest-hook',
                    endpoint: FHIR_SUBSCRIPTION_CALLBACK_URL,
                    payload: 'application/json'
                },
                extension: [
                    {
                        url: "http://hapifhir.io/fhir/StructureDefinition/subscription-delivery-retry-count",
                        valueInteger: 1
                    },
                    {
                        url: "http://hapifhir.io/fhir/StructureDefinition/subscription-retry",
                        valueBoolean: false
                    }
                ]
            })
        })).data
        if (response.resourceType != "OperationOutcome") {
            console.log(`FHIR Patient Subscription ID: ${FHIR_SUBSCRIPTION_ID}`);
            return;
        }
        console.log(`Failed to create FHIR Subscription: \n${response}`);
    } catch (error) {
        console.log(error);
    }
}

export let createEncounterSubscription = async () => {
    try {
        let FHIR_SUBSCRIPTION_ID = process.env['FHIR_ENCOUNTER_SUBSCRIPTION_ID'];
        let FHIR_SUBSCRIPTION_CALLBACK_URL = process.env['FHIR_ENCOUNTER_CALLBACK_URL'];
        let response = await (await FhirApi({
            url: `/Subscription/${FHIR_SUBSCRIPTION_ID}`,
            method: "PUT", data: JSON.stringify({
                resourceType: 'Subscription',
                id: FHIR_SUBSCRIPTION_ID,
                status: "active",
                criteria: 'Encounter?status=finished',
                channel: {
                    type: 'rest-hook',
                    endpoint: FHIR_SUBSCRIPTION_CALLBACK_URL,
                    payload: 'application/json'
                },
                extension: [
                    {
                        url: "http://hapifhir.io/fhir/StructureDefinition/subscription-delivery-retry-count",
                        valueInteger: 1
                    }, {
                        url: "http://hapifhir.io/fhir/StructureDefinition/subscription-retry",
                        valueBoolean: false
                    }
                ]
            })
        })).data
        if (response.resourceType != "OperationOutcome") {
            console.log(`FHIR Encounter Subscription ID: ${FHIR_SUBSCRIPTION_ID}`);
            return;
        }
        console.log(`Failed to create FHIR Subscription: \n${response}`);
    } catch (error) {
        console.log(error);
    }
}


export let createQuestionnaireResponseSubscription = async () => {
    try {
        let FHIR_SUBSCRIPTION_ID = process.env['FHIR_QRESPONSE_SUBSCRIPTION_ID'];
        let FHIR_SUBSCRIPTION_CALLBACK_URL = process.env['FHIR_QRESPONSE_CALLBACK_URL'];
        let response = await (await FhirApi({
            url: `/Subscription/${FHIR_SUBSCRIPTION_ID}`,
            method: "PUT", data: JSON.stringify({
                resourceType: 'Subscription',
                id: FHIR_SUBSCRIPTION_ID,
                status: "active",
                criteria: 'QuestionnaireResponse?',
                channel: {
                    type: 'rest-hook',
                    endpoint: FHIR_SUBSCRIPTION_CALLBACK_URL,
                    payload: 'application/json'
                },
                extension: [
                    {
                        url: "http://hapifhir.io/fhir/StructureDefinition/subscription-delivery-retry-count",
                        valueInteger: 1
                    },
                    {
                        url: "http://hapifhir.io/fhir/StructureDefinition/subscription-retry",
                        valueBoolean: false
                    }
                ]
            })
        })).data
        if (response.resourceType != "OperationOutcome") {
            console.log(`FHIR QR Subscription ID: ${FHIR_SUBSCRIPTION_ID}`);
            return;
        }
        console.log(`Failed to create FHIR Subscription: \n${response}`);
    } catch (error) {
        console.log(error);
    }
}


// these functions will be run anytime during runtime


// createFHIRPatientSubscription();
// createEncounterSubscription();
// createQuestionnaireResponseSubscription();
// createFHIRPatientSubscription();
