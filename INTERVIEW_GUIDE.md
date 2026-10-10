# CloudMerge: Senior-Level Technical Interview Guide 🎯

> **A comprehensive cheat sheet covering System Design, Algorithms (Bin-Packing), Concurrency, Security, and Production War Stories for CloudMerge.**

---

## 📌 Elevator Pitch (30-Second Summary)

> *"CloudMerge is a virtual cloud file system that pools multiple fragmented Google Drive accounts into a single, high-capacity virtual drive. It solves the 15 GB quota limitation by applying the **Strategy Pattern** to the **Online Bin-Packing Problem**, routing files using **Worst-Fit** and **Best-Fit** allocation heuristics with automatic failover on cloud provider quota limits. The backend uses Node.js, Express, TypeScript, and Prisma with AES-256-GCM token encryption, while the frontend is built with React 19, Vite, and NextUI."*

---

## 🏛️ System Architecture

```text
User / Browser (React 19 + NextUI + Vite)
         │
         │ REST API (Bearer JWT with Deduped Refresh Mutex)
         ▼
Express + TypeScript Backend
         ├── Auth Service (Bcrypt + Single-Flight Token Rotation)
         ├── Upload Service ──► Strategy Selector (Worst-Fit / Best-Fit)
         │                           │
         ├── File / Folder Service   ▼
         │                 Google Drive Client (AES-256-GCM Decrypted Tokens)
         ▼                           │
Prisma ORM (MySQL on port 3306)      ▼
                              Google Drive APIs
```

---

## 🧠 Part 1: Algorithmic Deep-Dive (Bin-Packing)

### Q1: What algorithm decides which drive receives an upload?
* **Concept**: **Online Bin-Packing Heuristics** using the **GoF Strategy Pattern**.
* **Current Implementation (`mostFreeSpaceStrategy`)**:
  * **Algorithm**: **Worst-Fit** (Maximum Remaining Capacity).
  * **Code Reference**: [`accountPicker.strategy.ts`](backend/src/strategies/accountPicker.strategy.ts).
  * **How It Works**:
    1. Scans all linked accounts and computes $\text{freeBytes} = \text{quotaTotal} - \text{quotaUsed}$.
    2. Sorts drives descending by free capacity.
    3. Filters out any accounts where $\text{freeBytes} < \text{fileSize}$.
    4. Routes the upload to candidate #0 (highest free space).

### Q2: What are the trade-offs of Worst-Fit vs Best-Fit?
* **Worst-Fit (Max Free Space First)**:
  * *Advantage*: Balances wear and storage utilization across accounts. Minimizes chance of an account hitting 100% capacity quickly.
  * *Disadvantage*: Fragments storage across all drives.
* **Best-Fit (Slack Minimization)**:
  * *Formula*: $\min(\text{freeBytes} - \text{fileSizeBytes}) \ge 0$.
  * *Advantage*: Packs files tightly into nearly-full accounts first, preserving large, empty accounts for future giant files.
  * *Disadvantage*: Drives frequently hover close to 100%, increasing quota-exceeded collision risk.
* **Senior Talking Point (Adaptive Hybrid)**:
  > *"If I were scaling this to production, I'd use an **Adaptive Router**: files under 250 MB use **Best-Fit** to pack the cracks, while files over 1 GB switch to **Worst-Fit** to preserve breathing room."*

### Q3: What happens if a file is larger than any single drive (e.g. 10 GB file, two 6 GB drives)?
* **Honest Answer**: *"In the current design, single files are atomic to one provider, so a 10 GB file fails with a quota conflict even if total pooled capacity is 12 GB."*
* **Architecture Solution (Chunked Striping / Virtual RAID-0)**:
  1. **Chunking**: Split incoming stream into 250 MB chunks.
  2. **Distributed Storage**: Upload Chunk 1–24 to Drive A and Chunk 25–40 to Drive B.
  3. **Manifest Indexing**: Store a file manifest in MySQL recording `[chunkIndex, driveId, remoteFileId]`.
  4. **Multiplexed Read**: Download chunks in parallel and pipe them to the client sequentially.

---

## ⚡ Part 2: Concurrency & Production War Stories

### Q4: Tell me about the hardest race condition you diagnosed and resolved.
* **The Problem (Concurrent Refresh Collisions & MySQL Error 1020)**:
  * When the frontend dashboard mounts, multiple components (`QuotaView`, `FilesView`, `SettingsView`) make simultaneous authenticated requests.
  * If the access token expires, all three fire concurrent requests to `POST /auth/refresh`.
  * Because the backend rotates refresh tokens on every call, the first request generates a new hash and invalidates the old one. The second and third requests collide at the database layer, triggering:
    `MysqlError 1020: Record has changed since last read in table 'User'; try restarting transaction`
  * This corrupted user sessions and caused intermittent forced logouts.
* **The Two-Layer Resolution**:
  1. **Client-Side Single-Flight Promise Deduplication (`client.ts`)**:
     Created a singleton `refreshPromise`. If a refresh is already in-flight, all subsequent 401s attach to the existing promise rather than spamming duplicate requests.
  2. **Database-Level Retry Mechanism (`user.repository.ts`)**:
     Wrapped `prisma.user.update` with an exponential backoff retry loop for transient MySQL concurrency lock conflicts (Error 1020 / deadlocks).

---

## 🛡️ Part 3: Security & Cryptography

### Q5: How do you protect user OAuth access and refresh tokens?
* **Encryption standard**: **AES-256-GCM** (Galois/Counter Mode).
* **Why AES-GCM over CBC**:
  * GCM provides **Authenticated Encryption with Associated Data (AEAD)**.
  * It includes an authentication tag (`authTag`) that validates data integrity and authenticity. If ciphertext or initialization vector (IV) is modified by an attacker, decryption fails before execution.
* **Zero-Plaintext In Database**:
  * Even if the MySQL database is breached or dumped, Google OAuth tokens cannot be decrypted without the host machine's `TOKEN_ENCRYPTION_KEY`.

---

## 🚀 Part 4: Resilience & Cloud Quotas

### Q6: Google Drive quota sync is eventually consistent. How do you handle quota errors mid-upload?
* **Layer 1: Proactive Strategy Filter**:
  * Filters out accounts known to have insufficient space based on cached DB quotas.
* **Layer 2: Reactive Automatic Failover Loop (`UploadService`)**:
  * If Google Drive returns HTTP `403` or `507` with `storageQuotaExceeded` or `quotaExceeded`:
  * The service catches the error without terminating the user's request.
  * It immediately advances to the next candidate drive in the ranked array and retries the upload.

---

## 💡 Quick Interview Cheat Sheet (Key Terms)

| Topic | Key Term | Explanation |
| :--- | :--- | :--- |
| **Algorithm** | Online Bin-Packing | Packing items of unknown future size into limited containers. |
| **Design Pattern** | Strategy Pattern | Swappable routing algorithms (`Worst-Fit`, `Best-Fit`) behind an interface. |
| **Security** | AES-256-GCM (AEAD) | Symmetric cipher with authenticated verification tags. |
| **Concurrency** | Single-Flight Request Dedup | Sharing one in-flight refresh promise across concurrent API calls. |
| **Resilience** | Fallback Failover Loop | Catching HTTP 403 quota errors and cascading to the next account. |
| **Frontend** | Dark NextUI + Tailwind | Unified modern UI with reactive context providers and zero style leaks. |
