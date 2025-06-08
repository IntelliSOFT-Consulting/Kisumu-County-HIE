

const encounterCodes = process.env.ENCOUNTER_CODES?.split(',') || [];


// 1. Each Patient must not have more than one active encounter at a time.
// 2. Each Patient must not have more than one active encounter with the same code at a time.

export function validateEncounter(encounter: any, existingEncounters: any[]) {
    const patientId = encounter.subject?.reference;
    const encounterCode = encounter.type?.[0]?.coding?.[0]?.code;

    // Check if the patient already has an active encounter
    const hasActiveEncounter = existingEncounters.some(existing => {
        return existing.subject?.reference === patientId &&
               existing.status === 'in-progress' &&
               existing.id !== encounter.id; // Exclude the current encounter
    });

    if (hasActiveEncounter) {
        return { valid: false, message: 'Patient already has an active encounter.' };
    }

    // Check if the patient has an active encounter with the same code
    const hasSameCodeEncounter = existingEncounters.some(existing => {
        return existing.subject?.reference === patientId &&
               existing.type?.[0]?.coding?.[0]?.code === encounterCode &&
               existing.status === 'in-progress' &&
               existing.id !== encounter.id; // Exclude the current encounter
    });

    if (hasSameCodeEncounter) {
        return { valid: false, message: 'Patient already has an active encounter with this code.' };
    }

    return { valid: true, message: 'Encounter is valid.' };
}
