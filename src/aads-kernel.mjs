const ENGINES = new Set([
  "Seedance",
  "Runway Gen-3",
  "Pika Labs",
  "Sora",
  "Kling",
  "Luma Dream Machine",
  "Google Gemini Video",
  "General",
]);

const SCALES = new Set(["Low", "Moderate", "High", "Extreme"]);
const VISUAL_STYLES = new Set(["Realism", "Semi-Stylized", "Cartoon"]);
const DIRECTING_STYLES = new Set([
  "Documentary",
  "Naturalistic",
  "Feature Animation",
  "Theatrical",
  "Operatic",
]);
const PERFORMANCE_STYLES = new Set([
  "Restrained",
  "Natural",
  "Feature Animation",
  "Theatrical",
]);
const RATIOS = new Set(["9:16", "16:9", "1:1"]);
const DURATIONS = new Set([3, 5, 8, 10, 15, 30]);

export const MODULES = Object.freeze({
  "RSTA-001": "Realistic Skin, Tissue & Anatomy Enhancement",
  "CGG-001": "Conversational Gesture Grammar",
  "DOA-001": "Dramatic Objective Authority",
  "RPAC-001": "Performance Scale Directive",
  "PIL-001": "Performance Interpretation Law",
  "DSPE-001": "Dialogue Semantic Performance Engine",
  "PEF-001": "Performance Energy Flow Engine",
  "SIE-001": "Semantic Intention Engine",
  "SRE-001": "Semantic Relationship Engine",
  "SPAE-001": "Semantic Prompt Assembly Engine",
  "KTP-001-VEP": "Key Thought Pose Visual Enhancement",
  "HAPI-001": "Holistic Animation Performance Integrity",
});

export const DEFAULT_MODULES = Object.freeze([
  "CGG-001",
  "DOA-001",
  "RPAC-001",
  "PIL-001",
  "DSPE-001",
  "PEF-001",
  "SIE-001",
  "SRE-001",
  "SPAE-001",
  "KTP-001-VEP",
  "HAPI-001",
]);

export function validateGenerationRequest(raw) {
  const input = String(raw?.input ?? "").trim();
  const dialogue = String(raw?.dialogue ?? "").trim();
  const engine = String(raw?.engine ?? "General");
  const visualStyle = String(raw?.visualStyle ?? "Semi-Stylized");
  const directingStyle = String(raw?.directingStyle ?? "Naturalistic");
  const performanceStyle = String(raw?.performanceStyle ?? "Natural");
  const actionScale = String(raw?.actionScale ?? "Moderate");
  const emotionalScale = String(raw?.emotionalScale ?? "Moderate");
  const performanceScale = String(raw?.performanceScale ?? "Moderate");
  const aspectRatio = String(raw?.aspectRatio ?? "9:16");
  const duration = Number(raw?.duration ?? 10);
  const mood = String(raw?.mood ?? "cinematic").trim().slice(0, 80);

  if (input.length < 20 || input.length > 6000) {
    throw new Error("Describe the shot in 20 to 6,000 characters.");
  }
  if (dialogue.length > 800) {
    throw new Error("Exact dialogue must be 800 characters or fewer.");
  }
  if (!ENGINES.has(engine)) throw new Error("Unsupported target engine.");
  if (!VISUAL_STYLES.has(visualStyle)) throw new Error("Unsupported visual style.");
  if (!DIRECTING_STYLES.has(directingStyle)) throw new Error("Unsupported directing style.");
  if (!PERFORMANCE_STYLES.has(performanceStyle)) throw new Error("Unsupported performance style.");
  if (!SCALES.has(actionScale)) throw new Error("Unsupported action scale.");
  if (!SCALES.has(emotionalScale) || !SCALES.has(performanceScale)) {
    throw new Error("Unsupported performance scale.");
  }
  if (!RATIOS.has(aspectRatio)) throw new Error("Unsupported aspect ratio.");
  if (!DURATIONS.has(duration)) throw new Error("Unsupported duration.");

  const requestedModules = Array.isArray(raw?.modules) ? raw.modules : [];
  const modules = requestedModules.filter((code) => Object.hasOwn(MODULES, code));

  return {
    input,
    dialogue,
    engine,
    visualStyle,
    directingStyle,
    performanceStyle,
    actionScale,
    emotionalScale,
    performanceScale,
    aspectRatio,
    duration,
    mood: mood || "cinematic",
    modules: modules.length ? [...new Set(modules)] : [...DEFAULT_MODULES],
  };
}

const actionDirection = {
  Low: "Use economical, purposeful motion with small readable shifts and minimal follow-through.",
  Moderate:
    "Use clear readable action with coordinated weight transfer, timing contrast, and a natural recovery.",
  High:
    "Use strong physical commitment: establish a prepared or committed starting state, then show the trigger or contact traveling through eye focus and breath into the head and shoulders, rib cage and spine, pelvis, knees and feet. Include an opposing-arm counterbalance, wrist/hand/finger follow-through, absorption, recovery, and a final living pose visibly different from the opening pose.",
  Extreme:
    "Use maximum controlled physical amplitude without anatomical distortion: define the prepared starting state and trigger/contact, then trace eye and breath response through head, shoulders, rib cage, spine, pelvis with a relevant pelvic offset or counter-rotation, knees and feet weight transfer, opposing-arm counterbalance, wrist/hand/finger follow-through, absorption and recovery. End in a stable living pose visibly different from the opening pose.",
};

export function buildSystemInstruction(request) {
  const enabled = request.modules.map((code) => `${code}: ${MODULES[code]}`).join("; ");

  return `You are the Google Gemini reasoning engine inside AADS V25.6 Contest Kernel, an animation-direction system.

TASK
Transform the user's creative brief into precise production directions for ${request.engine}. Return JSON only and conform to the supplied schema. Do not quote, repeat, paraphrase, or include the protected dialogue; application code owns dialogue insertion.

SHOT SETTINGS
- Duration: ${request.duration} seconds
- Aspect ratio: ${request.aspectRatio}
- Visual style: ${request.visualStyle} (appearance, materials, character rendering, and environmental design)
- Directing style: ${request.directingStyle} (staging, presentation, dramatic emphasis, and shot interpretation)
- Performance style: ${request.performanceStyle} (how the performer acts; separate from movement amplitude)
- Action scale: ${request.actionScale} (physical movement amplitude, weight transfer, timing contrast, follow-through, counterbalance, and recovery)
- Emotional scale: ${request.emotionalScale}
- Performance scale: ${request.performanceScale} (retain as an independent overall performance setting)
- Mood: ${request.mood}
- Enabled AADS authorities: ${enabled}

SEMANTIC MOTION LAW
Always define a hold by its grammatical subject and function.
- CHARACTER HOLD: a living performance hold. Preserve breathing, blinking, eye focus, balance, muscle tone, and small settling motion unless the creative brief explicitly requires supernatural immobility.
- CAMERA OR FRAMING HOLD: the camera/framing remains locked; performer motion continues normally.
- OBJECT OR CONTACT HOLD: the named object/contact relationship remains stable while permitted character motion continues.
- ENVIRONMENT HOLD: only the named environmental state remains stable.
- EDITORIAL END HOLD: the completed composition remains readable while living motion continues where appropriate.
Never transform a negative instruction into an affirmative action. Items following no, never, avoid, without, prohibit, or exclude remain prohibited even when comma-separated.

PERFORMANCE LAW
Build one causal chain through eyes, breath, head, shoulders, torso, arms, wrists, hands, fingers, weight, balance, and contact where relevant. Action scale is separate from performance style and emotional scale. ${actionDirection[request.actionScale]} Apply only the body regions relevant to the action and character; do not force every body part into every scene. High and Extreme settings do not force anatomical distortion, duplicated limbs, frantic motion, or camera movement.
Emotional scale controls eye focus, eyelids, brows, facial expression, breath, emotional impulse, and internal reaction. It must not automatically create camera movement or anatomical distortion. Performance style controls acting quality and presentation, not action amplitude.

CONTINUITY LAW
Preserve character identity, wardrobe, left/right assignments, props, anatomy, contact, screen direction, set geography, and frame-to-frame causality. Use a single continuous shot when requested.

OUTPUT LAW
Write renderer-facing creative directions, not policy commentary. Do not output governance codes, safety labels, validation findings, markdown fences, or internal reasoning.`;
}

export function buildUserInstruction(request) {
  return `Create the production prompt components for this brief:\n\n${request.input}\n\nRemember: protected dialogue is managed separately by application code and must not appear in your JSON response.`;
}

function clean(value) {
  return String(value ?? "")
    .replace(/```(?:json)?/gi, "")
    .replace(/\r/g, "")
    .trim();
}

function cleanList(value) {
  if (!Array.isArray(value)) return [];
  return value.map(clean).filter(Boolean).slice(0, 16);
}

export function parseGeminiJson(text) {
  const cleaned = clean(text);
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("Gemini returned an unreadable response.");
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  }

  return {
    title: clean(parsed.title) || "AADS Production Shot",
    shotSummary: clean(parsed.shotSummary),
    visualDesign: clean(parsed.visualDesign),
    actionArc: clean(parsed.actionArc),
    performance: clean(parsed.performance),
    camera: clean(parsed.camera),
    continuity: clean(parsed.continuity),
    environment: clean(parsed.environment),
    finalHold: clean(parsed.finalHold),
    negativeConstraints: cleanList(parsed.negativeConstraints),
  };
}

function section(name, text) {
  return text ? `${name}\n${text}` : "";
}

export function compileRendererPrompt(parts, request) {
  const renderer = request.engine === "Google Gemini Video"
    ? "Google Gemini video generation"
    : request.engine;
  const blocks = [
    parts.title,
    `FORMAT\n${request.duration}-second ${request.aspectRatio} single production shot for ${renderer}. Mood: ${request.mood}. Emotional scale: ${request.emotionalScale}. Physical performance scale: ${request.performanceScale}.`,
    section("SHOT", parts.shotSummary),
    section("VISUAL DESIGN", parts.visualDesign),
    section("ACTION ARC", parts.actionArc),
    section("PERFORMANCE", parts.performance),
    request.dialogue ? `DIALOGUE — SPEAK EXACTLY ONCE\nSPEAKER: “${request.dialogue}”` : "",
    section("CAMERA AND FRAMING", parts.camera),
    section("CONTINUITY", parts.continuity),
    section("ENVIRONMENT", parts.environment),
    section("FINAL LIVING HOLD", parts.finalHold),
    parts.negativeConstraints.length
      ? `NEGATIVE CONSTRAINTS\n${parts.negativeConstraints.map((item) => `- ${item}`).join("\n")}`
      : "",
  ].filter(Boolean);

  return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

export const geminiResponseSchema = Object.freeze({
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    shotSummary: { type: "STRING" },
    visualDesign: { type: "STRING" },
    actionArc: { type: "STRING" },
    performance: { type: "STRING" },
    camera: { type: "STRING" },
    continuity: { type: "STRING" },
    environment: { type: "STRING" },
    finalHold: { type: "STRING" },
    negativeConstraints: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "title",
    "shotSummary",
    "visualDesign",
    "actionArc",
    "performance",
    "camera",
    "continuity",
    "environment",
    "finalHold",
    "negativeConstraints",
  ],
});
