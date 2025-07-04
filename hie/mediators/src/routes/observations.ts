import express from 'express';
import { FhirApi, OperationOutcome } from '../lib/utils';
import { findPatientByIdentifier, validateResourceProfile } from '../lib/validate';


export const router = express.Router();

router.use(express.json());

router.get("/", async (req, res) => {
  try {
    // support all FHIR query parameters

    let { identifier, name } = req.query;

    // // check if identifier is provided or name is provided
    // if (!identifier) {
    //   return res.status(400).json(OperationOutcome("Identifier query parameter is required"));
    // }
    // // check if identifier is a string
    // if (typeof identifier !== "string") {
    //   return res.status(400).json(OperationOutcome("Identifier query parameter must be a string"));
    // }

    let queryParams = new URLSearchParams(Object.entries(req.query).map(([key, val]) => [key, String(val)]));
    let queryString = queryParams.toString();
    let url = `/Observation?${queryString ? `&${queryString}` : ''}`;
    console.log(`Fetching Encounters with query: ${url}`);
    let response = (await FhirApi(url)).data;
    return res.status(200).json(response);
  } catch (error) {
    console.log(error);
    return res.status(400).json(OperationOutcome(`${JSON.stringify(error)}`));
  }
});


export default router;
