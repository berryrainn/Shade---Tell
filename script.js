const bgPicker = document.getElementById("bgPicker");
const textPicker = document.getElementById("textPicker");
const bgHex = document.getElementById("bgHex");
const textHex = document.getElementById("textHex");
const swapBtn = document.getElementById("swapBtn");

const wheelCanvas = document.getElementById("colorWheelCanvas");
const wheelCtx = wheelCanvas.getContext("2d");
const activeTargetBtn = document.getElementById("activeTargetBtn");

const hueSlider = document.getElementById("hueSlider");
const satSlider = document.getElementById("satSlider");
const briSlider = document.getElementById("briSlider");
const hueVal = document.getElementById("hueVal");
const satVal = document.getElementById("satVal");
const briVal = document.getElementById("briVal");
const rVal = document.getElementById("rVal");
const gVal = document.getElementById("gVal");
const bVal = document.getElementById("bVal");

const contrastRatioEl = document.getElementById("contrastRatio");
const wcagHeadlineEl = document.getElementById("wcagHeadline");
const badgeAA = document.getElementById("badgeAA");
const badgeAAA = document.getElementById("badgeAAA");
const previewBox = document.getElementById("previewBox");
const copyCssBtn = document.getElementById("copyCssBtn");
const toast = document.getElementById("toast");

const savedSwatches = document.getElementById("savedSwatches");
const savedCount = document.getElementById("savedCount");
const addSwatchBtn = document.getElementById("addSwatchBtn");
const suggestionsList = document.getElementById("suggestionsList") || document.querySelector(".suggestions-list");

let activeTarget = "text"; // "bg" or "text"

// --- Color Conversions ---
function normalizeHex(value) {
  let clean = value.trim().replace(/[^0-9a-fA-F]/g, "");
  if (clean.length === 3) clean = clean.split("").map((c) => c + c).join("");
  return clean.length === 6 ? "#" + clean.toUpperCase() : null;
}

function hexToRgb(hex) {
  const clean = normalizeHex(hex) || "#000000";
  const num = parseInt(clean.slice(1), 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function rgbToHsb(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), b: Math.round(v * 100) };
}

function hsbToRgb(h, s, b) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  b = Math.max(0, Math.min(100, b)) / 100;
  const k = (n) => (n + h / 60) % 6;
  const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
  return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) };
}

function hsbToHex(h, s, b) {
  const { r, g, b: bl } = hsbToRgb(h, s, b);
  return rgbToHex(r, g, bl);
}

// --- Render HSB Color Wheel + Inner Square ---
function drawColorWheel(h, s, b) {
  const size = wheelCanvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = outerR - 16;

  wheelCtx.clearRect(0, 0, size, size);

  for (let angle = 0; angle < 360; angle++) {
    const start = ((angle - 1) * Math.PI) / 180;
    const end = ((angle + 1) * Math.PI) / 180;
    wheelCtx.beginPath();
    wheelCtx.arc(cx, cy, (outerR + innerR) / 2, start, end);
    wheelCtx.lineWidth = outerR - innerR;
    wheelCtx.strokeStyle = `hsl(${angle}, 100%, 50%)`;
    wheelCtx.stroke();
  }

  const sqSize = Math.floor(innerR * 1.3);
  const sqX = cx - sqSize / 2;
  const sqY = cy - sqSize / 2;

  wheelCtx.fillStyle = `hsl(${h}, 100%, 50%)`;
  wheelCtx.fillRect(sqX, sqY, sqSize, sqSize);

  const whiteGrad = wheelCtx.createLinearGradient(sqX, sqY, sqX + sqSize, sqY);
  whiteGrad.addColorStop(0, "#FFFFFF");
  whiteGrad.addColorStop(1, "rgba(255,255,255,0)");
  wheelCtx.fillStyle = whiteGrad;
  wheelCtx.fillRect(sqX, sqY, sqSize, sqSize);

  const blackGrad = wheelCtx.createLinearGradient(sqX, sqY, sqX, sqY + sqSize);
  blackGrad.addColorStop(0, "rgba(0,0,0,0)");
  blackGrad.addColorStop(1, "#000000");
  wheelCtx.fillStyle = blackGrad;
  wheelCtx.fillRect(sqX, sqY, sqSize, sqSize);

  const hueRad = (h * Math.PI) / 180;
  const ringMid = (outerR + innerR) / 2;
  wheelCtx.beginPath();
  wheelCtx.arc(cx + Math.cos(hueRad) * ringMid, cy + Math.sin(hueRad) * ringMid, 5, 0, Math.PI * 2);
  wheelCtx.strokeStyle = "#FFFFFF";
  wheelCtx.lineWidth = 2;
  wheelCtx.stroke();

  const dotX = sqX + (s / 100) * sqSize;
  const dotY = sqY + ((100 - b) / 100) * sqSize;
  wheelCtx.beginPath();
  wheelCtx.arc(dotX, dotY, 5, 0, Math.PI * 2);
  wheelCtx.strokeStyle = "#FFFFFF";
  wheelCtx.lineWidth = 2;
  wheelCtx.stroke();
}

wheelCanvas.addEventListener("click", (e) => {
  const rect = wheelCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left - wheelCanvas.width / 2;
  const y = e.clientY - rect.top - wheelCanvas.height / 2;
  const dist = Math.hypot(x, y);
  const outerR = wheelCanvas.width / 2 - 2;
  const innerR = outerR - 16;

  if (dist >= innerR && dist <= outerR) {
    let angle = Math.round((Math.atan2(y, x) * 180) / Math.PI);
    if (angle < 0) angle += 360;
    hueSlider.value = angle;
    applySliderChange();
  }
});

// --- WCAG / ISO 40500 Contrast Calculation ---
function getLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hexToRgb(hex1));
  const lum2 = getLuminance(hexToRgb(hex2));
  return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
}

// --- Saved Swatches (With Delete Button) ---
function updateSavedCount() {
  const count = savedSwatches.querySelectorAll(".swatch-dot").length;
  savedCount.textContent = `${count} ${count === 1 ? "color" : "colors"}`;
}

function createSwatchItem(hex, isActive = false) {
  const cleanHex = hex.toUpperCase();
  const wrapper = document.createElement("div");
  wrapper.className = "swatch-item";

  const dot = document.createElement("button");
  dot.type = "button";
  dot.className = `swatch-dot${isActive ? " active" : ""}`;
  dot.style.background = cleanHex;
  dot.dataset.color = cleanHex;
  dot.title = cleanHex;

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "swatch-delete";
  delBtn.title = `Delete ${cleanHex}`;
  delBtn.setAttribute("aria-label", `Delete ${cleanHex}`);
  delBtn.innerHTML = "&times;";

  wrapper.appendChild(dot);
  wrapper.appendChild(delBtn);
  return wrapper;
}

function initDefaultSwatches() {
  const defaults = [
    { hex: "#FFF0F3", active: false },
    { hex: "#4A1525", active: true },
    { hex: "#A33B5C", active: false },
    { hex: "#E598AD", active: false },
    { hex: "#F3E5D8", active: false },
    { hex: "#D4DFD0", active: false },
    { hex: "#DCD8EC", active: false }
  ];

  savedSwatches.querySelectorAll(".swatch-item").forEach((el) => el.remove());
  defaults.forEach(({ hex, active }) => {
    savedSwatches.insertBefore(createSwatchItem(hex, active), addSwatchBtn);
  });
  updateSavedCount();
}

savedSwatches.addEventListener("click", (e) => {
  const delBtn = e.target.closest(".swatch-delete");
  if (delBtn) {
    const item = delBtn.closest(".swatch-item");
    if (item) item.remove();
    updateSavedCount();
    return;
  }

  const dot = e.target.closest(".swatch-dot");
  if (!dot) return;
  document.querySelectorAll(".swatch-dot").forEach((d) => d.classList.remove("active"));
  dot.classList.add("active");
  if (activeTarget === "bg") bgPicker.value = dot.dataset.color;
  else textPicker.value = dot.dataset.color;
  updateAnalysis();
});

addSwatchBtn.addEventListener("click", () => {
  const hex = (activeTarget === "bg" ? bgPicker.value : textPicker.value).toUpperCase();
  savedSwatches.insertBefore(createSwatchItem(hex, false), addSwatchBtn);
  updateSavedCount();
});

// --- Dynamic Color Palette Suggestions Based on User's Pick ---
function getBestReadablePair(candidateHex, anchorHex, role) {
  const bg = role === "bg" ? candidateHex : anchorHex;
  const fg = role === "bg" ? anchorHex : candidateHex;
  if (getContrastRatio(bg, fg) >= 4.5) return { bg, fg };

  const darkOption = "#1E1418";
  const lightOption = "#FFFDFD";
  const cRatioDark = getContrastRatio(candidateHex, darkOption);
  const cRatioLight = getContrastRatio(candidateHex, lightOption);

  if (role === "bg") {
    return cRatioDark >= cRatioLight
      ? { bg: candidateHex, fg: darkOption }
      : { bg: candidateHex, fg: lightOption };
  }
  return cRatioDark >= cRatioLight
    ? { bg: lightOption, fg: darkOption }
    : { bg: darkOption, fg: lightOption };
}

function renderDynamicSuggestions(bgHexCode, textHexCode) {
  if (!suggestionsList) return;

  suggestionsList.querySelectorAll(".suggestion-item").forEach((el) => el.remove());
  suggestionsList.innerHTML = "";

  const pickedHex = activeTarget === "bg" ? bgHexCode : textHexCode;
  const otherHex = activeTarget === "bg" ? textHexCode : bgHexCode;
  const pickedRgb = hexToRgb(pickedHex);
  const pickedHsb = rgbToHsb(pickedRgb.r, pickedRgb.g, pickedRgb.b);

  const otherRgb = hexToRgb(otherHex);
  const otherHsb = rgbToHsb(otherRgb.r, otherRgb.g, otherRgb.b);
  const baseHue = pickedHsb.s > 4 ? pickedHsb.h : (otherHsb.s > 4 ? otherHsb.h : 342);
  const baseSat = pickedHsb.s > 4 ? pickedHsb.s : (otherHsb.s > 4 ? otherHsb.s : 65);

  const softTintHex = hsbToHex(baseHue, Math.min(20, Math.max(8, Math.round(baseSat * 0.25))), 98);
  const deepShadeHex = hsbToHex(baseHue, Math.min(85, Math.max(55, baseSat)), 22);
  const analogHex = hsbToHex((baseHue + 36) % 360, Math.min(78, Math.max(42, baseSat)), 72);

  const suggestions = [
    {
      hex: softTintHex,
      label: "Soft tint",
      pair: getBestReadablePair(softTintHex, pickedHex, "bg")
    },
    {
      hex: deepShadeHex,
      label: "Deep shade",
      pair: getBestReadablePair(deepShadeHex, otherHex, "text")
    },
    {
      hex: analogHex,
      label: "Analogous",
      pair: getBestReadablePair(analogHex, pickedHex, activeTarget)
    }
  ];

  suggestions.forEach((s) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "suggestion-item";
    btn.dataset.bg = s.pair.bg;
    btn.dataset.text = s.pair.fg;
    btn.title = `Apply pairing (${s.pair.bg} / ${s.pair.fg})`;

    const chip = document.createElement("span");
    chip.className = "suggestion-chip";
    chip.style.background = s.hex;

    const textWrap = document.createElement("span");
    textWrap.innerHTML = `<strong>${s.hex}</strong><small>${s.label}</small>`;

    btn.appendChild(chip);
    btn.appendChild(textWrap);

    btn.addEventListener("click", () => {
      bgPicker.value = btn.dataset.bg;
      textPicker.value = btn.dataset.text;
      updateAnalysis();
    });

    suggestionsList.appendChild(btn);
  });
}

// --- Sync UI ---
function syncSlidersFromActiveColor() {
  const hex = activeTarget === "bg" ? bgPicker.value : textPicker.value;
  const rgb = hexToRgb(hex);
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);

  hueSlider.value = hsb.h;
  satSlider.value = hsb.s;
  briSlider.value = hsb.b;

  hueVal.textContent = `${hsb.h}°`;
  satVal.textContent = `${hsb.s}%`;
  briVal.textContent = `${hsb.b}%`;

  rVal.textContent = rgb.r;
  gVal.textContent = rgb.g;
  bVal.textContent = rgb.b;

  drawColorWheel(hsb.h, hsb.s, hsb.b);
}

function updateAnalysis() {
  const bg = (normalizeHex(bgPicker.value) || "#FFF0F3");
  const fg = (normalizeHex(textPicker.value) || "#4A1525");

  bgPicker.value = bg;
  textPicker.value = fg;
  bgHex.value = bg;
  textHex.value = fg;
  previewBox.style.backgroundColor = bg;
  previewBox.style.color = fg;

  const ratio = getContrastRatio(bg, fg);
  contrastRatioEl.textContent = `${ratio.toFixed(1)}:1`;

  const passAA = ratio >= 4.5;
  const passAAA = ratio >= 7.0;

  badgeAA.textContent = passAA ? "AA ✓" : "AA ✕";
  badgeAA.className = `badge ${passAA ? "pass" : "fail"}`;

  badgeAAA.textContent = passAAA ? "AAA ✓" : "AAA ✕";
  badgeAAA.className = `badge ${passAAA ? "pass" : "fail"}`;

  if (passAAA) wcagHeadlineEl.textContent = "WCAG AA/AAA Pass";
  else if (passAA) wcagHeadlineEl.textContent = "WCAG AA Pass (AAA Fail)";
  else wcagHeadlineEl.textContent = "WCAG Contrast Fail";

  syncSlidersFromActiveColor();
  renderDynamicSuggestions(bg, fg);
}

function applySliderChange() {
  const rgb = hsbToRgb(Number(hueSlider.value), Number(satSlider.value), Number(briSlider.value));
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  if (activeTarget === "bg") bgPicker.value = hex;
  else textPicker.value = hex;
  updateAnalysis();
}

bgPicker.addEventListener("input", () => {
  activeTarget = "bg";
  activeTargetBtn.textContent = "Background selected";
  updateAnalysis();
});

textPicker.addEventListener("input", () => {
  activeTarget = "text";
  activeTargetBtn.textContent = "Text color selected";
  updateAnalysis();
});

bgHex.addEventListener("change", () => {
  const valid = normalizeHex(bgHex.value);
  if (valid) bgPicker.value = valid;
  updateAnalysis();
});

textHex.addEventListener("change", () => {
  const valid = normalizeHex(textHex.value);
  if (valid) textPicker.value = valid;
  updateAnalysis();
});

swapBtn.addEventListener("click", () => {
  const temp = bgPicker.value;
  bgPicker.value = textPicker.value;
  textPicker.value = temp;
  updateAnalysis();
});

activeTargetBtn.addEventListener("click", () => {
  activeTarget = activeTarget === "text" ? "bg" : "text";
  activeTargetBtn.textContent = activeTarget === "text" ? "Text color selected" : "Background selected";
  syncSlidersFromActiveColor();
  renderDynamicSuggestions(bgPicker.value.toUpperCase(), textPicker.value.toUpperCase());
});

[hueSlider, satSlider, briSlider].forEach((s) => s.addEventListener("input", applySliderChange));

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

copyCssBtn.addEventListener("click", async () => {
  const cssBlock = `:root {\n  --bg-color: ${bgPicker.value.toUpperCase()};\n  --text-color: ${textPicker.value.toUpperCase()};\n}`;
  try {
    await navigator.clipboard.writeText(cssBlock);
    showToast("Copied to Clipboard!");
  } catch {
    showToast("Copy failed — select manually.");
  }
});

// --- 5-Step Interactive Tutorial (Document-Anchored per Figma Mockups) ---
const tutorialCard = document.getElementById("tutorialCard");
const tutorialBackdrop = document.getElementById("tutorialBackdrop");
const tutStepLabel = document.getElementById("tutStepLabel");
const tutCountLabel = document.getElementById("tutCountLabel");
const tutTitle = document.getElementById("tutTitle");
const tutDesc = document.getElementById("tutDesc");
const tutSkipBtn = document.getElementById("tutSkipBtn");
const tutNextBtn = document.getElementById("tutNextBtn");
const replayTutorialBtn = document.getElementById("replayTutorialBtn");

document.body.appendChild(tutorialCard);

const tutorialSteps = [
  {
    targetId: "card-colors",
    placement: "step1",
    arrowClass: "arrow-left",
    title: "Pick Your Colors",
    desc: "Type hex codes (#FFF0F3 and #4A1525) or use the color wheel and sliders to set your background and text colors."
  },
  {
    targetId: "card-analysis",
    placement: "step2",
    arrowClass: "arrow-right",
    title: "Check WCAG Contrast",
    desc: "View your contrast ratio score and AA/AAA pass status to make sure your text stays easy to read."
  },
  {
    targetId: "card-analysis",
    placement: "step3",
    arrowClass: "arrow-right",
    title: "Preview Live Typography",
    desc: "See how your chosen colors look together on headings and body copy in real time."
  },
  {
    targetId: "card-suggestions",
    placement: "step4",
    arrowClass: "arrow-bottom",
    title: "Try Palette Suggestions",
    desc: "Click a suggested swatch to test ready-made color pairings and compare contrast scores quickly."
  },
  {
    targetId: "card-analysis",
    placement: "step5",
    arrowClass: "step-5-arrow",
    title: "Copy CSS Variables",
    desc: "Click Copy CSS Variables to copy your :root color tokens and paste them straight into your stylesheet."
  }
];

let currentStep = 0;

function clearTutorialClasses() {
  document.querySelectorAll(".tutorial-spotlight").forEach((el) => el.classList.remove("tutorial-spotlight"));
  tutorialCard.classList.remove("arrow-left", "arrow-right", "arrow-top", "arrow-bottom", "step-5-arrow");
}

function positionCalloutOnPage(targetEl, placement) {
  if (!targetEl) return;
  const rect = targetEl.getBoundingClientRect();
  const pageTop = rect.top + window.scrollY;
  const pageLeft = rect.left + window.scrollX;
  const cardWidth = tutorialCard.offsetWidth || 300;
  const cardHeight = tutorialCard.offsetHeight || 160;
  const gap = 14;

  let top = pageTop;
  let left = pageLeft;

  if (placement === "step1") {
    left = pageLeft + rect.width + gap;
    top = pageTop + 56;
  } else if (placement === "step2") {
    left = pageLeft - cardWidth - gap;
    top = pageTop + 44;
  } else if (placement === "step3") {
    const previewRect = previewBox.getBoundingClientRect();
    left = pageLeft - cardWidth - gap;
    top = previewRect.top + window.scrollY + 12;
  } else if (placement === "step4") {
    left = pageLeft + rect.width / 2 - cardWidth / 2;
    top = pageTop - cardHeight - gap;
  } else if (placement === "step5") {
    const btnRect = copyCssBtn.getBoundingClientRect();
    left = pageLeft - cardWidth - gap;
    top = btnRect.top + window.scrollY + btnRect.height / 2 - (cardHeight - 26);
  }

  const maxLeft = document.documentElement.clientWidth - cardWidth - 16;
  tutorialCard.style.left = `${Math.max(16, Math.min(left, maxLeft))}px`;
  tutorialCard.style.top = `${Math.max(16, top)}px`;
}

function renderTutorialStep(index) {
  clearTutorialClasses();
  const step = tutorialSteps[index];
  const targetEl = document.getElementById(step.targetId);

  if (targetEl) {
    targetEl.classList.add("tutorial-spotlight");
  }

  if (step.arrowClass) {
    tutorialCard.classList.add(step.arrowClass);
  }

  tutStepLabel.textContent = `STEP ${index + 1}`;
  tutCountLabel.textContent = `${index + 1} out of ${tutorialSteps.length}`;
  tutTitle.textContent = step.title;
  tutDesc.textContent = step.desc;
  tutNextBtn.textContent = index === tutorialSteps.length - 1 ? "DONE" : "NEXT >";

  tutorialCard.hidden = false;
  positionCalloutOnPage(targetEl, step.placement);
}

replayTutorialBtn.addEventListener("click", () => {
  currentStep = 0;
  tutorialBackdrop.hidden = false;
  renderTutorialStep(currentStep);
});

tutNextBtn.addEventListener("click", () => {
  if (currentStep < tutorialSteps.length - 1) {
    currentStep += 1;
    renderTutorialStep(currentStep);
  } else {
    clearTutorialClasses();
    tutorialBackdrop.hidden = true;
    tutorialCard.hidden = true;
  }
});

tutSkipBtn.addEventListener("click", () => {
  clearTutorialClasses();
  tutorialBackdrop.hidden = true;
  tutorialCard.hidden = true;
});

window.addEventListener("resize", () => {
  if (!tutorialBackdrop.hidden) {
    const step = tutorialSteps[currentStep];
    positionCalloutOnPage(document.getElementById(step.targetId), step.placement);
  }
});

tutorialCard.hidden = true;
initDefaultSwatches();
updateAnalysis();