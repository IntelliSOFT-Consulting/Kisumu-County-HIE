import express from "express";

import { ClientRegistryService } from "../lib/client-registry";
import { ClientRegistryApi, OperationOutcome } from "../lib/utils";


export const router = express.Router();

// Custom middleware to handle application/fhir+json content type
router.use(
  express.json({
    type: ["application/json", "application/fhir+json"],
  })
);


router.post("/", async (req, res) => {
  try {
    let data = req.body;
    if (data.resourceType !== "Patient") {
      return res.status(400).json(OperationOutcome(`${JSON.stringify(`Invalid Patient resource`)}`));
    }
    const clientRegistry = new ClientRegistryService();

    const isUnique = await clientRegistry.checkIdentifierUniqueness(data);
    if (isUnique) {
        const patient = await clientRegistry.savePatient(data);
        return res.status(201).json(patient);
    } else {
        return res.status(400).json(OperationOutcome(`Patient with provided identifiers already registered`));
    }
  } catch (error: any) {
    console.log(error);
    return res.status(400).json(OperationOutcome(error.message));
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
    let url = `/Patient?${queryString ? `&${queryString}` : ''}`;
    console.log(`Fetching Patients with query: ${url}`);
    let response = (await ClientRegistryApi(url)).data;
    return res.status(200).json(response);
  } catch (error) {
    console.log(error);
    return res.status(400).json(OperationOutcome(`${JSON.stringify(error)}`));
  }
});


// support custom delete of a Patient
// add a UI to input phone number
router.delete("/:id", async (req, res) => {
  let data = req.body;
  // let { phoneNumber } = req.params;
  try {
    let response = await ClientRegistryApi("/fhir/Patient", data);
    console.log(JSON.stringify(response));
    
    res.statusCode = 201;
    res.json(response);
    return;
  } catch (error) {
    res.statusCode = 400;
    res.json({
      resourceType: "OperationOutcome",
      id: "exception",
      issue: [
        {
          severity: "error",
          code: "exception",
          details: {
            text: `${JSON.stringify(error)}`,
          },
        },
      ],
    });
    return;
  }
});

export default router;
