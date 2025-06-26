// //- profile validation

import { ClientRegistryApi, FhirApi } from "./utils";


export async function validateResourceProfile(
  resource: any,
  profile: string | null = null
) {

  if (!profile) {
    profile = resource.meta?.profile?.[0]?.split("/").pop();
  }

  const response = (
    await FhirApi(
      `${resource.resourceType}/$validate?profile=StructureDefinition/${profile}`, {
      method: "POST",
      body: resource,
    })
  ).data;
  // logger.info(response);
  let issues = response?.issue;
  let errors: Array<any> = issues.map((issue: any) => {
    return issue.severity;
  });
  if (errors.indexOf("error") > -1) {
    return { status: "error", response };
  }
  return { status: "success", response };
}

function extractSubjectIdentifier(data: any) {
  try {
    let subjectUpi = "";
    let fhirResource = data;
    if (
      fhirResource &&
      fhirResource.subject &&
      fhirResource.subject.identifier
    ) {
      subjectUpi =
        fhirResource.subject.identifier.value || fhirResource.subject.display;
    }
    return subjectUpi;
  } catch (error) { }
}

const _asyncValidator = async (resources: Array<any>) => {
  try {
    let results: any = [];
    let failedValidation: any = [];

    for (let resource in resources) {
      let identifier = extractSubjectIdentifier(resource);
      if (identifier) {
        results.push(`${resource}/`);
      } else {
        failedValidation.push(
          `${resource} failed resource validation: invalid entity`
        );
      }


      // results[`${resource.id}`]
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const findPatientByIdentifier = async (id: string, identifierType: string | null = null) => {
  try {
    const patient = (await ClientRegistryApi(`/Patient?identifier=${id}`)).data;
    if (patient?.entry?.total && patient?.entry?.total > 0) {
      return patient?.entry?.[0]?.resource?.id;
    }
    return patient.id;
  } catch (error) {
    return null;
  }
};



interface EntityReference {
  resourceType: string;
  reference?: string;
  identifier?: {
    value: string;
    system?: string;
  };
  display?: string;
}
