# CloudMerge — Interview / Class Presentation Script

**Target length:** 3–5 minutes  
**Tone:** Confident, technical, concise

---

## 1. Hook (15 sec)

> "What if you could treat all your Google Drive accounts — personal, work, school — as **one big drive**? No more 'storage full' errors, no more manual juggling. That's CloudMerge."

---

## 2. Problem (30 sec)

> "Most of us have 2–3 Google accounts. Each gives 15 GB free. But they're siloed. You hit quota on one while another sits empty. Existing tools only sync or migrate — they don't **unify**."

---

## 3. Solution Demo (60 sec)

> "CloudMerge lets you **connect multiple Google accounts**, then upload files through a single interface. Behind the scenes it **picks the account with the most free space**, and if that account fills up mid-upload, it **automatically fails over** to the next one. You see one file list. You manage one quota view."

---

## 4. Architecture (60 sec)

> "**Backend**: Express + TypeScript + Prisma + MySQL.  
> **Auth**: JWT access tokens (short-lived) + bcrypt-hashed refresh tokens with rotation — zero plaintext tokens in DB.  
> **Google OAuth**: Connect accounts via Google's flow; access/refresh tokens **encrypted at rest** (AES-GCM).  
> **Core innovation**: **Strategy pattern** for account selection. `mostFreeSpaceStrategy` ranks accounts by cached quota, but the upload service **validates live** via Google API — on `storageQuotaExceeded` it retries the next account. Swappable strategy = easy to add 'round-robin', 'cost-aware', etc.  
> **Frontend**: React 19 + Vite, typed API client, components for upload, file tree, quota dashboard."

---

## 5. Hard Technical Decisions (45 sec)

> - **Encrypted tokens at rest** — even if DB leaks, Google credentials stay safe.
> - **Refresh token rotation + bcrypt** — stolen refresh token = useless after one use.
> - **Quota cache + live fallback** — DB quota is stale by design; the 403/507 retry loop makes it correct.
> - **Strategy injection** — `UploadService` doesn't know *how* to pick, just *that* it gets a ranked list. Testable, extensible.

---

## 6. What I'd Build Next (30 sec)

> - Background quota sync worker (cron) to keep cache fresh.
> - Cross-account search & deduplication.
> - Shareable links that work across accounts.
> - Mobile app with offline queue.

---

## 7. Close (15 sec)

> "CloudMerge turns fragmented free storage into a **single elastic volume** — with zero trust on the server, and a clean extension point for any routing logic. Thanks."

---

## Cheat Sheet for Q&A

| Question | Your Answer |
|---|---|
| "How do you handle token expiry?" | Access tokens refreshed via Google's OAuth using the encrypted refresh token; retry logic in `GoogleDriveClient`. |
| "What if two uploads race on the same account?" | Quota cache is eventually consistent; the live 403/507 check in `upload.service.ts:53` is the source of truth. |
| "Why MySQL over Postgres?" | (Honest answer: familiarity / free tier / Prisma support — pick yours.) |
| "How do you test the failover?" | Unit test `UploadService` with a mock `AccountPickerStrategy` that returns accounts failing in sequence; assert second succeeds. |
| "Scale?" | Stateless API — horizontal scale behind LB. Quota sync can be a separate worker. |

---

## Key File References (for follow-up)

- **Account selection strategy**: `backend/src/strategies/accountPicker.strategy.ts`
- **Upload with failover**: `backend/src/modules/uploads/upload.service.ts:29-61`
- **Token encryption**: `backend/src/common/utils/accountTokens.ts`
- **Auth with refresh rotation**: `backend/src/modules/auth/auth.service.ts:47-62`
- **Prisma schema**: `backend/prisma/schema.prisma`
- **Frontend upload component**: `frontend/src/components/UploadPanel.tsx`

---

## Practice Tips

1. **Time yourself** — hit 3:30 to 4:30 consistently
2. **Own the "Hard Technical Decisions"** — that's where senior signal lives
3. **Have the Q&A cheat sheet** on a second screen or printed
4. **Demo flow**: Login → Connect 2 Google accounts → Upload 200MB file → Show quota view → Disconnect one account → Upload again → Show failover
5. **If asked for code walkthrough**: Open `upload.service.ts` and `accountPicker.strategy.ts` — 2 files tell the whole story