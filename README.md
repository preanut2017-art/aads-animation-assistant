# AnimPrompt — AADS V25.6 DevPost Rescue Build

This is a clean, independent contest build of the AnimPrompt generator. Google Gemini performs semantic scene direction; deterministic application code assembles protected dialogue and renderer-facing sections.

## Why this build exists

The previous production application used an expanding chain of custom output classifiers. Legitimate animation language such as negative stillness constraints, locked cameras, object holds, and living end poses could be misclassified and rejected with an internal 422. This build removes that failure path.

It does **not** weaken Google safety controls. Google Gemini remains responsible for provider-level safety. The application validates request shape and Gemini's JSON structure but does not police ordinary creative vocabulary.

## Run locally

1. Install Node.js 20 or newer.
2. Add a Google AI Studio key to the environment as `GEMINI_API_KEY`.
3. Optionally set `GEMINI_MODEL` (default: `gemini-3.6-flash`).
4. Run `npm start`.
5. Open `http://localhost:3000`.

No package installation is required.

## Import into Replit

1. Create a **new** Replit project; do not overwrite the existing production project.
2. Import this repository or ZIP.
3. In Secrets, add `GEMINI_API_KEY` with the Google AI Studio key.
4. Press Run.
5. Confirm `/api/health` reports `ok: true` and `apiKeyConfigured: true`.
6. Generate the supplied Digi test shot before publishing.

The server also recognizes `GOOGLE_API_KEY` and Replit's `AI_INTEGRATIONS_GEMINI_API_KEY` environment names.

## Design boundaries

- Google Gemini only; no OpenAI client or route.
- No Clerk, Stripe, database, credits, subscriptions, or webhooks.
- Exact dialogue is omitted from the model response and inserted once by code.
- Holds are qualified by subject and function.
- Negative constraints retain negative scope.
- High and Extreme settings are legitimate performance choices.
- Provider errors are reported as provider errors, not as internal “final safety validation” failures.

## Verify

```bash
npm test
npm run check
```

## Proprietary source boundary

The public contest repository contains executable source code and the compact AADS V25.6 Contest Kernel. The complete proprietary AADS master document is intentionally not included.
