#!/usr/bin/env node
/**
 * Fireflies Org-Wide Privacy Setter
 *
 * Sets the privacy level on every meeting transcript visible to an admin account.
 *
 * Usage:
 *   node set-privacy.js --privacy PRIVATE [--dry-run] [--from 2024-01-01] [--to 2024-12-31]
 *
 * Privacy options:
 *   PRIVATE   – only the meeting owner can see it
 *   TEAM      – all team members can see it
 *   PUBLIC    – anyone with the link can see it
 *
 * Prerequisites:
 *   export FIREFLIES_API_KEY="your-admin-api-key"
 *   node >= 18  (uses built-in fetch)
 */

const API_URL = "https://api.fireflies.ai/graphql";

// ─── GraphQL helpers ──────────────────────────────────────────────────────────

async function gql(apiKey, query, variables = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }
  return json.data;
}

// ─── Queries / mutations ──────────────────────────────────────────────────────

const LIST_TRANSCRIPTS = `
  query ListTranscripts($limit: Int, $skip: Int, $fromDate: String, $toDate: String) {
    transcripts(limit: $limit, skip: $skip, fromDate: $fromDate, toDate: $toDate) {
      id
      title
      privacy
      organizer_email
      date
    }
  }
`;

const UPDATE_PRIVACY = `
  mutation UpdateTranscript($id: String!, $privacy: Privacy!) {
    updateTranscript(id: $id, privacy: $privacy) {
      id
      privacy
    }
  }
`;

// ─── Core logic ───────────────────────────────────────────────────────────────

async function fetchAllTranscripts(apiKey, { fromDate, toDate } = {}) {
  const PAGE = 50;
  let skip = 0;
  const all = [];

  while (true) {
    const data = await gql(apiKey, LIST_TRANSCRIPTS, {
      limit: PAGE,
      skip,
      fromDate: fromDate || null,
      toDate: toDate || null,
    });

    const page = data.transcripts ?? [];
    all.push(...page);
    console.log(`  Fetched ${all.length} meetings so far…`);

    if (page.length < PAGE) break;
    skip += PAGE;
  }

  return all;
}

async function setPrivacy(apiKey, meetingId, privacy, dryRun) {
  if (dryRun) {
    return { id: meetingId, privacy };
  }
  const data = await gql(apiKey, UPDATE_PRIVACY, { id: meetingId, privacy });
  return data.updateTranscript;
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(args) {
  const opts = { privacy: null, dryRun: false, fromDate: null, toDate: null };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--privacy":
        opts.privacy = args[++i]?.toUpperCase();
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--from":
        opts.fromDate = args[++i];
        break;
      case "--to":
        opts.toDate = args[++i];
        break;
    }
  }

  return opts;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.FIREFLIES_API_KEY;
  if (!apiKey) {
    console.error("Error: FIREFLIES_API_KEY environment variable is not set.");
    process.exit(1);
  }

  const opts = parseArgs(process.argv.slice(2));
  const VALID_PRIVACY = ["PRIVATE", "TEAM", "PUBLIC"];

  if (!opts.privacy || !VALID_PRIVACY.includes(opts.privacy)) {
    console.error(
      `Error: --privacy must be one of: ${VALID_PRIVACY.join(", ")}`
    );
    console.error(
      "Usage: node set-privacy.js --privacy PRIVATE [--dry-run] [--from 2024-01-01] [--to 2024-12-31]"
    );
    process.exit(1);
  }

  console.log(`\nFireflies Org-Wide Privacy Setter`);
  console.log(`  Target privacy : ${opts.privacy}`);
  console.log(`  Dry run        : ${opts.dryRun}`);
  if (opts.fromDate) console.log(`  From date      : ${opts.fromDate}`);
  if (opts.toDate) console.log(`  To date        : ${opts.toDate}`);
  console.log();

  // 1. Fetch all meetings
  console.log("Fetching all meetings…");
  const meetings = await fetchAllTranscripts(apiKey, {
    fromDate: opts.fromDate,
    toDate: opts.toDate,
  });
  console.log(`\nFound ${meetings.length} total meeting(s).\n`);

  // 2. Filter out meetings that already have the target privacy
  const toUpdate = meetings.filter((m) => m.privacy !== opts.privacy);
  const alreadyCorrect = meetings.length - toUpdate.length;

  if (alreadyCorrect > 0) {
    console.log(
      `${alreadyCorrect} meeting(s) already set to ${opts.privacy} — skipping.`
    );
  }
  console.log(
    `${toUpdate.length} meeting(s) will be updated${opts.dryRun ? " (DRY RUN)" : ""}.\n`
  );

  if (toUpdate.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  // 3. Update each meeting
  let success = 0;
  let failed = 0;
  const errors = [];

  for (const meeting of toUpdate) {
    const label = `[${meeting.id}] "${meeting.title || "Untitled"}" (${meeting.organizer_email})`;
    try {
      await setPrivacy(apiKey, meeting.id, opts.privacy, opts.dryRun);
      console.log(`  ✓ ${label}`);
      success++;
    } catch (err) {
      console.error(`  ✗ ${label}\n    Error: ${err.message}`);
      errors.push({ meeting, error: err.message });
      failed++;
    }

    // Polite rate limiting — Fireflies allows ~10 req/s
    await new Promise((r) => setTimeout(r, 120));
  }

  // 4. Summary
  console.log(`\n─────────────────────────────────`);
  console.log(`Done${opts.dryRun ? " (DRY RUN — no changes made)" : ""}.`);
  console.log(`  Updated : ${success}`);
  console.log(`  Failed  : ${failed}`);

  if (errors.length > 0) {
    console.log("\nFailed meetings:");
    for (const { meeting, error } of errors) {
      console.log(`  ${meeting.id} — ${meeting.title}: ${error}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
