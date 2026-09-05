const moduleDefinitions = {
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
};

const form = document.querySelector("#generator-form");
const modulesContainer = document.querySelector("#modules");
const generateButton = document.querySelector("#generate");
const status = document.querySelector("#status");
const result = document.querySelector("#result");
const empty = document.querySelector("#empty");
const meta = document.querySelector("#meta");
const copyButton = document.querySelector("#copy");
const downloadButton = document.querySelector("#download");

for (const [code, name] of Object.entries(moduleDefinitions)) {
  const label = document.createElement("label");
  label.className = "module";
  const checked = code !== "RSTA-001" ? " checked" : "";
  label.innerHTML = `<input type="checkbox" name="module" value="${code}"${checked}><span><b>${code}</b>${name}</span>`;
  modulesContainer.append(label);
}

function setError(message) {
  status.className = "status error";
  status.textContent = message;
}

function setWorking(working) {
  generateButton.disabled = working;
  generateButton.innerHTML = working ? "<span class=\"spinner\"></span> Gemini is directing…" : "<span>▶</span> Initialize sequence";
}

form.addEventListener("input", () => {
  if (status.classList.contains("error")) {
    status.className = "status";
    status.textContent = "";
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.className = "status";
  status.textContent = "";
  meta.textContent = "";
  setWorking(true);

  const body = {
    input: document.querySelector("#input").value,
    dialogue: document.querySelector("#dialogue").value,
    engine: document.querySelector("#engine").value,
    duration: Number(document.querySelector("#duration").value),
    visualStyle: document.querySelector("#visualStyle").value,
    directingStyle: document.querySelector("#directingStyle").value,
    performanceStyle: document.querySelector("#performanceStyle").value,
    actionScale: document.querySelector("#actionScale").value,
    emotionalScale: document.querySelector("#emotionalScale").value,
    performanceScale: document.querySelector("#performanceScale").value,
    aspectRatio: document.querySelector("#aspectRatio").value,
    mood: document.querySelector("#mood").value,
    modules: [...document.querySelectorAll('input[name="module"]:checked')].map((item) => item.value),
  };

  try {
    const response = await fetch("/api/generate-prompt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || `Request failed with HTTP ${response.status}.`);

    result.textContent = data.prompt;
    result.hidden = false;
    empty.hidden = true;
    copyButton.disabled = false;
    downloadButton.disabled = false;
    meta.textContent = `${data.meta.version} · ${data.meta.provider} · ${data.meta.model}`;
    status.className = "status success";
    status.textContent = "Sequence generated successfully.";
  } catch (error) {
    setError(error instanceof Error ? error.message : "Generation failed.");
  } finally {
    setWorking(false);
  }
});

copyButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(result.textContent);
  copyButton.textContent = "Copied";
  setTimeout(() => (copyButton.textContent = "Copy"), 1200);
});

downloadButton.addEventListener("click", () => {
  const blob = new Blob([result.textContent], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "aads-production-prompt.txt";
  link.click();
  URL.revokeObjectURL(link.href);
});
