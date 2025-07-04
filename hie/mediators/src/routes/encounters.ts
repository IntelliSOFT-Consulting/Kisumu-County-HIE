import express from 'express';
import { FhirApi, OperationOutcome } from '../lib/utils';
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

    let patient = null;

    // check if bundle has Patient resource
    const hasPatientResource = data.resourceType === "Bundle" && data.entry?.some((entry: any) => entry.resource?.resourceType === "Patient");
    if (hasPatientResource) {
      return res.status(400).json(OperationOutcome("Invalid FHIR Bundle"));
    }

    let encounters = [];
    encounters = data.resourceType === "Bundle" ? data.entry?.filter((entry: any) => entry.resource?.resourceType === "Encounter").map((entry: any) => entry.resource) : [data];
    if (encounters.length !== 1) {
      return res.status(400).json(OperationOutcome("Bundle must contain one Encounter Resource"));
    }

    let encounter = encounters[0];

    let subjectReference = encounter.subject?.reference;
    if (!subjectReference) {
      return res.status(400).json(OperationOutcome("Encounter must reference a Patient"));
    }

    let patientId = subjectReference.split("/")[1];
    patient = await findPatientByIdentifier(patientId);

    if (!patient) {
      return res.status(400).json(OperationOutcome("Invalid Patient reference in Bundle"));
    }

    if (data.resourceType === "Encounter") {
      // check if encounter has a patient reference
      if (!data.subject || !data.subject.reference) {
        return res.status(400).json(OperationOutcome("Encounter must reference a Patient Resource"));
      }
      patient = await findPatientByIdentifier(data.subject.reference);
      if (!patient) {
        return res.status(400).json(OperationOutcome(`Bundle must contain a valid Patient`));
      }

      // validate the encounter resource profile
      // const validationResult = await validateResourceProfile(data);
      // if (validationResult.status === "error") {
      //   res.statusCode = 400;
      //   res.json(OperationOutcome(validationResult.response));
      //   return;
      // }
    }
    // post to FHIR Server
    let response = await FhirApi(`/`, { method: "POST", data: data });
    return res.status(response.statusCode).json(response.data);

  } catch (error) {
    console.error(error);
    return res.status(400).json(error);
  }
});

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
    let url = `/Encounter?${queryString ? `&${queryString}` : ''}`;
    console.log(`Fetching Encounters with query: ${url}`);
    let response = (await FhirApi(url)).data;
    return res.status(200).json(response);
  } catch (error) {
    console.log(error);
    return res.status(400).json(OperationOutcome(`${JSON.stringify(error)}`));
  }
});


export default router;
