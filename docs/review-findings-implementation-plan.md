# Review Findings Implementation Plan

This plan covers the six review findings around order processing, payments, role checks, checkout side effects, and form validation.

## Goals

- Prevent duplicate order completion and duplicate delivery notifications under concurrent auto-processing.
- Ensure external payment callbacks can always be matched to a local recharge record.
- Remove role-check behavior that can accidentally grant real users internal service privileges.
- Keep checkout-created records consistent when validation, balance deduction, or order creation fails.
- Enforce required dynamic form fields on the server, not only in the browser.
- Add tests that prove the money/order paths are idempotent and rollback-safe.

## Non-Goals

- Redesign the checkout UI.
- Refactor the full product detail client component.
- Replace all `any` usage across the repo.
- Change payment provider APIs beyond idempotency and local consistency.

## Implementation Order

1. Fix the role bypass first because it affects multiple admin/staff gates.
2. Fix order-processing atomicity and notification timing.
3. Fix PayOS recharge creation idempotency.
4. Move checkout form-submission creation into the same transaction as order creation.
5. Restore server-side required-field validation.
6. Add/adjust focused tests and run verification.

## 1. Scope Internal Service Privileges

Finding: `src/access/hasRoles.ts` lets `AUTO_PROCESS_USER_ID` pass any `userHasRole` check.

Plan:

- Remove the unconditional `user.id === config.AUTO_PROCESS_USER_ID` success path from `userHasRole`.
- Keep normal role checks based on the `roles` field.
- Introduce an explicit internal actor helper only for server-owned Payload calls, for example:
  - `isAutoProcessActor(req)` for request contexts marked by `context.isAutoProcess`.
  - or pass a fully scoped internal user object only inside `OrderProcessingService`.
- Audit current `userHasRole(...)` callers in server actions and API routes to ensure no endpoint relies on the bypass.
- Preserve `hasRole` behavior for Payload local API calls only if `req.user` is a numeric internal actor and cannot originate from a real browser session.

Tests:

- Unit test `userHasRole({ id: AUTO_PROCESS_USER_ID, roles: ['user'] }, ['admin'])` returns `false`.
- Unit test a normal admin still returns `true`.
- Unit test order auto-processing still works with its internal Payload calls.

## 2. Make Auto-Processing Completion Atomic

Findings:

- `processOrder` reads `IN_QUEUE`, then `updateOrderToCompleted` updates by `id` only.
- Direct/key paths send notifications before the outer transaction commits.

Plan:

- Change `updateOrderToCompleted` to update with both:
  - `id = orderId`
  - `status = IN_QUEUE`
- If no document is updated, return or throw a controlled result:
  - `success: false`
  - `message: "Order is no longer IN_QUEUE, auto-processing skipped"`
- Remove notification sending from lower-level helpers that still run inside the transaction:
  - `handleAutoProcess`
  - `processKeyType`
  - `updateOrderToCompleted`
- Have processing methods return the completed order as data or as an internal value.
- Commit the transaction first.
- Only after commit, call `sendOrderCompletedNotification(completedOrder)`.
- Keep rollback behavior unchanged for failed paths.
- Revisit the unused `handleFixedStock` method:
  - either route fixed-stock handling through it after updating it to the new shape,
  - or remove it if the newer `updateOrderToCompleted` path fully replaces it.

Tests:

- Update `src/__tests__/order-processing-fixed-stock.test.ts` to match the intended result shape.
- Add a test where the conditional update returns no docs and assert:
  - no commit
  - rollback happens
  - no notification is sent
- Add a test where notification is sent only after commit resolves.
- Add direct and key auto-process tests for the same behavior.

## 3. Make PayOS Recharge Creation Idempotent

Finding: PayOS link creation happens before the local `recharges` row exists.

Plan:

- Generate `orderCode` locally before calling PayOS.
- Reserve a local `recharges` row first:
  - `gateway: PAYOS`
  - `orderCode`
  - `amount`
  - `user`
  - `status: PENDING`
  - initial `data` containing a creation attempt marker.
- Use the unique `(orderCode, gateway)` constraint to avoid duplicate rows.
- Call PayOS with that reserved `orderCode`.
- Update the same recharge row with PayOS response data.
- If PayOS creation fails:
  - mark the reserved recharge as `CANCEL` with error metadata, or
  - delete it only if there is no chance the provider accepted the request.
- On order-code collision, retry by generating another code before calling PayOS.
- On webhook:
  - treat already-successful recharge callbacks as idempotent success instead of an error condition.
  - keep row-level locking before crediting balance.

Tests:

- Mock PayOS success and assert recharge is created before provider response is saved.
- Mock DB duplicate orderCode and assert retry uses a new orderCode.
- Mock PayOS failure and assert the recharge is not left in an ambiguous state.
- Mock duplicate webhook delivery and assert balance is credited once.

## 4. Keep Checkout Side Effects in One Transaction

Finding: checkout creates `form-submissions` before voucher validation, balance deduction, and order creation.

Plan:

- Choose one transaction strategy for checkout:
  - Prefer a single Drizzle transaction if direct inserts are already used for users, orders, vouchers, and transactions.
  - Insert form submissions inside that same transaction using the generated schema table.
- If using Payload operations for form submissions, ensure they run inside the same Payload transaction context as the order write.
- Move form-submission creation after product/quantity checks and voucher validation, but before order insert.
- If any later step fails, the transaction must rollback:
  - form submission
  - user balance mutation
  - order insert
  - transaction ledger insert
  - voucher usage increment
- Avoid creating any checkout-owned record before all cheap validation is complete.
- Add a small helper for form-submission normalization so checkout and update flows share validation behavior.

Tests:

- Checkout with invalid voucher must not create a form submission.
- Checkout with insufficient balance must not create a form submission.
- Successful checkout with a required form creates exactly one form submission linked to the order.
- Transaction rollback leaves no ledger or voucher usage changes.

## 5. Restore Server-Side Required Field Validation

Finding: required dynamic form fields are only enforced on the client.

Plan:

- In `src/collections/FormSubmission.ts`, restore required-field validation in `submissionData.validate`.
- Reuse or extend `validateRequiredFields` for server compatibility.
- Make validation block empty strings, `null`, `undefined`, and unprocessed object placeholders.
- Keep the current unknown-key stripping, but do it before required checks.
- Return field-specific validation errors when possible.
- Add handling for field types that may legitimately submit arrays or booleans.

Tests:

- Required text field missing returns a validation error.
- Required field with empty string returns a validation error.
- Unknown fields are stripped and do not pass as valid required fields.
- Optional fields remain optional.
- Existing update flow for `USER_UPDATE` orders still works with valid data.

## 6. Verification and Cleanup

Before implementation:

- Use Node `>=24.0.0` as required by `package.json`.
- Run `pnpm install` if dependencies are incomplete. Current local `tsc` cannot resolve `p-limit`, which indicates the workspace install is stale or incomplete.

Verification commands:

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm exec eslint src/access/hasRoles.ts
pnpm exec eslint src/services/orderProcessing/orderProcessingService.ts
pnpm exec eslint src/services/payment.service.ts
pnpm exec eslint src/app/_actions/checkoutAction.ts
pnpm exec eslint src/collections/FormSubmission.ts
```

Also fix tooling separately:

- Replace `next lint` scripts because the current `pnpm lint` invokes `next lint`, which fails under the installed Next version.
- Fix the TanStack ESLint plugin config shape in `eslint.config.mjs`; the current config produces a circular-structure ESLint error.

## Rollout Notes

- Deploy order-processing and payment idempotency changes together if possible.
- Watch logs for:
  - duplicate webhook callbacks
  - skipped auto-process attempts
  - rollback failures
  - recharge rows stuck in `PENDING`
- Consider adding database-level constraints or indexes for:
  - `recharges(orderCode, gateway)` already exists and should remain enforced.
  - order status transitions if future workflows add more automated actors.

## Done Criteria

- All six findings have code changes or documented intentional exceptions.
- Focused unit tests cover the changed money/order paths.
- `pnpm test` passes.
- TypeScript passes in a clean install.
- Lint command is updated or a working ESLint command is documented.
- No new orphan checkout records are created on failed checkout attempts.
- Duplicate order processors and duplicate webhooks do not double-complete or double-credit.
