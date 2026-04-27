# 2026-04-19 Email delivery and admin preview design

## Goal
Add user-facing order completion emails, preserve audit state for top-up form submissions when orders complete, and provide an admin-only interface to compose and preview both transactional and promotional email templates before sending.

## Scope
- Send a transactional email to the ordering user when an order first transitions to `COMPLETED`.
- If the completed order has an attached `formSubmission`, store completion audit metadata on that submission without changing the original submitted answers.
- Provide an admin-only email preview/setup UI for:
  - order completion email preview with sample order data
  - promotional campaign composer with live preview
- Keep actual promotional sends behind an explicit admin action.

## Non-goals
- Building a full marketing automation platform
- Automatic segmentation beyond a simple initial recipient filter
- Replacing Novu or Discord notifications

## Existing system context
- Order completion currently happens in both manual order updates and auto-processing paths in `src/collections/Orders/index.ts` and `src/services/orderProcessing/orderProcessingService.ts`.
- Reusable email primitives and templates already exist in `src/services/email/service.ts` and `src/services/email/templates.ts`.
- Top-up and other order-linked forms are stored in `form-submissions`, with user answers inside `submissionData`.
- `submissionData` is validated against form field names, so completion audit metadata must not be stored inside `submissionData`.

## Recommended architecture

### 1. Centralize transactional order-complete email sending
Create a single email orchestration helper in `src/services/email` for order completion. It should:
- accept a populated order
- extract the recipient email/name from `orderedBy`
- derive product name, quantity, order URL, and delivery lines
- render the existing completion template using real order data
- send through the existing Resend-backed provider and resilient email service

All order-completion paths should call this helper so manual completion and auto-processing produce the same user email.

### 2. Add form submission completion audit fields
Extend `form-submissions` with dedicated top-level fields for completion audit metadata, such as:
- `orderCompletedAt` (`date`)
- `orderStatusAtCompletion` (`text` or `select`, initially storing `COMPLETED`)
- optionally `completedOrder` (`relationship` to `orders`) if the relation improves admin traceability

These fields live beside `submissionData`, not inside it, so the original form answers remain intact and validation behavior is unchanged.

### 3. Add admin-only email setup and preview surface
Create an admin-facing UI for two workflows:
- **Transactional preview**: render the order-complete email using sample or selected order data
- **Promotional composer**: let admins define preview text, subject, deal cards, and CTA links, then preview the resulting email before sending

The preview surface must reuse the same template functions used in actual delivery so preview output matches sent emails.

### 4. Add explicit promotional send workflow
Promotional emails should be sent only from an explicit admin action. The first version should:
- be admin-only
- collect template inputs and intended recipients
- generate messages via the promotional template helper
- send only after admin confirmation
- include unsubscribe links in every promotional email

## UI design
Use a compact, trustworthy admin interface rather than a marketing-style landing page.

### Email setup page sections
1. **Template switcher**
   - Order Complete
   - Promotional Deals
2. **Input panel**
   - fields for the selected template
   - sample order selector or mock data controls for transactional preview
   - repeating deal-card inputs for promotional preview
3. **Preview panel**
   - HTML preview in an isolated frame/container
   - plain-text preview tab
4. **Send controls**
   - disabled for transactional preview-only mode
   - explicit send/confirm actions for promotional emails

### Aesthetic direction
A "commerce control room" style:
- dense but readable layout
- strong information hierarchy
- restrained visual design suited to ops/admin usage
- preview area emphasized as the canonical output

## Data flow

### Order completion flow
1. Order transitions to `COMPLETED`
2. Shared completion orchestration runs
3. If `formSubmission` exists, update audit metadata on the related `form-submissions` record
4. Build transactional email payload from the completed order
5. Send email via resilient email service
6. Log success/failure without blocking the order completion itself

### Promotional preview/send flow
1. Admin opens email setup page
2. Admin selects promotional template and enters content
3. UI requests rendered preview from shared template layer
4. On explicit send, backend resolves recipients and sends promotional emails
5. Delivery results are reported back to admin

## Error handling
- Order completion must not fail solely because email delivery fails.
- Email delivery failures should be logged and queued through the existing retry mechanism when available.
- Form submission audit update should be best-effort but observable; if it fails, log with order id and form submission id.
- Promotional send must validate admin permissions, required fields, CTA URLs, and unsubscribe URL before dispatch.

## Security and permissions
- Transactional emails send automatically only for real order completion events.
- Promotional composer, preview, and send actions are admin-only.
- Preview rendering should escape untrusted content through existing template escaping.
- Sending promotional emails requires a deliberate admin action; preview alone must not send.

## Testing
- Unit tests for email template rendering with real-looking order and promotional inputs
- Unit tests for completion orchestration covering:
  - sends on first completion
  - skips when user email is missing
  - updates form submission audit fields when present
- Permission tests for admin-only promotional actions
- UI tests for preview rendering if this surface is added inside Payload admin/components

## Implementation boundaries
This design is intentionally scoped to one implementation cycle:
- reuse current email template/service foundations
- add audit metadata without redesigning forms
- add preview/setup UI without introducing campaign automation or scheduling

## Open decisions resolved
- Campaign capability is included, but only as admin-triggered sends
- Top-up/order-linked form submissions are updated with completion audit metadata only
- Admin preview/setup covers both order completion and promotional templates
