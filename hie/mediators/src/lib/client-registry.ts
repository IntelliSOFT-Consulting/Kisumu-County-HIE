import { ClientRegistryApi } from "./utils";
import { sendRequestToMediator } from './openhim';



const IDENTIFIERS_CONFIG = process.env.IDENTIFIERS_CONFIG ?? null;
const IDENTIFIER_SYSTEM = process.env.IDENTIFIER_SYSTEM ?? 'https://hie.kisumu.go.ke/IdentifierSystem';

if(!IDENTIFIERS_CONFIG) {
    throw new Error("IDENTIFIERS_CONFIG environment variable is not set");
}
// console.log(IDENTIFIERS_CONFIG)

const identifiersConfig = JSON.parse(IDENTIFIERS_CONFIG);
// console.log(identifiersConfig);

const identifierCodes = identifiersConfig.map((idConfig: any) => (
    idConfig.code
));

const validIdentifierSystems = identifierCodes.map((idCode: any) => (
    `${IDENTIFIER_SYSTEM}/${idCode}`
));
console.log(validIdentifierSystems);

interface Identifier {
    system: string;
    value: string;
    // Add other relevant identifier fields if needed
    code?: string;
    display?: string;
    type?: {
        coding: Array<{
            system: string;
            code: string;
            display: string;
        }>;
    };
}

interface Patient {
    resourceType: 'Patient';
    id?: string;
    identifier: Identifier[];
    // Add other relevant patient fields
    name: Array<{
        use: 'official';
        family: string;
        given: Array<string>;
    }>;
    managingOrganization?: {
        reference: string;
        display?: string;
    };
    telecom?: Array<{
        system: string;
        value: string;
        use?: string;
    }>;
    contact?: Array<{
        relationship?: Array<{
            coding: Array<{
                system: string;
                code: string;
                display: string;
            }>;
        }>;
        name?: {
            use?: string;
            family?: string;
            given?: Array<string>;
        };
        telecom?: Array<{
            system: string;
            value: string;
            use?: string;
        }>;
        address?: {
            use?: string;
            type?: string;
            text?: string;
            line?: Array<string>;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        };
    }>;
    birthDate: string; // ISO 8601 date format
    maritalStatus?: {
        coding: Array<{
            system: string;
            code: string;
            display: string;
        }>;
    };
}

export class ClientRegistryService {


    getIdentifiers(patient: Patient): Identifier[] {
        return patient.identifier || [];
    }

    getIdentifierSystems(patient: Patient): string[] {
        const identifiers = this.getIdentifiers(patient);
        return identifiers.map(id => id.system).filter(system => system !== undefined);
    }
   

    async checkIdentifierUniqueness(patient: Patient): Promise<boolean> {
        // try {
            const identifiers = this.getIdentifiers(patient);
            const identifierSystems = this.getIdentifierSystems(patient);
            
            // if identifier systems are not in the idCodes
            const invalidSystems = identifierSystems.filter(system => !validIdentifierSystems.includes(system));
            if (invalidSystems.length > 0) {
                throw new Error(`Invalid identifiers : ${invalidSystems.join(', ')}`);
            }
            
            const searchParams = identifiers.map(id => `identifier=${id.system}%7C${id.value}`).join('&');
            console.log('Checking identifier uniqueness with search params:', searchParams);
            const response = (await ClientRegistryApi(`/Patient?${searchParams}`)).data;
            return response.total === 0; // No patient found means identifier is unique
        // } catch (error) {
        //     console.error('Error checking identifier uniqueness:', error);
        //     throw error;
        // }
    }

    async savePatient(patient: Patient): Promise<string> {
        try {
            // ensure patient has dob
            if (!patient.birthDate) {
                throw new Error('Patient must have a birth date');
            }
            // ensure patient has a name and a given name
            if (!patient.name || !patient.name[0] || !patient.name[0].given || patient.name[0].given.length === 0) {
                throw new Error('Patient must have a name with at least one given name');
            }
            // check if patient already has a UPI
            const hasUpi = patient.identifier.some(id => id.system === `${IDENTIFIER_SYSTEM}/UPI`); // Replace with actual UPI system URL
            if (hasUpi) {
                // remove existing UPI identifiers
                patient.identifier = patient.identifier.filter(id => id.system !== `${IDENTIFIER_SYSTEM}/UPI`);
            }
            // generate UPI prefixed with "CR"
            // const upi = `CR${Math.floor(Math.random() * 1000000000).toString()}`;
            const upi = generateUpi(patient); // Generate UPI using the provided function
            // Add the UPI to the patient identifier
            patient.id = upi; // Set the patient ID to the UPI
            patient.identifier.push({
                system: `${IDENTIFIER_SYSTEM}/UPI`, // Replace with actual UPI system URL
                value: upi,
                code: 'UPI',
                display: 'Unique Patient Identifier',
                type: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                        code: 'UPI',
                        display: 'Unique Patient Identifier'
                    }]
                }
            });
            let response =  await ClientRegistryApi(`/Patient/${upi}`, { method: 'PUT', data: patient,});
            return response.data; // Return the created patient's ID
        } catch (error) {
            console.error('Error saving patient:', error);
            throw error;
        }
    }

    async updatePatient(patientId: string, patient: Patient): Promise<string> {
        try {
            let response = await ClientRegistryApi(`/Patient/${patientId}`, { method: 'PUT', data: patient });
            return response.data; // Return the updated patient's ID
        } catch (error) {
            console.error('Error updating patient:', error);
            throw error;
        }
    }  
}


// upi generation logic, use dob and initials of the name and the length of the name and time of creation
export function generateUpi(patient: Patient): string {
    if (!patient.birthDate || !patient.name || patient.name.length === 0) {
        throw new Error('Patient must have a birth date and a name');
    }
    
    const dob = new Date(patient.birthDate);
    // dob
    const initials = patient.name[0].given.map(name => name.charAt(0).toUpperCase()).join('');
    const length = patient.name[0].given.join('').length;
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of the timestamp

    return `CR${dob.getFullYear()}${(dob.getMonth() + 1).toString().padStart(2, '0')}${dob.getDate().toString().padStart(2, '0')}${initials}${length}${timestamp}`;
}

export function findPatientWithSimilarNames(patients: Patient[], patient: Patient): Patient[] {
    const similarPatients: Patient[] = [];
    const patientName = patient.name[0].given.join(' ').toLowerCase();

    for (const p of patients) {
        const pName = p.name[0].given.join(' ').toLowerCase();
        if (pName.includes(patientName) || patientName.includes(pName)) {
            similarPatients.push(p);
        }
    }

    return similarPatients;
}

export function findPatientWithSimilarDobs(patients: Patient[], patient: Patient): Patient[] {
    const similarPatients: Patient[] = [];
    const patientDob = new Date(patient.birthDate).toISOString().split('T')[0]; // Format YYYY-MM-DD

    for (const p of patients) {
        const pDob = new Date(p.birthDate).toISOString().split('T')[0]; // Format YYYY-MM-DD
        if (pDob === patientDob) {
            similarPatients.push(p);
        }
    }

    return similarPatients;
}