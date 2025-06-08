import express from 'express';
import { FhirApi, OperationOutcome, sendSlackAlert } from '../lib/utils';
import fetch from 'node-fetch';
import { processIdentifiers } from '../lib/carepay';


export const router = express.Router();

router.use(express.json());

/* process FHIR Encounter & Observations */
router.post('/', async (req, res) => {
  try {
    let data = req.body;
    if (data.resourceType != "Encounter") {
      res.statusCode = 400;
      res.json(OperationOutcome("Invalid FHIR Resource provided. Expects an Encounter"));
      return;
    }
    let patient = null;

    
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
