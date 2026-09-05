import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildSystemInstruction,
  buildUserInstruction,
  compileRendererPrompt,
  geminiResponseSchema,
  parseGeminiJson,
  validateGenerationRequest,
} from "./src/aads-kernel.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicRoot = join(root, "public");
const port = Number(process.env.PORT || 3000);
const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) throw new Error("Request is too large.");
  }
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function getApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.AI_INTEGRATIONS_GEMINI_API_KEY ||
    ""
  );
}

async function callGemini(request) {
  const apiKey = getApiKey();
  if (!apiKey) {
    const error = new Error("Missing GEMINI_API_KEY. Add it as a Replit Secret and restart the app.");
    error.status = 503;
    throw error;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      system_instruction: { parts: [{ text: buildSystemInstruction(request) }] },
      contents: [{ role: "user", parts: [{ text: buildUserInstruction(request) }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2500,
        responseMimeType: "application/json",
        responseSchema: geminiResponseSchema,
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `Gemini API returned HTTP ${response.status}.`;
    const error = new Error(message);
    error.status = response.status >= 500 ? 502 : 400;
    throw error;
  }

  const blocked = data?.promptFeedback?.blockReason;
  if (blocked) {
    const error = new Error(`Google Gemini declined this request: ${blocked}.`);
    error.status = 400;
    throw error;
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();
  if (!text) {
    const finishReason = data?.candidates?.[0]?.finishReason || "NO_TEXT";
    const error = new Error(`Google Gemini returned no usable text (${finishReason}).`);
    error.status = 502;
    throw error;
  }
  return text;
}

async function handleGenerate(req, res) {
  try {
    const request = validateGenerationRequest(await readJson(req));
    const providerText = await callGemini(request);
    const parts = parseGeminiJson(providerText);
    const prompt = compileRendererPrompt(parts, request);
    json(res, 200, {
      ok: true,
      prompt,
      meta: {
        provider: "Google Gemini",
        model,
        version: "AADS V25.6 Contest Kernel",
        validation: "schema-and-format only",
      },
    });
  } catch (error) {
    const status = Number(error?.status) || 400;
    json(res, status, {
      ok: false,
      error: error instanceof Error ? error.message : "Generation failed.",
      source: status === 422 ? "request" : "provider-or-configuration",
    });
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url, "http://localhost");
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = normalize(requested).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = join(publicRoot, safePath);
  if (!filePath.startsWith(publicRoot)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      "content-type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "cache-control": requested === "/index.html" ? "no-cache" : "public, max-age=3600",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/api/health") {
    json(res, 200, {
      ok: true,
      service: "AnimPrompt DevPost Rescue",
      provider: "Google Gemini",
      model,
      apiKeyConfigured: Boolean(getApiKey()),
    });
    return;
  }
  if (req.method === "POST" && req.url === "/api/generate-prompt") {
    await handleGenerate(req, res);
    return;
  }
  if (req.method === "GET" || req.method === "HEAD") {
    await serveStatic(req, res);
    return;
  }
  json(res, 405, { ok: false, error: "Method not allowed." });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`AnimPrompt rescue build listening on port ${port}`);
  console.log(`Google Gemini model: ${model}; key configured: ${Boolean(getApiKey())}`);
});
