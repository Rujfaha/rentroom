import { AppError } from "../http/api-error";
import type { AccountRole, CurrentAccount } from "./types";

export function canUseRole(role: AccountRole, allowedRoles: AccountRole[]): boolean {
  return allowedRoles.includes(role);
}

export function requireRole(account: CurrentAccount, allowedRoles: AccountRole[]): CurrentAccount {
  if (!canUseRole(account.role, allowedRoles)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  if (account.status !== "active") {
    throw new AppError("Account is not active", 403, "ACCOUNT_INACTIVE");
  }

  return account;
}
