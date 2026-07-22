"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseStandardsRepository,
  type AuthenticatedSupabaseRpcClient
} from "@yuppie/db";
import {
  createStandardsService,
  type AddStandardEvidenceRequest,
  type ApproveStandardVersionRequest,
  type CreateStandardRequest,
  type CreateStandardVersionRequest,
  type RejectStandardVersionRequest,
  type RetireStandardVersionRequest,
  type StandardsMutationReceipt,
  type SubmitStandardForReviewRequest,
  type UpdateDraftVersionRequest,
  type UpdateStandardRequest
} from "@yuppie/domain";

import { createAuthenticatedSupabaseClient } from "../supabase/client";
import { resolveStandardsActor } from "./actor";
import {
  createStandardsActionHandlers,
  type StandardsActionHandlers,
  type StandardsActionResponse
} from "./handler-factory";

type MutationResponse = StandardsActionResponse<StandardsMutationReceipt>;

function authenticatedRpcClient(
  client: SupabaseClient
): AuthenticatedSupabaseRpcClient {
  return {
    rpc: async (functionName, parameters) => {
      const { data, error } = await client.rpc(functionName, parameters);
      return { data, error };
    }
  };
}

async function runAction(
  operation: keyof StandardsActionHandlers,
  input: unknown
): Promise<MutationResponse> {
  try {
    const client = await createAuthenticatedSupabaseClient();
    const repository = createSupabaseStandardsRepository(
      authenticatedRpcClient(client)
    );
    const service = createStandardsService(repository);
    const handlers = createStandardsActionHandlers({
      service,
      resolveActor: (organizationId) =>
        resolveStandardsActor(client, organizationId)
    });

    return await handlers[operation](input);
  } catch {
    return {
      error: {
        code: "unexpected_error",
        message: "The standards operation could not be completed."
      }
    };
  }
}

export async function createStandardAction(
  input: CreateStandardRequest
): Promise<MutationResponse> {
  return runAction("createStandard", input);
}

export async function updateStandardAction(
  input: UpdateStandardRequest
): Promise<MutationResponse> {
  return runAction("updateStandard", input);
}

export async function createStandardVersionAction(
  input: CreateStandardVersionRequest
): Promise<MutationResponse> {
  return runAction("createVersion", input);
}

export async function updateDraftStandardVersionAction(
  input: UpdateDraftVersionRequest
): Promise<MutationResponse> {
  return runAction("updateDraftVersion", input);
}

export async function addStandardEvidenceAction(
  input: AddStandardEvidenceRequest
): Promise<MutationResponse> {
  return runAction("addEvidence", input);
}

export async function submitStandardForReviewAction(
  input: SubmitStandardForReviewRequest
): Promise<MutationResponse> {
  return runAction("submitForReview", input);
}

export async function approveStandardVersionAction(
  input: ApproveStandardVersionRequest
): Promise<MutationResponse> {
  return runAction("approveVersion", input);
}

export async function rejectStandardVersionAction(
  input: RejectStandardVersionRequest
): Promise<MutationResponse> {
  return runAction("rejectVersion", input);
}

export async function retireStandardVersionAction(
  input: RetireStandardVersionRequest
): Promise<MutationResponse> {
  return runAction("retireVersion", input);
}
