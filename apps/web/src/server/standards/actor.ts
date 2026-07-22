import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrganizationAuthorizationContext } from "@yuppie/auth";
import type { MembershipRole } from "@yuppie/domain";

export type ActorResolutionErrorCode =
  | "unauthorized"
  | "forbidden"
  | "unexpected_error";

export type ActorResolution =
  | { readonly data: OrganizationAuthorizationContext }
  | {
      readonly error: {
        readonly code: ActorResolutionErrorCode;
        readonly message: string;
      };
    };

interface MembershipRow {
  readonly id: string;
  readonly organization_id: string;
}

interface MembershipRoleRow {
  readonly role: MembershipRole;
}

export async function resolveStandardsActor(
  client: SupabaseClient,
  organizationId: string
): Promise<ActorResolution> {
  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError || !user) {
    return {
      error: {
        code: "unauthorized",
        message: "Authentication is required."
      }
    };
  }

  const { data: membershipData, error: membershipError } = await client
    .from("organization_memberships")
    .select("id, organization_id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle();

  if (membershipError) {
    return {
      error: {
        code: "unexpected_error",
        message: "The organization membership could not be resolved."
      }
    };
  }

  const membership = membershipData as MembershipRow | null;

  if (!membership) {
    return {
      error: {
        code: "forbidden",
        message: "An active organization membership is required."
      }
    };
  }

  const { data: roleData, error: rolesError } = await client
    .from("organization_membership_roles")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("membership_id", membership.id);

  if (rolesError) {
    return {
      error: {
        code: "unexpected_error",
        message: "The organization roles could not be resolved."
      }
    };
  }

  const roles = (roleData ?? []) as MembershipRoleRow[];

  return {
    data: {
      userId: user.id,
      organizationId: membership.organization_id,
      membershipId: membership.id,
      membershipRoles: roles.map(({ role }) => role)
    }
  };
}
