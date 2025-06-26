import express from 'express';
import { FhirApi, OperationOutcome } from '../lib/utils';
import fetch from 'node-fetch';
import { findPatientByIdentifier, validateResourceProfile } from '../lib/validate';


export const router = express.Router();

router.use(express.json());

/* process FHIR Encounter & Observations */
router.post('/', async (req, res) => {
  try {
    let data = req.body;
    if (data.resourceType != "Encounter" && data.resourceType != "Bundle") {
      res.statusCode = 400;
      res.json(OperationOutcome("Invalid FHIR Resource provided. Expects either an Encounter or Bundle"));
      return;
    }

    // check if encounter has a profile
    if (data.resourceType === "Encounter" && (!data.meta || !data.meta.profile)) {
      res.statusCode = 400;
      res.json(OperationOutcome("Invalid FHIR Resource provided. Provide an Encounter with a profile"));
      return;
    }

    let patient = null;

    if (data.resourceType === "Bundle") {
      // get all patient references from the bundle
      let patientReferences = data.entry
        .filter((entry: any) => entry.resource?.resourceType === "Patient")
        .map((entry: any) => entry.resource?.id || entry.resource?.identifier?.[0]?.value || entry.resource?.subject?.reference);
      // if references are not the same, return an error
      if (new Set(patientReferences).size > 1) {
        res.statusCode = 400;
        res.json(OperationOutcome("Bundle must reference a single Patient Resource"));
        return;
      }
      patient = findPatientByIdentifier(patientReferences[0])
    }

    if (data.resourceType === "Encounter") {
      // check if encounter has a patient reference
      if (!data.subject || !data.subject.reference) {
        res.statusCode = 400;
        res.json(OperationOutcome("Encounter must reference a Patient Resource"));
        return;
      }
      patient = await findPatientByIdentifier(data.subject.reference);

      // validate the encounter resource profile
      const validationResult = await validateResourceProfile(data);
      if (validationResult.status === "error") {
        res.statusCode = 400;
        res.json(OperationOutcome(validationResult.response));
        return;
      }
    }
  
    if (!patient) {
      res.statusCode = 400;
      res.json(OperationOutcome(`Bundle must contain a valid Patient`));
      return;
    }

    // post to SHR Server
    let response = await FhirApi(`${data.resourceType === "Bundle" ? "/" : `/Encounter || ''}`}`, { method: "POST", data: data });
    return res.status(response.statusCode).json(response.data);



    // post to FHIR Server

    return;
  } catch (error) {

  }
});



export default router;
