import { once } from "node:events";
import assert from "node:assert/strict";
import { test, after } from "node:test";
import { createTriageServer } from "../server.mjs";

const server = createTriageServer();
server.listen(0, "127.0.0.1");
await once(server, "listening");
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;

after(() => {
  server.close();
});

async function triage(text) {
  const reply = await fetch(`${baseUrl}/api/triage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return { status: reply.status, body: await reply.json() };
}

test("при сбое модели возвращает manual_review", async () => {
  const { status, body } = await triage("Нужна помощь [error]");
  assert.equal(status, 200);
  assert.deepEqual(body, {
    status: "manual_review",
    topic: null,
    draft: null,
  });
});

test("при таймауте модели возвращает manual_review", async () => {
  const { status, body } = await triage("Проверьте доставку [timeout]");
  assert.equal(status, 200);
  assert.deepEqual(body, {
    status: "manual_review",
    topic: null,
    draft: null,
  });
});

test("при неподходящей теме возвращает manual_review", async () => {
  const { status, body } = await triage("Вопрос [bad-topic]");
  assert.equal(status, 200);
  assert.deepEqual(body, {
    status: "manual_review",
    topic: null,
    draft: null,
  });
});
