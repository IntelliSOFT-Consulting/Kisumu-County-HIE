import express from 'express';
import { FhirApi, OperationOutcome } from '../lib/utils';


export const router = express.Router();

router.use(express.json());

/* process FHIR Bundle */
router.post('/', async (req, res) => {
  try {
    let data = req.body;
    // console.log("FHIR Bundle Payload", data);
    if (data.resourceType != "Bundle" || !data.entry || !Array.isArray(data.entry)) {
      res.statusCode = 400;
      res.json(OperationOutcome("Invalid FHIR Resource provided. Expects a FHIR transaction Bundle"));
      return;
    }
    let patient = null;

    let encounter;
    if (data.type !== "transaction") {
      res.statusCode = 400;
      res.json(OperationOutcome("Invalid FHIR Resource provided. Expects a FHIR transaction Bundle"));
      return;
    }
    // check if the bundle has an encounter
    for (let entry of data.entry) {
      if (entry?.resource?.resourceType === "Encounter") {
        encounter = entry?.resource;
        // check if encounter has a profile

      }
    }

    if (!encounter) {
      res.status(400).json(OperationOutcome("Bundle must contain an Encounter Resource"));
      return;
    }
    if (!encounter.meta || !encounter.meta.profile) {
      res.statusCode = 400;
      res.json(OperationOutcome("Invalid FHIR Resource provided. Expects an Encounter with a profile"));
      return;
    }
    for (let entry of data.entry) {
      
    }
    if (!patient) {
      res.statusCode = 400;
      res.json(OperationOutcome(`Bundle must contain a Patient Resource`));
      return;
    }
    // check if patient exists
    let fhirPatient = (await FhirApi(`/Patient/${patient}`)).data;
    if (fhirPatient.resourceType === "Patient") {
      return res.status(400).json(OperationOutcome("Invalid FHIR Resource provided. Expects a FHIR transaction Bundle"));
    }


    // post to FHIR Server

    return;
  } catch (error) {

  }
});



export default router;
