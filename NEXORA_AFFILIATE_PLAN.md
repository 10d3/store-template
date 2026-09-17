# NEXORA AFFILIATE SYSTEM — Implementation Plan (From Scratch)

**Status:** Ready for review — stress-tested, no assumptions taken for granted.
**Stack:** Next.js 15 · Prisma · PostgreSQL · Resend (email) · Inngest (background jobs)

---

## 0. STRESS-TEST — Problems found in the document (resolved below)

Before building, these contradictions and risks in the spec document need answers. I've made calls on each — flag anything you disagree with.

### Problem 1: The commission trigger is vague
The doc says commission fires on "premier paiement trimestriel complet." But how does Nexora *receive* quarterly payments? If it's MonCash/bank transfer, there's no webhook — someone on the team manually confirms receipt. **Our system must support manual payment confirmation by an admin, not just automated Stripe webhooks.** This is the single most important architectural decision.

### Problem 2: The 3-day follow-up window is fragile
Agent sends reminder → client must pay within 3 days → agent gets $10. But:
- What if the payment takes 2 days to process (MonCash can lag)?
- What if the agent reminded on Friday and the client pays Monday (3 calendar days but 1 business day)?
- What about timezone edge cases?

**Decision:** Use **72 hours from reminder timestamp**, not "3 calendar days." Simpler, fairer, no timezone/weekend ambiguity. Admin can override in edge cases.

### Problem 3: The voucher numbering scheme doesn't scale
`NXR-OKAP01-001` uses a city code + sequential ambassador number. But:
- What if you have 100+ ambassadors in Cap-Haïtien? `OKAP99` then what?
- City codes are brittle (what's the code for Jacmel? Gonaïves?).

**Decision:** Use the ambassador's actual 6-char referral code in the voucher number instead. Format: `NXR-{REFCODE}-{001-025}`. The referral code is already unique. No city mapping needed.

### Problem 4: "Client ambassador gets 1 free month" — how?
The doc says client-ambassadors get a free month credited on their next billing cycle. But this system *is* the billing system — who credits it? Is it a Stripe coupon? A manual credit memo?

**Decision:** Store it as a `CreditBalance` on the ambassador's business account. When generating the next invoice, deduct from credit balance first. If Nexora doesn't have automated invoicing yet, store the credit and let admin apply it manually. Don't over-engineer what isn't ready.

### Problem 5: Self-referral check is incomplete
Current code checks `affiliate.userId === userId`. But the doc says you also can't refer a business you *co-own* or are *legal representative* of. There's no way to detect this programmatically.

**Decision:** Keep the digital self-referral check (`userId` match). For co-ownership/legal rep, rely on the manual validation step (admin confirms during installation visit: "Ki moun ki te pale ou de Nexora?"). Don't try to automate what requires human judgment.

### Problem 6: 20-referral cap — per ambassador or per agent too?
The doc says "chaque Ambassadeur" has a 20-referral cap. It doesn't mention agents. Agents are more active — do they have a higher cap? No cap?

**Decision:** Ambassadors: 20 active referrals. Agents: 50 active referrals (configurable). "Active" = statuses `IN_CONTACT` + `IN_TRIAL` + `CONTRACT_SIGNED` (i.e., not yet resolved).

### Problem 7: Attribution cookie vs physical voucher — what wins?
If a prospect clicks Ambassador A's link (cookie set), but then gets a physical voucher from Ambassador B and signs up with B's code — who gets credit?

**Decision:** **Explicit code wins over cookie.** If the prospect types/scans a specific ambassador code during signup, that ambassador gets it, regardless of any prior cookie. Cookie is the fallback only when no explicit code is provided.

---

## 1. DATA MODEL (Prisma Schema)

Everything starts here. This replaces the existing affiliate models entirely.

### 1.1 Core Models

```prisma
// ═══════════════════════════════════════════════════
// AFFILIATE (Ambassador or Agent)
// ═══════════════════════════════════════════════════
model Affiliate {
  id          String          @id @default(cuid())
  userId      String          @unique
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Identity
  referralCode    String      @unique    // 6-char code e.g. "OKAP01"
  tier            AffiliateTier @default(AMBASSADOR)
  status          AffiliateStatus @default(PENDING)

  // Registration data
  phone           String              // WhatsApp number (required)
  ambassadorType  AmbassadorType      // CLIENT or EXTERNAL
  paymentMethod   AffiliatePaymentMethod
  paymentDetails  String?             // MonCash number, PayPal email, etc.

  // Terms acceptance (legal proof)
  termsAcceptedAt     DateTime?
  termsVersion        String?         // e.g. "1.0"
  termsAcceptedIp     String?

  // Stats (denormalized for dashboard speed)
  totalClicks         Int     @default(0)
  totalConversions    Int     @default(0)
  totalEarnings       Float   @default(0)
  availableBalance    Float   @default(0)
  lifetimeEarnings    Float   @default(0)

  // Timestamps
  approvedAt      DateTime?
  promotedToAgentAt DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  referrals       Referral[]
  commissions     Commission[]
  payouts         Payout[]
  clicks          AffiliateClick[]
  ledger          LedgerEntry[]
  voucherBlocks   VoucherBlock[]
  reminders       PaymentReminder[]

  @@index([referralCode])
  @@index([status])
  @@index([tier])
  @@map("affiliates")
}

enum AffiliateTier {
  AMBASSADOR
  AGENT
}

enum AmbassadorType {
  CLIENT    // Existing Nexora customer
  EXTERNAL  // Outside person
}

enum AffiliateStatus {
  PENDING
  ACTIVE
  SUSPENDED
  REJECTED
}

enum AffiliatePaymentMethod {
  MONCASH
  NATCASH
  WISE
  PAYPAL
  BANK_TRANSFER
}
```

```prisma
// ═══════════════════════════════════════════════════
// REFERRAL (A prospect recommended by an affiliate)
// ═══════════════════════════════════════════════════
model Referral {
  id              String          @id @default(cuid())
  affiliateId     String
  affiliate       Affiliate       @relation(fields: [affiliateId], references: [id], onDelete: Cascade)

  // Prospect info
  businessName    String
  businessType    BusinessType
  contactName     String
  contactPhone    String          // WhatsApp number
  contactEmail    String?
  address         String?

  // Plan info
  planInterest    PlanTier?       // Which plan they're interested in
  planSubscribed  PlanTier?       // Which plan they actually signed

  // Tracking
  status          ReferralStatus  @default(IN_CONTACT)
  source          ReferralSource  // LINK, QR_CODE, VOUCHER, PAPER_FORM, VERBAL
  voucherId       String?         // If came from a physical voucher
  voucher         Voucher?        @relation(fields: [voucherId], references: [id])
  ipAddress       String?

  // Key dates
  contactedAt         DateTime    @default(now())  // When Nexora first contacted
  trialStartedAt      DateTime?   // Installation date
  contractSignedAt    DateTime?
  firstPaymentAt      DateTime?   // THE commission trigger
  trialExpiresAt      DateTime?   // 3 months after trialStartedAt
  attributionExpiresAt DateTime   // 30 days from creation — after this, unattributed

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  commissions     Commission[]
  reminders       PaymentReminder[]

  @@index([affiliateId])
  @@index([status])
  @@index([contactPhone])
  @@map("referrals")
}

enum ReferralStatus {
  IN_CONTACT          // Nexora is trying to reach the prospect
  IN_TRIAL            // Installed, using free 3-month trial
  CONTRACT_SIGNED     // Signed but hasn't paid first quarter
  FIRST_PAYMENT       // QUALIFIED — commission earned
  DID_NOT_CONTINUE    // Didn't sign or didn't pay after trial
  REWARD_PAID         // Commission has been disbursed
}

enum ReferralSource {
  LINK          // Digital link click
  QR_CODE       // QR code scan (digital)
  VOUCHER       // Physical voucher
  PAPER_FORM    // Paper form transcribed
  VERBAL        // Manual attribution from installation visit
}

enum BusinessType {
  RESTAURANT
  BOUTIQUE
  PHARMACY
  HOTEL
  SALON
  DEPOT
  GAS_STATION
  SCHOOL
  OTHER
}

enum PlanTier {
  SOLO        // $30/month ($90/quarter)
  EQUIPE      // $45/month ($135/quarter)
  LIDE        // $90/month ($270/quarter)
}
```

```prisma
// ═══════════════════════════════════════════════════
// COMMISSION
// ═══════════════════════════════════════════════════
model Commission {
  id              String              @id @default(cuid())
  affiliateId     String
  affiliate       Affiliate           @relation(fields: [affiliateId], references: [id], onDelete: Cascade)
  referralId      String
  referral        Referral            @relation(fields: [referralId], references: [id], onDelete: Cascade)

  type            CommissionType
  amount          Float               // $25, $50, $10, or $0 (free month)
  status          CommissionStatus    @default(PENDING)

  // For FREE_MONTH type
  freeMonthApplied Boolean           @default(false)

  // Payout link
  payoutId        String?
  payout          Payout?             @relation(fields: [payoutId], references: [id])

  // Metadata
  description     String?
  notes           String?

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  validatedAt     DateTime?           // When admin validated
  paidAt          DateTime?

  @@index([affiliateId])
  @@index([referralId])
  @@index([status])
  @@map("commissions")
}

enum CommissionType {
  RECRUITMENT           // $25 or $50 per qualified referral
  FOLLOW_UP             // $10 per quarterly payment collected by agent
  MONTHLY_BONUS         // $50 if agent hits 5+ clients in a month
  FREE_MONTH            // 1 free month for client-ambassadors
}

enum CommissionStatus {
  PENDING       // Created, awaiting admin validation
  VALIDATED     // Admin confirmed, ready to pay
  PAID          // Money sent
  CANCELLED     // Voided (fraud, refund, etc.)
  SUSPENDED     // On hold (e.g. 30-day refund window)
}
```

```prisma
// ═══════════════════════════════════════════════════
// VOUCHER SYSTEM
// ═══════════════════════════════════════════════════
model VoucherBlock {
  id              String      @id @default(cuid())
  affiliateId     String
  affiliate       Affiliate   @relation(fields: [affiliateId], references: [id], onDelete: Cascade)

  blockNumber     Int         // Sequential per affiliate (1, 2, 3...)
  rangeStart      Int         // 1
  rangeEnd        Int         // 25
  isPaid          Boolean     // false = free first block, true = $10 purchase
  isActive        Boolean     @default(true)   // false = entire block deactivated (lost/fraud)

  assignedAt      DateTime    @default(now())

  vouchers        Voucher[]

  @@index([affiliateId])
  @@map("voucher_blocks")
}

model Voucher {
  id              String        @id @default(cuid())
  blockId         String
  block           VoucherBlock  @relation(fields: [blockId], references: [id], onDelete: Cascade)

  // Number format: NXR-{REFCODE}-{SEQ}  e.g. NXR-OKAP01-003
  voucherNumber   String        @unique
  sequenceNumber  Int           // 1-25 within the block

  isUsed          Boolean       @default(false)
  usedAt          DateTime?

  referrals       Referral[]    // The referral created from this voucher

  @@index([voucherNumber])
  @@index([blockId])
  @@map("vouchers")
}
```

```prisma
// ═══════════════════════════════════════════════════
// PAYMENT REMINDER (Agent follow-up tracking)
// ═══════════════════════════════════════════════════
model PaymentReminder {
  id              String      @id @default(cuid())
  affiliateId     String
  affiliate       Affiliate   @relation(fields: [affiliateId], references: [id], onDelete: Cascade)
  referralId      String
  referral        Referral    @relation(fields: [referralId], references: [id], onDelete: Cascade)

  // The quarterly payment this reminder is for
  quarterDueDate  DateTime    // The date the payment is due
  quarterAmount   Float       // Amount due (in USD)

  // Reminder tracking
  sentAt          DateTime    @default(now())  // When agent clicked "Remind"
  method          String      @default("EMAIL") // EMAIL (for now, WHATSAPP later)

  // Result
  paymentReceivedAt   DateTime?   // When client actually paid
  commissionEarned    Boolean     @default(false)  // Did this generate a $10 commission?
  commissionId        String?     // Link to the commission if earned

  @@index([affiliateId])
  @@index([referralId])
  @@index([sentAt])
  @@map("payment_reminders")
}
```

```prisma
// ═══════════════════════════════════════════════════
// CLICKS, LEDGER, PAYOUTS (kept from existing, adjusted)
// ═══════════════════════════════════════════════════
model AffiliateClick {
  id              String      @id @default(cuid())
  affiliateId     String
  affiliate       Affiliate   @relation(fields: [affiliateId], references: [id], onDelete: Cascade)
  ipAddress       String?
  userAgent       String?
  referer         String?
  landingPage     String?
  converted       Boolean     @default(false)
  convertedAt     DateTime?
  createdAt       DateTime    @default(now())

  @@index([affiliateId])
  @@index([ipAddress, createdAt])
  @@map("affiliate_clicks")
}

model Payout {
  id              String        @id @default(cuid())
  affiliateId     String
  affiliate       Affiliate     @relation(fields: [affiliateId], references: [id], onDelete: Cascade)
  amount          Float
  method          AffiliatePaymentMethod
  status          PayoutStatus  @default(PENDING)
  transactionRef  String?       // MonCash/Natcash ref, PayPal ID, etc.
  notes           String?
  failureReason   String?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  processedAt     DateTime?     // When admin initiated
  completedAt     DateTime?     // When confirmed received

  commissions     Commission[]

  @@index([affiliateId])
  @@index([status])
  @@map("payouts")
}

model LedgerEntry {
  id              String      @id @default(cuid())
  affiliateId     String
  affiliate       Affiliate   @relation(fields: [affiliateId], references: [id])
  type            LedgerType
  amount          Float
  referenceType   String      // "COMMISSION", "PAYOUT", "ADJUSTMENT"
  referenceId     String
  description     String?
  createdAt       DateTime    @default(now())

  @@index([affiliateId])
  @@index([referenceType, referenceId])
  @@map("ledger_entries")
}

enum PayoutStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

enum LedgerType {
  CREDIT          // Commission earned
  DEBIT           // Payout sent or adjustment
  PAYOUT_HOLD     // Balance reserved for pending payout
  PAYOUT_SENT     // Payout confirmed
}
```

---

## 2. BACKEND — API Routes & Server Actions

### 2.1 Registration & Approval

| Endpoint / Action | What it does | Notes |
|---|---|---|
| `POST /api/affiliate/register` | Submit ambassador application | Collects: name, phone, type (CLIENT/EXTERNAL), payment method, terms acceptance. Generates 6-char referral code. Sets status=PENDING |
| `POST /api/admin/affiliate/approve` | Admin approves application | Sets status=ACTIVE, sets `approvedAt`, generates first free voucher block (25 vouchers), sends welcome email via Resend |
| `POST /api/admin/affiliate/reject` | Admin rejects application | Sets status=REJECTED, sends rejection email |
| `POST /api/admin/affiliate/suspend` | Admin suspends affiliate | Sets status=SUSPENDED, deactivates all voucher blocks |

### 2.2 Referral Lifecycle

| Action | What it does | Trigger |
|---|---|---|
| `createReferral()` | Creates a new referral record | Prospect submits trial request form (online or transcribed from paper) |
| `advanceToTrial()` | Status → IN_TRIAL, sets `trialStartedAt` and `trialExpiresAt` (+90 days) | Admin confirms installation done |
| `advanceToContract()` | Status → CONTRACT_SIGNED, sets `contractSignedAt`, records `planSubscribed` | Admin confirms contract signed |
| `confirmFirstPayment()` | Status → FIRST_PAYMENT, sets `firstPaymentAt`, **creates commission** | **Admin manually confirms payment received** |
| `markDidNotContinue()` | Status → DID_NOT_CONTINUE | Admin marks prospect as churned |
| `markRewardPaid()` | Status → REWARD_PAID | After payout is confirmed |

> [!IMPORTANT]
> **`confirmFirstPayment()` is the most critical function in the entire system.** This is where the commission is created. It must:
> 1. Verify the referral is in `CONTRACT_SIGNED` status
> 2. Determine commission amount based on `planSubscribed` ($25 for SOLO/EQUIPE, $50 for LIDE)
> 3. Check if affiliate is CLIENT type → create FREE_MONTH commission instead
> 4. Create the Commission record with status=PENDING (admin validates before payout)
> 5. Update affiliate stats (totalConversions, totalEarnings, availableBalance)
> 6. Create a LedgerEntry (CREDIT)
> 7. Send notification email to the affiliate

### 2.3 Commission Engine

| Function | Logic |
|---|---|
| `calculateRecruitmentCommission(planTier, ambassadorType)` | EXTERNAL + SOLO/EQUIPE → $25. EXTERNAL + LIDE → $50. CLIENT + any → FREE_MONTH (amount=$0, freeMonthApplied tracking) |
| `processFollowUpCommission(reminderId)` | Check: was payment received within 72 hours of reminder `sentAt`? If yes → create $10 FOLLOW_UP commission |
| `processMonthlyBonus(affiliateId, month, year)` | Count FIRST_PAYMENT referrals for this affiliate in this calendar month. If ≥ 5 → create $50 MONTHLY_BONUS commission |

### 2.4 Voucher System

| Action | What it does |
|---|---|
| `generateVoucherBlock(affiliateId, isPaid)` | Creates VoucherBlock + 25 Voucher records. Number format: `NXR-{refCode}-{seq}` |
| `useVoucher(voucherNumber)` | Marks voucher as used, links to referral. Returns error if already used or block deactivated |
| `deactivateBlock(blockId)` | Sets `isActive=false` on block. All vouchers in block become unusable |
| `GET /api/voucher/verify/:number` | Public endpoint — checks if a voucher number is valid and unused |

### 2.5 Agent Follow-Up System

| Action | What it does |
|---|---|
| `getClientsToFollow(agentId)` | Returns all referrals in FIRST_PAYMENT status for this agent, with next payment due dates |
| `sendReminder(agentId, referralId)` | Creates PaymentReminder record (timestamp = now), sends email to client via Resend |
| `confirmQuarterlyPayment(referralId, amount)` | Admin confirms receipt. Checks for any PaymentReminder within last 72h → creates FOLLOW_UP commission if found |

### 2.6 Agent Promotion

| Action | What it does |
|---|---|
| `checkPromotionEligibility(affiliateId)` | Count referrals that reached FIRST_PAYMENT status this calendar month. If ≥ 5, flag as eligible |
| `promoteToAgent(affiliateId)` | Sets `tier=AGENT`, sets `promotedToAgentAt`, sends promotion email. **Not automatic — admin must confirm.** |

### 2.7 Payouts

| Action | What it does |
|---|---|
| `requestPayout(affiliateId)` | Admin initiates. Collects all VALIDATED commissions. Creates Payout record. Creates PAYOUT_HOLD ledger entry |
| `confirmPayout(payoutId, transactionRef)` | Admin confirms money was sent (MonCash ref, etc.). Updates payout to COMPLETED. Creates PAYOUT_SENT ledger entry. Updates `availableBalance` |
| `failPayout(payoutId, reason)` | Reverses the hold. Commissions go back to VALIDATED |

> [!WARNING]
> **Payouts are MANUAL.** Unlike the old Stripe Connect flow, MonCash/Natcash payouts require a human to send the money and then confirm it in the system. The system tracks and audits — it does not execute the transfer.

### 2.8 Attribution & Tracking

| Action | What it does |
|---|---|
| `trackClick(referralCode, ip, userAgent)` | Records click. Sets 30-day attribution cookie on response |
| `resolveAttribution(referralCode?, cookieCode?)` | **Explicit code wins** over cookie. If both present, use `referralCode`. If only cookie, use cookie if < 30 days old |
| `checkReferralCap(affiliateId)` | Returns count of active referrals (IN_CONTACT + IN_TRIAL + CONTRACT_SIGNED). Blocks new referrals if at cap (20 for ambassador, 50 for agent) |
| `manualAttribution(referralId, affiliateId)` | Admin assigns a verbal referral to an affiliate after installation visit |

### 2.9 Conflict Resolution

| Action | What it does |
|---|---|
| `detectConflict(contactPhone)` | On referral creation, check if this phone number already exists as a referral for a *different* affiliate. If so, flag both |
| `resolveConflict(referralId, resolution)` | Admin picks: FIRST_CONTACT (keep original), REASSIGN (give to second), or SPLIT (create half-commissions for both) |

---

## 3. INNGEST BACKGROUND JOBS

| Job | Schedule | Logic |
|---|---|---|
| `affiliate/check-monthly-bonus` | Cron: `0 0 1 * *` (1st of each month) | For each active agent: count qualified referrals from previous month. If ≥ 5, create MONTHLY_BONUS commission |
| `affiliate/expire-attributions` | Cron: `0 6 * * *` (daily 6 AM) | Find all referrals where `attributionExpiresAt < now()` AND status = IN_CONTACT → set status = DID_NOT_CONTINUE |
| `affiliate/trial-expiry-check` | Cron: `0 6 * * *` (daily 6 AM) | Find referrals where `trialExpiresAt < now()` AND status = IN_TRIAL → alert admin (don't auto-close — admin decides) |
| `affiliate/payment-due-reminder` | Cron: `0 8 * * *` (daily 8 AM) | For each agent: find clients whose next quarterly payment is due in ≤ 15 days. Send email notification to agent |
| `affiliate/promotion-check` | Cron: `0 0 * * *` (daily midnight) | For each ambassador: if they hit 5 qualified referrals this calendar month, send internal alert to admin team |

---

## 4. EMAIL TEMPLATES (Resend)

| Email | Recipient | Trigger |
|---|---|---|
| `welcome-ambassador` | New affiliate | On approval. Contains: referral code, dashboard link, QR code image (attached or inline) |
| `application-rejected` | Rejected applicant | On rejection |
| `prospect-registered` | Affiliate | When a prospect is created via their code |
| `prospect-in-trial` | Affiliate | When prospect moves to IN_TRIAL |
| `prospect-contract-signed` | Affiliate | When prospect moves to CONTRACT_SIGNED |
| `reward-available` | Affiliate | When commission is created (FIRST_PAYMENT confirmed) |
| `payout-sent` | Affiliate | When payout is confirmed |
| `agent-payment-reminder` | Agent | 15 days before client's quarterly payment due |
| `agent-promotion-invite` | Ambassador | When eligible for agent promotion |
| `client-payment-reminder` | Client (prospect) | Sent by agent via dashboard "Remind" button |
| `monthly-summary` | All active affiliates | End of month: stats, earnings, referral counts |

---

## 5. FRONTEND — Pages & Components

### 5.1 Public Pages

| Page | Route | Purpose |
|---|---|---|
| Ambassador recruitment | `/ambassadeur` | French/Kreyòl landing page explaining the program. Benefits, 3-step process, reward table, FAQ, application form |
| Trial request form | `/essai` | Public form for prospects. Accepts `?ref=CODE` param. Fields: business name, type, contact, phone, address, plan interest |

### 5.2 Ambassador/Agent Dashboard (`/ambassadeur/dashboard`)

| Section | What it shows |
|---|---|
| **Overview** | Stats cards: total referrals, active referrals, conversion rate, available balance, lifetime earnings |
| **My Referral Tools** | Referral link (copy button), QR code (download PNG/SVG), "Share via Email" button with pre-filled template |
| **My Referrals** | Table with all referrals + their 6-stage status. Filters by status. Shows dates for each stage |
| **My Earnings** | Commission history (type, amount, status, date). Available balance. Payout history |
| **Voucher Orders** | Active voucher blocks. Count of used/unused. Button to request more ($10 for ambassadors, free for agents) |
| **Paper Form Entry** | Form to transcribe a signed paper form into the system. Pre-fills ambassador code |
| **[AGENT ONLY] Clients to Follow** | Table of active clients with: business name, plan, next payment date, amount due, days until due, "Send Reminder" button |

### 5.3 Admin Pages (`/admin/affiliation`)

| Page | Purpose |
|---|---|
| **Applications** | List of PENDING affiliates. Approve/Reject actions |
| **Affiliates** | All affiliates with filters (tier, status). View details, edit, suspend |
| **Referrals** | All referrals across all affiliates. Advance status buttons. Manual attribution. Conflict flags |
| **Confirm Payment** | List of referrals in CONTRACT_SIGNED status. "Confirm First Payment" button per row. For FIRST_PAYMENT clients: "Confirm Quarterly Payment" for ongoing payments |
| **Commissions** | All commissions. Validate (PENDING → VALIDATED). View by affiliate. Bulk validate |
| **Payouts** | Initiate payout for an affiliate. Confirm payout (enter MonCash/Natcash ref). Failed payout handling |
| **Vouchers** | View all blocks. Deactivate lost blocks. Track usage stats |
| **Conflicts** | Flagged duplicate referrals. Resolution actions (first contact / reassign / split) |

---

## 6. WHAT TO NOT BUILD AT LAUNCH

These are in the document but should be deferred. They add complexity without adding value in months 1–3:

| Feature | Why defer |
|---|---|
| **Stripe Connect payouts** | Nexora's affiliates use MonCash/Natcash. Stripe Connect is irrelevant for this market. Manual payout tracking is fine at ≤20 affiliates |
| **Cookie-based 30-day attribution** | At launch, most referrals are physical (voucher, verbal). Build the cookie when digital acquisition becomes significant |
| **Automated self-referral detection beyond userId** | Co-ownership detection requires business registry checks. Use manual validation during installation visit |
| **QR code on voucher auto-printing** | Generate QR codes digitally for download. Physical printing is handled by the print shop, not the software |
| **Real-time dashboard websockets** | Regular page refreshes or polling every 30s is fine at this scale. Don't over-engineer |
| **Voucher purchase payment flow** | At ≤20 ambassadors, handle $10 voucher purchases manually (MonCash payment + admin confirms). Don't build a whole checkout for this |

---

## 7. PHASES & EXECUTION ORDER

### Phase 1 — Foundation (Days 1–3)
- [ ] Write Prisma schema (all models above)
- [ ] Run migration
- [ ] Referral code generator (6-char, city-prefix format)
- [ ] Voucher block + voucher generator

### Phase 2 — Registration & Admin Core (Days 4–7)
- [ ] Ambassador application form + server action
- [ ] Admin approve/reject/suspend actions
- [ ] Welcome email template (Resend)
- [ ] Rejection email template
- [ ] Admin affiliates list page

### Phase 3 — Referral Lifecycle (Days 8–12)
- [ ] Trial request form (`/essai?ref=CODE`)
- [ ] Referral creation with attribution resolution
- [ ] Referral cap enforcement (20 / 50)
- [ ] Admin referral management page (advance status buttons)
- [ ] `confirmFirstPayment()` — **the commission trigger**
- [ ] Commission calculation (flat $25/$50/free month)
- [ ] Ledger entries on commission creation
- [ ] Status notification emails (4 templates)
- [ ] Conflict detection + admin resolution UI

### Phase 4 — Dashboard & Agent Features (Days 13–17)
- [ ] Ambassador dashboard (overview, tools, referrals, earnings)
- [ ] QR code generation (use `qrcode` npm package)
- [ ] Paper form transcription UI
- [ ] Agent "Clients to Follow" section
- [ ] Agent "Send Reminder" action + email template
- [ ] Agent follow-up commission (72-hour window check)
- [ ] Agent promotion check + admin UI
- [ ] Public recruitment page (`/ambassadeur`) in French/Kreyòl

### Phase 5 — Payouts & Automation (Days 18–21)
- [ ] Manual payout flow (admin initiates, confirms with transaction ref)
- [ ] Payout confirmation + ledger finalization
- [ ] Inngest: monthly bonus cron job
- [ ] Inngest: attribution expiry cron
- [ ] Inngest: trial expiry alert cron
- [ ] Inngest: payment due reminder cron (15 days before)
- [ ] Inngest: promotion eligibility check
- [ ] Monthly summary email

---

## 8. RISK REGISTER

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Admin forgets to confirm a payment → affiliate never gets commission | High | High | Inngest daily job flags CONTRACT_SIGNED referrals older than 7 days with no status change. Email alert to admin |
| Ambassador creates fake prospects to get vouchers used and generate activity | Medium | Medium | Commission only on FIRST_PAYMENT (real money from real business). No incentive to fake until real payment |
| Two admins confirm the same payment simultaneously | Low | High | Wrap `confirmFirstPayment()` in a Prisma transaction with optimistic locking on referral status |
| Affiliate disputes commission amount | Medium | Medium | Ledger is immutable append-only. Every credit/debit has a reference. Full audit trail |
| Scale beyond 50 affiliates overwhelms manual payout process | Medium | Medium | Cross that bridge when you get there. If you reach 50 active affiliates, the revenue justifies building automated MonCash API integration |
