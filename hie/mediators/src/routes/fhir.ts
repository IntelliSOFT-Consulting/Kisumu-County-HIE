import express from 'express';
import { FhirApi, OperationOutcome } from '../lib/utils';


export const router = express.Router();

router.use(express.json());

/* process FHIR Bundle */
router.post('/', async (req, res) => {
  try {
    let data = req.body;
    // console.log("FHIR Bundle Payload", data);
    if (data.resourceType != "Bundle") {
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
        encounter = entry?.resource?.id;
        break;
      }
    }
    if (!encounter) {
      res.status(400).json(OperationOutcome("Bundle must contain an Encounter Resource"));  
      return; 
    }
    for (let entry of data.entry) {
      // existing patient
      if (entry?.resource?.resourceType === "Patient" && entry?.request?.method === "PUT") {
        patient = entry?.resource?.id;
        break;
      }
      // create a new patient
      if (entry?.resource?.resourceType === "Patient" && entry?.request?.method === "POST") {
        patient = entry?.resource?.id;
        let fhirPatient = entry?.resource;
        for (let id of fhirPatient.identifiers) {
          // if()
        }
      }
    }
    if (!patient) {
      res.statusCode = 400;
      res.json(OperationOutcome(`Bundle must contain a Patient Resource`));
      return;
    }
    // check if patient exists
    let fhirPatient = (await FhirApi({ url: `/Patient/${patient}` })).data;
    if (fhirPatient.resourceType === "Patient") {
      return res.status(400).json(OperationOutcome("Invalid FHIR Resource provided. Expects a FHIR transaction Bundle"));
    }


    // post to FHIR Server

    return;
  } catch (error) {

  }
});



export default router;
