# Evisort AI Connector — Capabilities Overview

## What Is This?

This connector integrates **Evisort** (Workday Contract Intelligence) with **Claude AI**, giving your legal team the ability to interact with your entire contract repository through natural language conversations. Instead of navigating the Evisort UI manually, team members can simply ask Claude to find contracts, check workflow status, review document metadata, and manage approval processes — all through a conversational interface.

---

## Capability Areas

### 1. Contract Search & Retrieval

| Capability | What It Enables |
|-----------|----------------|
| **Full-text contract search** | Ask Claude to find contracts by keyword, party name, contract type, or any metadata field — e.g., *"Find all MSAs expiring in the next 90 days"* |
| **Document lookup** | Retrieve any contract by its Evisort ID or your internal document ID |
| **Browse contract library** | List and paginate through your entire document repository |
| **Download contracts** | Download the original document or the AI-processed version (PDF or DOCX) |
| **AI-extracted provisions** | Access Evisort's AI-extracted contract clauses and provisions |

**Use cases:** Due diligence searches, expiration tracking, clause comparison across agreements, finding contracts with specific counterparties.

---

### 2. Contract Metadata & Fields

| Capability | What It Enables |
|-----------|----------------|
| **View all field definitions** | See every metadata field configured in your Evisort instance (party names, dates, values, custom fields) |
| **Read contract metadata** | Pull the full metadata profile for any contract — parties, effective dates, expiration, value, renewal terms, etc. |
| **Update contract metadata** | Modify field values on contracts (e.g., update status, add tags, correct party names) |
| **Provision tagging** | Bulk-tag contracts with specific provisions and track tagging progress |

**Use cases:** Contract data quality audits, bulk metadata updates, reporting on contract field coverage, identifying contracts missing critical fields.

---

### 3. Workflow & Approval Management

| Capability | What It Enables |
|-----------|----------------|
| **View available workflows** | See all published contract workflows (e.g., NDA review, vendor onboarding, renewal approval) |
| **Check intake forms** | Review what information is required to submit a contract request |
| **Submit contract requests** | Create new workflow tickets (contract review requests, approval requests) |
| **Track request status** | Check where a contract request stands in the approval pipeline |
| **View participants** | See who is involved in a given contract review |

**Use cases:** Checking status of pending approvals, understanding what workflows are available, reviewing intake requirements before submitting requests.

---

### 4. Approval & Review Actions

| Capability | What It Enables |
|-----------|----------------|
| **Advance workflow stages** | Move a contract request to its next stage in the pipeline |
| **Approve or reject** | Issue approval/rejection decisions on pending judgments |
| **Reassign reviewers** | Redirect a pending approval to a different team member |
| **Complete or cancel requests** | Close out finished reviews or cancel abandoned ones |
| **Upload signed documents** | Attach the final executed version of a contract |
| **Track document versions** | View and download all versions of a document throughout its review lifecycle |

**Use cases:** Approving contracts during conversations with Claude, checking what's waiting for your signature, reassigning reviews when someone is OOO, uploading executed agreements.

---

### 5. Activity & Audit Trail

| Capability | What It Enables |
|-----------|----------------|
| **Activity logs** | View the activity history for any contract or workflow entity |
| **System audit logs** | Pull comprehensive audit trail data across the entire Evisort instance |
| **Batch audit retrieval** | Export large volumes of audit data (up to 7,500 records per batch) with continuation support |

**Use cases:** Compliance audits, investigating who accessed or modified a contract, generating audit reports for regulators, tracking approval chain history.

---

### 6. User Administration

| Capability | What It Enables |
|-----------|----------------|
| **Export user list** | Download the current list of all Evisort users |
| **Bulk user import** | Upload spreadsheets to add or update users in bulk |
| **Track import status** | Monitor the progress of bulk user operations |
| **Review import errors** | Identify and troubleshoot failed user imports |

**Use cases:** User access reviews, onboarding new team members, periodic user audits, deprovisioning.

---

## Security & Access Control

- **Read/Write separation** — Every capability is classified as either read-only or write (modification). Users can be granted read-only access to prevent accidental changes.
- **API Key authentication** — Access is controlled through Evisort API keys, inheriting the same permissions as the associated Evisort user account.
- **No data storage** — The connector passes data directly between Claude and Evisort in real-time. No contract data is cached or stored outside of Evisort.
- **Audit trail** — All actions taken through the connector are logged in Evisort's audit system, just like any other API access.

---

## Example Conversations

> **"Show me all vendor agreements with Acme Corp that expire this year"**
> Claude searches Evisort, returns matching contracts with expiration dates and key terms.

> **"What contracts are waiting for my approval?"**
> Claude lists pending workflow tickets assigned to you with their current stage and submission date.

> **"Download the latest version of the signed MSA for Project Atlas"**
> Claude locates the document, identifies the most recent signed version, and provides the download.

> **"Who has access to our Evisort instance?"**
> Claude exports the user list and summarizes roles and access levels.

> **"Show me the audit trail for changes to contract #12345 in the last 30 days"**
> Claude pulls the activity log and presents a timeline of who viewed, edited, or approved the contract.

---

## Summary

| Area | Tools | Read | Write |
|------|-------|------|-------|
| Contract Search & Retrieval | 8 | 8 | 0 |
| Contract Metadata & Fields | 7 | 4 | 3 |
| Workflow & Approval Management | 5 | 4 | 1 |
| Approval & Review Actions | 10 | 3 | 7 |
| Activity & Audit Trail | 3 | 3 | 0 |
| User Administration | 7 | 4 | 3 |
| **Total** | **43** | **26** | **14** |

*3 tools serve dual purposes (provision creation is technically a write but classified under fields/read context)*
