import { dvFetch } from "./client.js";
import type { OperationSetResult, OperationResult, ExecuteResult } from "./types.js";
import { randomUUID } from "crypto";

/**
 * Project Schedule Service (PSS) API wrapper.
 *
 * Dataverse's ProjectServiceCore plugin blocks direct table writes to
 * msdyn_projecttask and msdyn_projectbucket. All creates, updates, and
 * deletes for these entities must go through the Schedule API:
 *
 *   1. createOperationSet(projectId) → operationSetId
 *   2. pssCreate / pssUpdate / pssDelete  (add operations to the batch)
 *   3. executeOperationSet(operationSetId) → result
 */

/** Step 1: Open a new operation set (transaction group) for a project */
export async function createOperationSet(
  envUrl: string,
  token: string,
  projectId: string,
  description = ""
): Promise<string> {
  const result = await dvFetch<OperationSetResult>(
    envUrl,
    "msdyn_CreateOperationSetV1",
    token,
    {
      method: "POST",
      body: JSON.stringify({
        ProjectId: projectId,
        Description: description,
      }),
    }
  );
  return result.OperationSetId;
}

/** Step 2a: Queue a CREATE operation */
export async function pssCreate(
  envUrl: string,
  token: string,
  entityLogicalName: string,
  fields: Record<string, unknown>,
  operationSetId: string
): Promise<{ operationId: string }> {
  // Omit the entity ID — Dataverse auto-generates it via the Schedule API.
  // @odata.type (single @) is required so Dataverse knows the concrete entity type.
  const entity: Record<string, unknown> = {
    "@odata.type": `Microsoft.Dynamics.CRM.${entityLogicalName}`,
    ...fields,
  };

  const result = await dvFetch<OperationResult>(
    envUrl,
    "msdyn_PssCreateV1",
    token,
    {
      method: "POST",
      body: JSON.stringify({ Entity: entity, OperationSetId: operationSetId }),
    }
  );
  return { operationId: result.OperationId };
}

/** Step 2b: Queue an UPDATE operation */
export async function pssUpdate(
  envUrl: string,
  token: string,
  entityLogicalName: string,
  entityId: string,
  fields: Record<string, unknown>,
  operationSetId: string
): Promise<string> {
  const entity: Record<string, unknown> = {
    "@odata.type": `Microsoft.Dynamics.CRM.${entityLogicalName}`,
    [`${entityLogicalName}id`]: entityId,
    ...fields,
  };

  const result = await dvFetch<OperationResult>(
    envUrl,
    "msdyn_PssUpdateV1",
    token,
    {
      method: "POST",
      body: JSON.stringify({ Entity: entity, OperationSetId: operationSetId }),
    }
  );
  return result.OperationId;
}

/** Step 2c: Queue a DELETE operation */
export async function pssDelete(
  envUrl: string,
  token: string,
  entityLogicalName: string,
  entityId: string,
  operationSetId: string
): Promise<string> {
  const result = await dvFetch<OperationResult>(
    envUrl,
    "msdyn_PssDeleteV1",
    token,
    {
      method: "POST",
      body: JSON.stringify({
        EntityLogicalName: entityLogicalName,
        RecordId: entityId,
        OperationSetId: operationSetId,
      }),
    }
  );
  return result.OperationId;
}

/** Step 3: Execute all queued operations */
export async function executeOperationSet(
  envUrl: string,
  token: string,
  operationSetId: string
): Promise<ExecuteResult> {
  return dvFetch<ExecuteResult>(
    envUrl,
    "msdyn_ExecuteOperationSetV1",
    token,
    {
      method: "POST",
      body: JSON.stringify({ OperationSetId: operationSetId }),
    }
  );
}

/**
 * Convenience: wrap a single-operation write in a complete operation set flow.
 * Returns the entity ID used (generated or provided).
 */
export async function runScheduledCreate(
  envUrl: string,
  token: string,
  projectId: string,
  entityLogicalName: string,
  fields: Record<string, unknown>
): Promise<void> {
  const opSetId = await createOperationSet(envUrl, token, projectId);
  await pssCreate(envUrl, token, entityLogicalName, fields, opSetId);
  await executeOperationSet(envUrl, token, opSetId);
}

export async function runScheduledUpdate(
  envUrl: string,
  token: string,
  projectId: string,
  entityLogicalName: string,
  entityId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const opSetId = await createOperationSet(envUrl, token, projectId);
  await pssUpdate(envUrl, token, entityLogicalName, entityId, fields, opSetId);
  await executeOperationSet(envUrl, token, opSetId);
}

export async function runScheduledDelete(
  envUrl: string,
  token: string,
  projectId: string,
  entityLogicalName: string,
  entityId: string
): Promise<void> {
  const opSetId = await createOperationSet(envUrl, token, projectId);
  await pssDelete(envUrl, token, entityLogicalName, entityId, opSetId);
  await executeOperationSet(envUrl, token, opSetId);
}
