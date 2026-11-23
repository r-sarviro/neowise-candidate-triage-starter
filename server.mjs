import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { classify } from "./mock-ai.mjs";

const html = await readFile(new URL("./index.html", import.meta.url));
const ALLOWED_TOPICS = new Set(["delivery", "pricing", "other"]);
const MODEL_TIMEOUT_MS = 300;

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function invalidInput(response) {
  return json(response, 400, { status: "invalid_input" });
}

function manualReview(response) {
  return json(response, 200, { status: "manual_review", topic: null, draft: null });
}

async function handleTriage(request, response) {
  let body;
  try {
    body = JSON.parse(await readBody(request));
  } catch {
    return invalidInput(response);
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return invalidInput(response);
  }

  const { text } = body;
  if (typeof text !== "string" || text.trim() === "") {
    return invalidInput(response);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

  try {
    const raw = await classify(text, { signal: controller.signal });
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      return manualReview(response);
    }

    if (
      result === null ||
      typeof result !== "object" ||
      !ALLOWED_TOPICS.has(result.topic) ||
      typeof result.draft !== "string" ||
      result.draft.trim() === ""
    ) {
      return manualReview(response);
    }

    return json(response, 200, {
      status: "ready",
      topic: result.topic,
      draft: result.draft,
    });
  } catch {
    return manualReview(response);
  } finally {
    clearTimeout(timer);
  }
}

export function createTriageServer() {
  return createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(html);
      return;
    }
    if (request.method !== "POST" || request.url !== "/api/triage") {
      return json(response, 404, { status: "not_found" });
    }
    try {
      await handleTriage(request, response);
    } catch {
      json(response, 500, { status: "server_error" });
    }
  });
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  createTriageServer().listen(Number(process.env.PORT || 3000), "127.0.0.1");
}
