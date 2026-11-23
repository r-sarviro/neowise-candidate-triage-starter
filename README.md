# Neowise take-home — AI helper for inbound requests

**Language:** [EN](README.md) · [RU](README.ru.md)

Neowise take-home: AI helper that triages inbound requests (topic + reply draft).

Target time: 45–60 minutes. A manager pastes request text, gets a topic and a reply draft, then decides what to send to the client.

## Requirements

- Node.js 20 or newer
- No npm dependencies and no API keys

## Quick start

The repo includes a server, an HTML page, and a model simulator.

```sh
node server.mjs
```

Open http://127.0.0.1:3000. Override the port with the `PORT` environment variable.

## What to change

1. Finish `POST /api/triage`. Accept JSON with a `text` field that is a non-empty string. For missing, empty, non-string, or broken JSON input return HTTP 400 and `{"status":"invalid_input"}`.
2. On a valid model response return HTTP 200 and `{"status":"ready","topic":"…","draft":"…"}`. Allowed topics: `delivery`, `pricing`, `other`. The draft must be a non-empty string. On model timeout, error, or unsuitable response return HTTP 200 and `{"status":"manual_review","topic":null,"draft":null}`. Cap waiting for the model at 300 ms. Keep the provided simulator behavior unchanged.
3. On the page, show the topic and draft on success. For `manual_review`, show a clear message to the manager and clear the previous draft. Add at least one executable test for failure behavior and document how to run it.

For local checks the simulator accepts any ordinary text. Labels `[timeout]`, `[error]`, `[bad-json]`, `[bad-topic]`, `[empty-draft]` trigger separate failure scenarios.

## What to send to the bot

- A pull request link and the SHA of the commit under review. You may use your own practice repository. Keep the starter code as the first commit, then open a PR from a separate branch.
- A short run/test instruction. In the PR description answer where the AI result is checked, what happens on failure, which AI you used, and what you verified yourself. If you worked without AI, say so.
- One sentence on the value for the manager and how it could be measured.

After submission the bot may ask one or two short questions about your code. Use synthetic data. If you ran out of time, note unfinished parts in the PR.

## License

MIT
