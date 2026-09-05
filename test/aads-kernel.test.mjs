import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildSystemInstruction,
  compileRendererPrompt,
  DEFAULT_MODULES,
  parseGeminiJson,
  validateGenerationRequest,
} from "../src/aads-kernel.mjs";

const base = {
  input: "Digi presses a switch and reacts through a clear full-body performance chain.",
  dialogue: "One signal. One choice.",
  engine: "Seedance",
  visualStyle: "Cartoon",
  directingStyle: "Theatrical",
  performanceStyle: "Feature Animation",
  actionScale: "Extreme",
  emotionalScale: "High",
  performanceScale: "Extreme",
  aspectRatio: "9:16",
  duration: 10,
  mood: "energetic",
};

const providerParts = {
  title: "Signal Chain",
  shotSummary: "One continuous laboratory shot.",
  visualDesign: "Feature-animation 3D.",
  actionArc: "Digi presses the switch and reacts.",
  performance: "Eyes lead breath, torso, arm, wrist, hand, and fingers.",
  camera: "The camera remains locked.",
  continuity: "The wristband remains on the left wrist.",
  environment: "Console light ripples across the room.",
  finalHold: "Digi settles into an asymmetric living hold with breathing and blinking.",
  negativeConstraints: ["No seated pose", "No camera movement", "No frozen character pose"],
};

test("validates every advertised scale without treating High or Extreme as invalid", () => {
  for (const scale of ["Low", "Moderate", "High", "Extreme"]) {
    const request = validateGenerationRequest({ ...base, emotionalScale: scale, performanceScale: scale });
    assert.equal(request.emotionalScale, scale);
  }
});

test("normalizes every creative control and carries it into Gemini direction", () => {
  const request = validateGenerationRequest(base);
  assert.deepEqual(
    {
      visualStyle: request.visualStyle,
      directingStyle: request.directingStyle,
      performanceStyle: request.performanceStyle,
      actionScale: request.actionScale,
      emotionalScale: request.emotionalScale,
      performanceScale: request.performanceScale,
      engine: request.engine,
      duration: request.duration,
      aspectRatio: request.aspectRatio,
    },
    {
      visualStyle: "Cartoon",
      directingStyle: "Theatrical",
      performanceStyle: "Feature Animation",
      actionScale: "Extreme",
      emotionalScale: "High",
      performanceScale: "Extreme",
      engine: "Seedance",
      duration: 10,
      aspectRatio: "9:16",
    },
  );
  const instruction = buildSystemInstruction(request);
  for (const value of ["Cartoon", "Theatrical", "Feature Animation", "Extreme", "High", "10 seconds", "9:16", "Seedance", "energetic"]) {
    assert.match(instruction, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("keeps action, performance, and emotional controls semantically separate", () => {
  const request = validateGenerationRequest({
    ...base,
    actionScale: "Low",
    performanceStyle: "Theatrical",
    emotionalScale: "Extreme",
  });
  const instruction = buildSystemInstruction(request);
  assert.match(instruction, /Action scale: Low/);
  assert.match(instruction, /Performance style: Theatrical/);
  assert.match(instruction, /Emotional scale: Extreme/);
  assert.match(instruction, /Action scale is separate from performance style and emotional scale/);
  assert.match(instruction, /Performance style controls acting quality and presentation, not action amplitude/);
});

test("High and Extreme action scales produce concrete whole-body direction", () => {
  for (const actionScale of ["High", "Extreme"]) {
    const instruction = buildSystemInstruction(validateGenerationRequest({ ...base, actionScale }));
    for (const phrase of ["starting state", "trigger", "breath", "shoulders", "rib cage", "spine", "pelvis", "knees and feet", "counterbalance", "wrist", "recovery", "opening pose"]) {
      assert.match(instruction, new RegExp(phrase, "i"));
    }
  }
});

test("RSTA-001 is excluded from defaults but can be explicitly enabled", () => {
  const defaultRequest = validateGenerationRequest(base);
  assert.equal(defaultRequest.modules.includes("RSTA-001"), false);
  assert.equal(defaultRequest.modules.includes("HAPI-001"), true);
  assert.deepEqual(defaultRequest.modules, DEFAULT_MODULES);
  assert.equal(validateGenerationRequest({ ...base, modules: [] }).modules.includes("RSTA-001"), false);
  assert.equal(validateGenerationRequest({ ...base, modules: ["RSTA-001"] }).modules.includes("RSTA-001"), true);
  assert.equal(validateGenerationRequest({ ...base, modules: "RSTA-001" }).modules.includes("RSTA-001"), false);
});

test("system instruction defines holds by subject and preserves negative scope", () => {
  const instruction = buildSystemInstruction(validateGenerationRequest(base));
  assert.match(instruction, /CHARACTER HOLD/);
  assert.match(instruction, /CAMERA OR FRAMING HOLD/);
  assert.match(instruction, /OBJECT OR CONTACT HOLD/);
  assert.match(instruction, /Never transform a negative instruction into an affirmative action/);
});

test("protected dialogue is inserted exactly once", () => {
  const request = validateGenerationRequest(base);
  const output = compileRendererPrompt(providerParts, request);
  assert.equal(output.split(base.dialogue).length - 1, 1);
  assert.match(output, /SPEAK EXACTLY ONCE/);
});

test("accepts Google Gemini Video and names its production format", () => {
  const request = validateGenerationRequest({ ...base, engine: "Google Gemini Video" });
  const output = compileRendererPrompt(providerParts, request);
  assert.match(output, /production shot for Google Gemini video generation/);
});

test("mocked Digi generation parses and assembles without a live Gemini call", () => {
  const request = validateGenerationRequest(base);
  const mockedGeminiJson = JSON.stringify(providerParts);
  const output = compileRendererPrompt(parseGeminiJson(mockedGeminiJson), request);
  assert.match(output, /Signal Chain/);
  assert.match(output, /Digi presses the switch and reacts/);
  assert.match(output, /asymmetric living hold/);
  assert.equal(output.split(base.dialogue).length - 1, 1);
});

test("frontend exposes the restored controls with RSTA-001 off by default", async () => {
  const [html, app] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
  ]);
  for (const id of ["visualStyle", "directingStyle", "performanceStyle", "actionScale", "emotionalScale", "performanceScale"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  for (const duration of ["3", "5", "8", "10", "15", "30"]) {
    assert.match(html, new RegExp(`option value="${duration}"`));
  }
  assert.match(html, /Advanced \/ Owner · AADS modules/);
  assert.match(app, /"RSTA-001": "Realistic Skin, Tissue & Anatomy Enhancement"/);
  assert.match(app, /code !== "RSTA-001" \? " checked" : ""/);
  assert.match(app, /"HAPI-001": "Holistic Animation Performance Integrity"/);
});

test("negative stillness constraints remain negative and do not trigger rejection", () => {
  const output = compileRendererPrompt(providerParts, validateGenerationRequest(base));
  assert.match(output, /- No frozen character pose/);
  assert.match(output, /camera remains locked/i);
  assert.match(output, /living hold with breathing and blinking/i);
});

test("parses JSON with or without markdown fences", () => {
  const parsed = parseGeminiJson(`\`\`\`json\n${JSON.stringify(providerParts)}\n\`\`\``);
  assert.equal(parsed.title, "Signal Chain");
  assert.deepEqual(parsed.negativeConstraints, providerParts.negativeConstraints);
});

test("rejects malformed requests with a useful message", () => {
  assert.throws(() => validateGenerationRequest({ ...base, input: "too short" }), /20 to 6,000/);
  assert.throws(() => validateGenerationRequest({ ...base, engine: "Unknown" }), /Unsupported target engine/);
  assert.throws(() => validateGenerationRequest({ ...base, visualStyle: "Plastic" }), /Unsupported visual style/);
  assert.throws(() => validateGenerationRequest({ ...base, actionScale: "Loud" }), /Unsupported action scale/);
});
