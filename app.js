
"use strict";

const $ = (id) => document.getElementById(id);
const SAVE_KEY = "pf2e-remaster-builder-character-v1";

let pyodide = null;
let currentCharacter = null;

async function initializePython() {
  const status = $("engine-status");

  try {
    pyodide = await loadPyodide();
    const response = await fetch("./engine.py");

    if (!response.ok) {
      throw new Error("Could not load engine.py");
    }

    const pythonCode = await response.text();
    pyodide.runPython(pythonCode);

    status.textContent = "Python engine ready";
    status.dataset.state = "ready";
    $("form-message").textContent =
      "Ready. This version uses a limited starter rules dataset.";
  } catch (error) {
    status.textContent = "Engine failed to load";
    $("form-message").textContent =
      "Could not initialize Python. Check your connection and file paths.";
    console.error(error);
  }
}

function readForm() {
  const level = Number($("level").value);
  const currentLevel = Number($("current-level").value);

  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new Error("Target level must be an integer from 1 to 20.");
  }

  const workflow = $("workflow").value;

  if (workflow === "level-up") {
    if (
      !Number.isInteger(currentLevel) ||
      currentLevel < 1 ||
      currentLevel > 20
    ) {
      throw new Error("Current level must be an integer from 1 to 20.");
    }

    if (level < currentLevel) {
      throw new Error("Target level must be at least the current level.");
    }
  }

  const abilities = {};
  for (const ability of ["str", "dex", "con", "int", "wis", "cha"]) {
    const value = Number($(ability).value);

    if (!Number.isInteger(value) || value < 8 || value > 24) {
      throw new Error(`${ability.toUpperCase()} must be from 8 to 24.`);
    }

    abilities[ability] = value;
  }

  return {
    name: $("character-name").value,
    workflow,
    level,
    current_level: currentLevel,
    ancestry: $("ancestry").value,
    character_class: $("character-class").value,
    background: $("background").value,
    abilities
  };
}

async function calculateCharacter() {
  if (!pyodide) {
    $("form-message").textContent = "Python is not ready yet.";
    return;
  }

  try {
    const input = readForm();

    pyodide.globals.set("character_input_json", JSON.stringify(input));

    const resultJson = pyodide.runPython(`
import json
_character_input = json.loads(character_input_json)
json.dumps(calculate_character(_character_input))
`);

    currentCharacter = JSON.parse(resultJson);
    renderCharacter(currentCharacter);
    $("form-message").textContent = "Character calculated.";
  } catch (error) {
    $("form-message").textContent = error.message || "Calculation failed.";
  }
}

function renderCharacter(character) {
  const abilities = Object.entries(character.abilities)
    .map(([key, score]) => {
      const modifier = character.modifiers[key];
      const sign = modifier >= 0 ? "+" : "";
      return `<div class="stat">
        <span>${key.toUpperCase()}</span>
        <strong>${score} (${sign}${modifier})</strong>
      </div>`;
    })
    .join("");

  const levelUpDetails = character.workflow === "level-up"
    ? `<p>Previous level: ${character.current_level}</p>
       <p>Illustrative HP gained: ${character.hp_gained}</p>`
    : "";

  $("character-summary").innerHTML = `
    <h3>${escapeHtml(character.name)}</h3>
    <p>Level ${character.level} ${escapeHtml(character.ancestry)}
       ${escapeHtml(character.character_class)}</p>
    <p>Background: ${escapeHtml(character.background)}</p>
    <div class="stat-grid">
      <div class="stat">
        <span>Illustrative maximum HP</span>
        <strong>${character.max_hp}</strong>
      </div>
      <div class="stat">
        <span>Character level</span>
        <strong>${character.level}</strong>
      </div>
    </div>
    ${levelUpDetails}
    <h3>Abilities</h3>
    <div class="stat-grid">${abilities}</div>
    <p class="help">${escapeHtml(character.rules_status)}</p>
  `;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function saveLocal() {
  if (!currentCharacter) {
    $("save-message").textContent = "Calculate a character first.";
    return;
  }

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(currentCharacter));
    $("save-message").textContent = "Character saved in this browser.";
  } catch (error) {
    $("save-message").textContent =
      "Could not save. Browser storage may be unavailable or full.";
  }
}

function loadLocal() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);

    if (!saved) {
      $("save-message").textContent = "No browser save was found.";
      return;
    }

    const character = JSON.parse(saved);
    fillForm(character);
    $("save-message").textContent =
      "Save loaded into the form. Recalculate to refresh the summary.";
  } catch (error) {
    $("save-message").textContent = "The browser save could not be read.";
  }
}

function fillForm(character) {
  $("character-name").value = character.name || "My Adventurer";
  $("workflow").value = character.workflow || "high-level";
  $("level").value = character.level || 1;
  $("current-level").value = character.current_level || 1;
  $("ancestry").value = character.ancestry || "Human";
  $("character-class").value = character.character_class || "Fighter";
  $("background").value = character.background || "Scholar";

  for (const ability of ["str", "dex", "con", "int", "wis", "cha"]) {
    if (character.abilities && character.abilities[ability] !== undefined) {
      $(ability).value = character.abilities[ability];
    }
  }

  updateWorkflowFields();
}

function exportJson() {
  if (!currentCharacter) {
    $("save-message").textContent = "Calculate a character first.";
    return;
  }

  const blob = new Blob(
    [JSON.stringify(currentCharacter, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFilename(currentCharacter.name)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  $("save-message").textContent = "JSON export requested.";
}

function safeFilename(name) {
  return String(name || "character")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "character";
}

function importJson(file) {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const character = JSON.parse(reader.result);

      if (
        !character ||
        typeof character !== "object" ||
        !character.abilities
      ) {
        throw new Error("This does not look like a character JSON file.");
      }

      fillForm(character);
      $("save-message").textContent =
        "JSON imported. Recalculate to validate and refresh the summary.";
    } catch (error) {
      $("save-message").textContent =
        error.message || "Could not import this JSON file.";
    }
  };

  reader.onerror = () => {
    $("save-message").textContent = "Could not read the selected file.";
  };

  reader.readAsText(file);
}

function updateWorkflowFields() {
  $("level-up-fields").hidden = $("workflow").value !== "level-up";
}

$("workflow").addEventListener("change", updateWorkflowFields);
$("calculate-button").addEventListener("click", calculateCharacter);
$("save-local-button").addEventListener("click", saveLocal);
$("load-local-button").addEventListener("click", loadLocal);
$("export-button").addEventListener("click", exportJson);

$("import-button").addEventListener("click", () => {
  $("import-file").click();
});

$("import-file").addEventListener("change", (event) => {
  importJson(event.target.files[0]);
  event.target.value = "";
});

updateWorkflowFields();
initializePython();
