## 🪄 1. Overview

**Contxt** is a **modular RAG (Retrieval-Augmented Generation)** system that allows users and developers to easily build, manage, and integrate custom knowledge bases powered by embeddings.
Instead of rebuilding RAG logic for every project, Contxt provides a **plug-and-play platform** to handle data ingestion, embedding management, query retrieval, and evaluation through an intuitive **web playground** and **API access**.

Contxt enables individuals, teams, and products to:

* Upload or stream their knowledge data (docs, FAQs, APIs, etc.)
* Vectorize it efficiently using **Gemini embeddings**
* Manage embeddings incrementally (without full re-embedding)
* Experiment and test through a **Playground UI**
* Integrate seamlessly via **API keys and SDK**

---

## 🎯 2. Problem Statement

Developers and teams face repeated friction when implementing Retrieval-Augmented Generation (RAG) pipelines across projects. Each new project often requires rebuilding the same components — file ingestion, chunking, embedding generation, vector storage, retrieval, classification, and context injection.

This repetitive effort leads to:

* **Wasted development time**
* **Inconsistent architecture** across projects
* **Hard-to-maintain RAG systems**
* **Lack of centralized control** over embeddings and parameters
* **Redundant costs** for reprocessing data

Furthermore, real-world data is **ever-changing**.
Most current RAG systems don’t handle incremental updates gracefully — they force complete re-embedding when only a few records change.

**Contxt** solves this by making RAG:

* Reusable
* Configurable
* Incrementally updatable
* Accessible via simple APIs

---

## 🚀 3. Product Vision

> “To make knowledge truly contextual — a single reusable system to manage, embed, and retrieve intelligence from evolving data.”

Contxt will serve as a **self-contained RAG platform** and a **backend microservice** that can plug into any project — web, mobile, or backend — to bring RAG capabilities instantly.

---

## ⚙️ 4. Objectives

| Goal                          | Description                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------- |
| 🔹 Unified RAG Core           | Centralized backend to manage all RAG pipelines for multiple projects           |
| 🔹 Incremental Updates        | Allow users to sync new data via APIs and choose re-embed or partial embedding  |
| 🔹 Fine-Grained Control       | Let users adjust similarity threshold, top-K retrieval, included sections, etc. |
| 🔹 Multi-Project Architecture | Each user can maintain multiple independent knowledge bases                     |
| 🔹 Playground Interface       | Provide an interactive interface to test and evaluate RAG performance           |
| 🔹 Secure API Access          | Issue multiple API keys per user/project with permission control                |
| 🔹 Scalable Backend           | Use Neon (Postgres + pgvector) for efficient vector search and storage          |
| 🔹 Seamless Integration       | Simple REST API and SDK access for developers                                   |

---

## 🧱 5. Core Modules & Features

### 1. **Authentication**

* Managed via **Better Auth**
* Email/password or OAuth-based login
* Session management using JWT/cookies

---

### 2. **Project Management**

* Each user can create multiple “Projects”
* A project = isolated RAG workspace
* Project contains settings:

  * Similarity threshold (0–1)
  * Embedding model (Gemini)
  * Included sections (to filter embeddings)
  * Top-K retrieval value

---

### 3. **Knowledge Base (Documents + Chunks)**

* Upload text, markdown, or PDF (manual)
* API-driven ingestion from other apps
* Chunked using intelligent splitting
* Embedded with Gemini Embeddings (`1536-dim`)
* Stored in Neon Postgres with `pgvector`
* Optional metadata tagging (e.g., section, author)

---

### 4. **Incremental Sync System**

* External apps can push new or updated data via `/api/data/sync`
* Added entries stored in `sync_queue`
* User can choose:

  * **Embed new only**
  * **Re-embed all**
* Supports `content_hash` to detect unchanged data

---

### 5. **Classifier**

* Checks if a query is relevant to the KB
* Uses cosine similarity threshold + optional LLM binary classifier
* Prevents out-of-context responses

---

### 6. **Playground**

* Web UI to test RAG pipeline per project
* Features:

  * Query input
  * Adjustable sliders (similarity threshold, top-K)
  * Section filters
  * Retrieved chunk viewer
  * LLM response output
  * Debug mode (view similarity scores)

---

### 7. **API Keys & Permissions**

* Users can create multiple API keys
* Each key:

  * Has a unique prefix (`ctx_live_`)
  * Stores only hashed version (secure)
  * Can be scoped per project
  * Has permissions (read, write, embed)
  * Supports expiration and revocation
* Used in headers for external access:

  ```
  Authorization: Bearer ctx_live_xxxxxx
  ```

---

### 8. **Query Logs**

* Every RAG query is logged in `queries`
* Logs contain:

  * Query text
  * Response text
  * Retrieved chunks & similarity
  * Model used
  * API key (optional)
* Useful for debugging, analytics, and improvement

---

### 9. **Webhooks (Optional Future)**

* Projects can register callback URLs for events:

  * `on_embedding_complete`
  * `on_query`
* Useful for syncing with external systems

---

## 🧩 6. Database Architecture

**Postgres + pgvector (Neon)**

| Table        | Description                                    |
| ------------ | ---------------------------------------------- |
| `user`       | Auth table (Better Auth)                       |
| `projects`   | Each user’s RAG environment                    |
| `documents`  | Uploaded or ingested data                      |
| `chunks`     | Embedded text vectors                          |
| `sync_queue` | Pending new/updated data waiting for embedding |
| `queries`    | Playground and API usage logs                  |
| `api_keys`   | Secure API key management per user/project     |
| `webhooks`   | Optional event callbacks                       |

(Refer to `/schema/contxt.ts` for the full Drizzle ORM schema.)

---

## 🧠 7. Tech Stack

| Layer           | Technology                         |
| --------------- | ---------------------------------- |
| Frontend        | Next.js (App Router) + TailwindCSS |
| Auth            | Better Auth                        |
| Backend         | Next.js API Routes                 |
| Database        | Neon Postgres (pgvector)           |
| ORM             | Drizzle ORM                        |
| Embedding Model | Gemini Embeddings                  |
| Hosting         | Vercel                             |
| API Access      | REST API + SDK (planned)           |

---

## 🔄 8. System Flow

**User Workflow**

1. Login via Better Auth
2. Create a Project
3. Upload files or push data via API
4. Contxt stores data in `documents` or `sync_queue`
5. On user request → Embed new data → store in `chunks`
6. Query through Playground or API → retrieve top-K → generate response
7. Log query and response in `queries`

---

**External Integration Workflow**

1. External system sends data → `/api/data/sync`
2. Contxt adds it to `sync_queue`
3. User reviews → chooses to embed new items
4. Once embedded → available for retrieval instantly
5. API queries can fetch knowledge using project-scoped keys

---

## 🔒 9. Security & Access

* **API key validation middleware** using SHA-256 hash matching
* **Role-based scopes**: `read`, `write`, `embed`, `admin`
* **Cascade deletion** for cleanup on project removal
* **Hashed sensitive keys**, no plaintext storage
* Optional **rate limiting & usage logging**

---

## 🧰 10. Non-Functional Requirements

| Category        | Requirement                                                       |
| --------------- | ----------------------------------------------------------------- |
| Performance     | Query latency under 1s for top-6 retrieval                        |
| Scalability     | Horizontally scalable Neon + Vercel infra                         |
| Reliability     | 99.9% uptime goal                                                 |
| Security        | Hashed keys, scoped access, HTTPS-only                            |
| Maintainability | Modular schema, Drizzle ORM migrations                            |
| Extensibility   | Future-ready for multiple embedding models (OpenAI, Gemini, etc.) |

---

## 🧩 11. Milestones & Phases

| Phase   | Focus                   | Deliverables                                  |
| ------- | ----------------------- | --------------------------------------------- |
| Phase 1 | Core foundation         | Auth, Projects, Documents, Chunks, Playground |
| Phase 2 | Incremental sync system | `/api/data/sync`, queue embedding             |
| Phase 3 | API keys + permissions  | Scoped access and secure API gateway          |
| Phase 4 | Analytics + query logs  | Dashboard & usage visualization               |
| Phase 5 | SDK + Webhooks          | Developer tooling and integrations            |

---

## 🧭 12. Future Extensions

* Fine-tuned local embeddings
* LLM response scoring & feedback loops
* Multi-model comparison in Playground
* Multi-language embeddings
* Billing system (usage-based pricing)
* Private self-hosting version

---

## 🧾 13. Success Metrics

| Metric                            | Target                             |
| --------------------------------- | ---------------------------------- |
| Avg. setup time for a new project | < 3 minutes                        |
| Avg. query latency                | < 1.2 seconds                      |
| Re-embedding efficiency           | 70% less redundant processing      |
| API integration time              | < 10 lines of code                 |
| Playground adoption               | 90% of users test before deploying |

---

## 📌 14. Summary

**Contxt** is not just another RAG tool — it’s the **universal layer** between your data and intelligent context retrieval.
By abstracting away all the repetitive components of RAG, Contxt empowers developers to focus on innovation — not plumbing.

---

