const RUNTIME_EVIDENCE_STORAGE_KEY = "aornum.runtime.evidence.v2";
const API_ENDPOINT = "api.php";
const IS_FILE_PROTOCOL = window.location.protocol === "file:";
const REMOTE_POLL_INTERVAL_MS = 5000;
const NOTE_UPLOAD_ACCEPT = "image/*,video/mp4,video/*,audio/mpeg,audio/mp3,audio/*,application/pdf,text/plain";
const FIXED_RELIC_LOOP_VIDEO = "assets/evidence/artifact-video-a01-closeup.mp4";
const FIXED_RELIC_FALLBACK_IMAGE = "assets/evidence/artifact-hologram-a01.png";

const state = {
  activeUser: null,
  usersByKey: {},
  baseEvidenceEntries: [],
  evidenceEntries: [],
  lastExecutedCommand: "",
  selectedEvidenceId: null,
  logLines: [],
  loadWarnings: [],
  apiEnabled: false,
  lastRemoteEvidenceSignature: "",
  remotePollTimer: null,
  syncPromise: Promise.resolve(),
  audioReady: false,
  audioContext: null
};

const hardcodedFallbackUsers = {
  "jordan walke": {
    displayName: "Jordan Walke",
    password: "crimson",
    role: "admin",
    accessLabel: "ADMIN / CRIMSON"
  },
  "jota alpha": {
    displayName: "Jota Alpha",
    password: "phoenix",
    role: "user",
    accessLabel: "INVESTIGADOR"
  },
  sadane: {
    displayName: "Sadane",
    password: "phoenix",
    role: "user",
    accessLabel: "INVESTIGADOR"
  },
  bernard: {
    displayName: "Bernard",
    password: "phoenix",
    role: "user",
    accessLabel: "INVESTIGADOR"
  }
};

const hardcodedFallbackEvidence = [
  {
    id: "ev-a01-hologram",
    command: "phx-01",
    aliases: ["a01", "fragmento-a01"],
    title: "Fragmento A-01 // Proyeccion holografica",
    type: "image",
    content: "assets/evidence/artifact-hologram-a01.png",
    summary: "Visual principal del artefacto y red de nodos detectada.",
    source: "Prop adjunto",
    active: true,
    access: "user"
  }
];

const embeddedUsersSeed = window.__USERS_SEED__;
const embeddedEvidenceSeed = window.__EVIDENCE_SEED__;
const fallbackUsers = (embeddedUsersSeed && typeof embeddedUsersSeed === "object")
  ? embeddedUsersSeed
  : hardcodedFallbackUsers;
const fallbackEvidence = Array.isArray(embeddedEvidenceSeed) && embeddedEvidenceSeed.length > 0
  ? embeddedEvidenceSeed
  : hardcodedFallbackEvidence;

const views = {
  login: document.querySelector("#loginView"),
  terminal: document.querySelector("#terminalView"),
  admin: document.querySelector("#adminView")
};

const elements = {
  loginForm: document.querySelector("#loginForm"),
  loginError: document.querySelector("#loginError"),
  availableUsersList: document.querySelector("#availableUsersList"),
  activeUserName: document.querySelector("#activeUserName"),
  activeAccessLevel: document.querySelector("#activeAccessLevel"),
  adminAccessButton: document.querySelector("#adminAccessButton"),
  contentTitle: document.querySelector("#contentTitle"),
  contentState: document.querySelector("#contentState"),
  projectionStage: document.querySelector("#projectionStage"),
  projectionCaption: document.querySelector("#projectionCaption"),
  contentViewport: document.querySelector("#contentViewport"),
  eventLog: document.querySelector("#eventLog"),
  commandInput: document.querySelector("#commandInput"),
  sendCommandButton: document.querySelector("#sendCommandButton"),
  logoutButton: document.querySelector("#logoutButton"),
  backToTerminalButton: document.querySelector("#backToTerminalButton"),
  adminEntryList: document.querySelector("#adminEntryList"),
  adminPreview: document.querySelector("#adminPreview"),
  adminMetaBox: document.querySelector("#adminMetaBox"),
  adminForm: document.querySelector("#adminForm"),
  entryIdInput: document.querySelector("#entryIdInput"),
  entryCommandInput: document.querySelector("#entryCommandInput"),
  entryTitleInput: document.querySelector("#entryTitleInput"),
  entryTypeInput: document.querySelector("#entryTypeInput"),
  entryAccessInput: document.querySelector("#entryAccessInput"),
  entryAudienceModeInput: document.querySelector("#entryAudienceModeInput"),
  entryCommandersInput: document.querySelector("#entryCommandersInput"),
  entryAliasesInput: document.querySelector("#entryAliasesInput"),
  entryContentInput: document.querySelector("#entryContentInput"),
  entryMediaInput: document.querySelector("#entryMediaInput"),
  entryFileInput: document.querySelector("#entryFileInput"),
  entrySummaryInput: document.querySelector("#entrySummaryInput"),
  entrySourceInput: document.querySelector("#entrySourceInput"),
  entryActiveInput: document.querySelector("#entryActiveInput"),
  entryHiddenInput: document.querySelector("#entryHiddenInput"),
  entryUnlockedForAllInput: document.querySelector("#entryUnlockedForAllInput"),
  newEntryButton: document.querySelector("#newEntryButton"),
  editEntryButton: document.querySelector("#editEntryButton"),
  deleteEntryButton: document.querySelector("#deleteEntryButton"),
  exportJsonButton: document.querySelector("#exportJsonButton"),
  resetRuntimeButton: document.querySelector("#resetRuntimeButton"),
  commanderUnlockPanel: document.querySelector("#commanderUnlockPanel")
};

const sectionRenderers = {
  help: renderHelp,
  ayuda: renderHelp,
  archivos: renderArchives,
  comunicaciones: renderCommunications,
  notas: renderNotes,
  nota: renderNotes,
  roster: renderRoster,
  rooster: renderRoster,
  observatorio: renderObservatory,
  "red phoenix": renderPhoenixNetwork,
  phoenix: renderPhoenixNetwork,
  perfil: renderProfile
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  await loadData();
  renderAvailableUsers();
  showView("login");
}

function bindEvents() {
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.sendCommandButton.addEventListener("click", executeCommandFromInput);
  elements.commandInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      executeCommandFromInput();
    }
  });

  elements.logoutButton.addEventListener("click", logout);
  elements.adminAccessButton.addEventListener("click", showAdminPanel);
  elements.backToTerminalButton.addEventListener("click", () => showView("terminal"));

  document.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("click", () => executeCommand(button.dataset.command));
  });

  document.querySelectorAll("[data-direction]").forEach((button) => {
    button.addEventListener("click", () => handleDirection(button.dataset.direction));
  });

  elements.adminForm.addEventListener("submit", saveAdminEntry);
  elements.newEntryButton.addEventListener("click", createNewAdminEntry);
  elements.editEntryButton.addEventListener("click", editSelectedAdminEntry);
  elements.deleteEntryButton.addEventListener("click", deleteSelectedAdminEntry);
  elements.exportJsonButton.addEventListener("click", exportEvidenceJson);
  elements.resetRuntimeButton.addEventListener("click", restoreFromBaseJson);
  elements.entryFileInput.addEventListener("change", handleAdminFileUpload);
  elements.entryTypeInput.addEventListener("change", refreshAdminPreview);
  elements.entryAudienceModeInput.addEventListener("change", refreshAdminPreview);
  elements.entryCommandersInput.addEventListener("input", refreshAdminPreview);
  elements.entryContentInput.addEventListener("input", refreshAdminPreview);
  elements.entryMediaInput.addEventListener("input", refreshAdminPreview);
  elements.entryTitleInput.addEventListener("input", refreshAdminPreview);
  elements.entryHiddenInput.addEventListener("change", refreshAdminPreview);
  elements.entryUnlockedForAllInput.addEventListener("change", refreshAdminPreview);
  elements.commanderUnlockPanel.addEventListener("click", handleUnlockPanelClick);
  document.querySelectorAll("[data-action='manual-refresh']").forEach((button) => {
    button.addEventListener("click", handleManualRefreshClick);
  });
  document.addEventListener("click", playUiSoundFromEvent, true);
  document.addEventListener("keydown", playUiSoundFromKey, true);
}

async function loadData() {
  const bootstrap = await loadBootstrapFromApi();
  if (bootstrap) {
    state.apiEnabled = true;
    state.usersByKey = bootstrap.users;
    state.baseEvidenceEntries = normalizeEvidenceList(bootstrap.evidence);
    state.evidenceEntries = normalizeEvidenceList(bootstrap.evidence);
    state.lastRemoteEvidenceSignature = buildEvidenceSignature(state.evidenceEntries);
    return;
  }

  state.usersByKey = await loadJsonFile("data/users.json", fallbackUsers, "users.json");
  state.baseEvidenceEntries = await loadJsonFile("data/evidence.json", fallbackEvidence, "evidence.json");
  state.baseEvidenceEntries = normalizeEvidenceList(state.baseEvidenceEntries);
  state.evidenceEntries = normalizeEvidenceList(loadRuntimeEvidence(state.baseEvidenceEntries));
  state.lastRemoteEvidenceSignature = buildEvidenceSignature(state.evidenceEntries);
}

async function loadBootstrapFromApi() {
  const payload = await fetchBootstrapPayload({ pushWarningOnError: true });
  if (!payload) {
    return null;
  }
  if (!payload?.ok || typeof payload.users !== "object" || !Array.isArray(payload.evidence)) {
    state.loadWarnings.push("API devolvio un payload invalido. Se usa modo local.");
    return null;
  }
  return payload;
}

async function fetchBootstrapPayload({ pushWarningOnError = false } = {}) {
  if (IS_FILE_PROTOCOL) {
    return null;
  }

  try {
    const response = await fetch(`${API_ENDPOINT}?action=bootstrap`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (pushWarningOnError) {
      state.loadWarnings.push(`API no disponible (${error.message}). Se usa modo local.`);
    }
    return null;
  }
}
async function loadJsonFile(path, fallbackData, label) {
  if (IS_FILE_PROTOCOL) {
    return cloneData(fallbackData);
  }

  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    const warning = `No se pudo cargar ${label} (${error.message}). Se usa fallback interno.`;
    state.loadWarnings.push(warning);
    return fallbackData;
  }
}

function loadRuntimeEvidence(baseEvidence) {
  try {
    const runtimeRaw = localStorage.getItem(RUNTIME_EVIDENCE_STORAGE_KEY);
    if (!runtimeRaw) {
      return cloneData(baseEvidence);
    }

    const runtimeEntries = JSON.parse(runtimeRaw);
    if (!Array.isArray(runtimeEntries)) {
      return cloneData(baseEvidence);
    }
    return mergeBaseWithRuntime(baseEvidence, runtimeEntries);
  } catch (error) {
    state.loadWarnings.push(`No se pudo cargar evidencia runtime (${error.message}).`);
    return cloneData(baseEvidence);
  }
}

function persistRuntimeEvidence() {
  localStorage.setItem(RUNTIME_EVIDENCE_STORAGE_KEY, JSON.stringify(state.evidenceEntries));
}

async function persistRuntimeEvidenceAndSync() {
  persistRuntimeEvidence();
  if (!state.apiEnabled) {
    return true;
  }
  return await enqueueEvidenceSync();
}

function enqueueEvidenceSync() {
  state.syncPromise = state.syncPromise.then(() => syncEvidenceToApi());
  return state.syncPromise;
}

async function syncEvidenceToApi() {
  try {
    const response = await fetch(`${API_ENDPOINT}?action=save-evidence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ evidence: state.evidenceEntries })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    if (!payload?.ok) {
      throw new Error(payload?.error || "save-evidence failed");
    }
    state.lastRemoteEvidenceSignature = buildEvidenceSignature(state.evidenceEntries);
    return true;
  } catch (error) {
    addLog(`ADVERTENCIA API: ${error.message}`);
    return false;
  }
}

function startRemoteEvidencePolling() {
  stopRemoteEvidencePolling();
  if (!state.apiEnabled || IS_FILE_PROTOCOL) {
    return;
  }
  state.remotePollTimer = setInterval(() => {
    void refreshEvidenceFromApi({ force: false, silent: true });
  }, REMOTE_POLL_INTERVAL_MS);
}

function stopRemoteEvidencePolling() {
  if (state.remotePollTimer) {
    clearInterval(state.remotePollTimer);
    state.remotePollTimer = null;
  }
}

async function refreshEvidenceFromApi({ force = false, silent = false } = {}) {
  if (!state.apiEnabled || !state.activeUser) {
    return false;
  }

  const payload = await fetchBootstrapPayload();
  if (!payload?.ok || !Array.isArray(payload.evidence)) {
    return false;
  }

  const remoteEvidence = normalizeEvidenceList(payload.evidence);
  const remoteSignature = buildEvidenceSignature(remoteEvidence);
  if (!force && remoteSignature === state.lastRemoteEvidenceSignature) {
    return false;
  }

  state.usersByKey = payload.users || state.usersByKey;
  state.baseEvidenceEntries = remoteEvidence;
  state.evidenceEntries = remoteEvidence;
  state.lastRemoteEvidenceSignature = remoteSignature;
  persistRuntimeEvidence();
  renderAvailableUsers();
  rerenderActiveView();
  if (!silent) {
    addLog("Evidencias actualizadas desde base remota");
  }
  return true;
}

function rerenderActiveView() {
  if (views.admin.classList.contains("is-active")) {
    renderAdminList();
    return;
  }

  if (!views.terminal.classList.contains("is-active")) {
    return;
  }

  const cmd = state.lastExecutedCommand;
  if (!cmd) {
    renderInitialContent();
    return;
  }

  if (sectionRenderers[cmd]) {
    sectionRenderers[cmd]();
    return;
  }

  const entry = findEvidenceByCommand(cmd);
  if (entry && evaluateEntryAccess(entry, state.activeUser).allowed) {
    renderTerminalEvidenceEntry(entry);
    setContentHeader(entry.title, "EVIDENCIA");
    return;
  }

  renderInitialContent();
}

async function handleManualRefreshClick(event) {
  event.preventDefault();
  const trigger = event.currentTarget;
  if (!(trigger instanceof HTMLButtonElement)) {
    return;
  }
  if (!state.activeUser) {
    return;
  }

  trigger.disabled = true;
  try {
    if (!state.apiEnabled) {
      rerenderActiveView();
      addLog("Recarga local completada");
      return;
    }

    const changed = await refreshEvidenceFromApi({ force: true, silent: false });
    if (!changed) {
      addLog("Recarga completada: sin cambios remotos");
    }
  } finally {
    trigger.disabled = false;
  }
}

function handleLogin(event) {
  event.preventDefault();

  const username = normalizeUserName(elements.loginForm.username.value);
  const password = elements.loginForm.password.value;
  const user = state.usersByKey[username];

  if (!user || user.password !== password) {
    elements.loginError.textContent = "ACCESO DENEGADO. VERIFIQUE USUARIO Y CONTRASENA.";
    return;
  }

  state.activeUser = { username, ...user };
  elements.loginError.textContent = "";
  elements.loginForm.reset();
  startTerminalSession();
}

function startTerminalSession() {
  state.lastExecutedCommand = "";
  elements.activeUserName.textContent = state.activeUser.displayName.toUpperCase();
  elements.activeAccessLevel.textContent = state.activeUser.accessLabel;
  elements.adminAccessButton.hidden = state.activeUser.role !== "admin";

  clearLog();
  addLog("Sistema iniciado");
  addLog("Conexion establecida");
  addLog(`Bienvenido, ${state.activeUser.displayName}`);
  addLog("Ingrese comando");
  state.loadWarnings.forEach((warning) => addLog(`ADVERTENCIA: ${warning}`));

  renderInitialContent();
  showView("terminal");
  startRemoteEvidencePolling();
  elements.commandInput.focus();
}

function logout() {
  stopRemoteEvidencePolling();
  state.activeUser = null;
  clearLog();
  showView("login");
  document.querySelector("#usernameInput").focus();
}

function showView(viewName) {
  Object.entries(views).forEach(([name, view]) => {
    const isActive = name === viewName;
    view.hidden = !isActive;
    view.classList.toggle("is-active", isActive);
  });
}

function executeCommandFromInput() {
  const command = elements.commandInput.value.trim();
  if (!command) {
    return;
  }

  elements.commandInput.value = "";
  executeCommand(command);
}

function executeCommand(rawCommand) {
  const normalized = normalizeCommand(rawCommand);
  addLog(`> ${rawCommand}`);

  if (normalized === "clear") {
    state.lastExecutedCommand = "";
    clearLog();
    addLog("Log reiniciado");
    renderInitialContent();
    return;
  }

  if (normalized === "logout" || normalized === "salir") {
    state.lastExecutedCommand = "";
    addLog("Cerrando sesion local");
    logout();
    return;
  }

  if (normalized === "admin") {
    state.lastExecutedCommand = normalized;
    showAdminPanel();
    return;
  }

  if (sectionRenderers[normalized]) {
    state.lastExecutedCommand = normalized;
    sectionRenderers[normalized]();
    return;
  }

  const entry = findEvidenceByCommand(normalized);

  const accessResult = evaluateEntryAccess(entry, state.activeUser);

  if (entry && accessResult.allowed) {
    state.lastExecutedCommand = normalized;
    renderTerminalEvidenceEntry(entry);
    setContentHeader(entry.title, "EVIDENCIA");
    addLog(`Evidencia cargada: ${entry.command}`);
    return;
  }

  if (entry && !accessResult.allowed) {
    const lockedMessage = accessResult.reason === "hidden_locked"
      ? "La evidencia existe pero permanece oculta para este comandante hasta ser desbloqueada."
      : "La evidencia solicitada requiere un nivel de acceso superior o no fue asignada a este comandante.";

    renderSystemMessage("ACCESO RESTRINGIDO", lockedMessage);
    addLog(`Acceso denegado: ${entry.command}`);
    return;
  }

  renderSystemMessage(
    "COMANDO NO RECONOCIDO",
    "No existe coincidencia en el archivo local. Use HELP para listar comandos disponibles."
  );
  addLog("Consulta sin coincidencia");
}

function renderInitialContent() {
  setContentHeader("ESPERANDO COMANDO", "EN ESPERA");
  setProjectionFromEntry(findEvidenceByCommand("phx 01"), "PROYECCION");
  elements.contentViewport.innerHTML = `
    <div class="empty-state no-media">
      <div>
        <p class="eyebrow">A.C.V. PHOENIX // NODO CENTRAL</p>
        <h3>Esperando comando de investigacion...</h3>
        <p>Ingrese HELP, ARCHIVOS, RED PHOENIX o un codigo de evidencia para cargar contenido narrativo.</p>
      </div>
    </div>
  `;
}

function renderHelp() {
  const evidenceCommands = state.evidenceEntries
    .filter((entry) => entry.active && evaluateEntryAccess(entry, state.activeUser).allowed)
    .map((entry) => entry.command.toUpperCase())
    .sort();

  const adminHint = state.activeUser?.role === "admin" ? ["ADMIN"] : [];
  renderDocument(
    "COMANDOS DISPONIBLES",
    [
      "HELP",
      "ARCHIVOS",
      "COMUNICACIONES",
      "NOTAS",
      "ROSTER",
      "OBSERVATORIO",
      "RED PHOENIX",
      "PERFIL",
      "CLEAR",
      "LOGOUT",
      ...adminHint,
      "",
      "EVIDENCIAS CARGADAS:",
      ...evidenceCommands
    ].join("\n")
  );
  setProjectionFromEntry(findEvidenceByCommand("phx 01"), "PROYECCION");
  addLog("Ayuda desplegada");
}

function renderArchives() {
  const items = state.evidenceEntries
    .filter((entry) => entry.active && evaluateEntryAccess(entry, state.activeUser).allowed)
    .map((entry) => `
      <button type="button" class="inline-command" data-inline-command="${escapeAttribute(entry.command)}">
        ${escapeHtml(entry.command.toUpperCase())} // ${escapeHtml(entry.title)} // ${escapeHtml(entry.type.toUpperCase())}
      </button>
    `)
    .join("");

  setContentHeader("ARCHIVOS DE EVIDENCIA", "LISTADO");
  elements.contentViewport.innerHTML = `
    <div class="document-view">
      <p class="eyebrow">REPOSITORIO RED PHOENIX</p>
      <h3>Entradas activas para la sesion</h3>
      <div class="inline-command-list">${items || "<p>No hay evidencias activas para este nivel de acceso.</p>"}</div>
    </div>
  `;
  setProjectionFromEntry(findEvidenceByCommand("stitch repo"), "PROYECCION");
  bindInlineCommands();
  addLog("Seccion Archivos abierta");
}

function renderCommunications() {
  const communicationEntries = state.evidenceEntries
    .filter((entry) => entry.active && isCommunicationEntry(entry) && entry.commStatus !== "draft" && evaluateEntryAccess(entry, state.activeUser).allowed)
    .sort((a, b) => {
      const aTime = Date.parse(a.createdAt || "") || 0;
      const bTime = Date.parse(b.createdAt || "") || 0;
      return bTime - aTime;
    });

  const preparedEntries = state.evidenceEntries
    .filter((entry) => entry.active && isCommunicationEntry(entry))
    .sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));

  const feedHtml = communicationEntries.length > 0
    ? communicationEntries.map((entry) => {
      const from = entry.from || entry.source || "SISTEMA";
      const when = entry.createdAt ? new Date(entry.createdAt).toLocaleString("es-ES") : "SIN MARCA DE TIEMPO";
      return `
        <article class="comm-item">
          <header>
            <strong>DE: ${escapeHtml(from)}</strong>
            <span>${escapeHtml(when)}</span>
          </header>
          <h4>${escapeHtml(entry.title || "COMUNICACION")}</h4>
          <p>${escapeHtml(entry.content || "")}</p>
        </article>
      `;
    }).join("")
    : "<p>No hay comunicaciones disponibles.</p>";

  const preparedOptions = preparedEntries.map((entry) => {
    const tag = entry.commStatus === "draft" ? "BORRADOR" : "PREPARADA";
    return `<option value="${escapeAttribute(entry.id)}">[${tag}] ${escapeHtml(entry.title || entry.command || "COMUNICACION")}</option>`;
  }).join("");

  const composerHtml = state.activeUser?.role === "admin"
    ? `
      <form id="commComposerForm" class="comm-composer">
        <p class="eyebrow">CANAL ADMINISTRATIVO</p>
        <input id="commDraftIdInput" type="hidden">
        <label>
          Comunicaciones preparadas
          <select id="commTemplateSelect">
            <option value="">(seleccionar)</option>
            ${preparedOptions}
          </select>
        </label>
        <div class="admin-actions">
          <button type="button" id="commLoadTemplateButton" class="secondary-button">CARGAR PREPARADA</button>
          <button type="button" id="commSendTemplateButton" class="secondary-button">ENVIAR SELECCIONADA</button>
        </div>
        <label>
          De
          <input id="commFromInput" type="text" value="${escapeAttribute(state.activeUser.displayName)}" required>
        </label>
        <label>
          Titulo
          <input id="commTitleInput" type="text" value="Comunicacion operativa" required>
        </label>
        <label>
          Mensaje
          <textarea id="commBodyInput" rows="4" required></textarea>
        </label>
        <button type="submit" class="primary-button">ENVIAR COMUNICACION</button>
        <div class="admin-actions">
          <button type="button" id="commSaveDraftButton" class="secondary-button">GUARDAR BORRADOR</button>
          <button type="button" id="commUpdateDraftButton" class="secondary-button">ACTUALIZAR BORRADOR</button>
        </div>
      </form>
    `
    : "";

  setContentHeader("COMUNICACIONES", "CANAL ACTIVO");
  elements.contentViewport.innerHTML = `
    <section class="comm-feed">
      <div class="comm-list">
        ${feedHtml}
      </div>
      ${composerHtml}
    </section>
  `;

  if (state.activeUser?.role === "admin") {
    const form = document.querySelector("#commComposerForm");
    if (form) {
      form.addEventListener("submit", handleAdminCommunicationSubmit);
    }
    bindCommunicationAdminControls();
  }
  setProjectionFromEntry(findEvidenceByCommand("transmision"), "PROYECCION");
  addLog("Seccion Comunicaciones abierta");
}

function bindCommunicationAdminControls() {
  const loadButton = document.querySelector("#commLoadTemplateButton");
  const sendTemplateButton = document.querySelector("#commSendTemplateButton");
  const saveDraftButton = document.querySelector("#commSaveDraftButton");
  const updateDraftButton = document.querySelector("#commUpdateDraftButton");

  if (loadButton) {
    loadButton.addEventListener("click", loadSelectedCommunicationTemplate);
  }
  if (sendTemplateButton) {
    sendTemplateButton.addEventListener("click", sendSelectedPreparedCommunication);
  }
  if (saveDraftButton) {
    saveDraftButton.addEventListener("click", () => saveCommunicationDraft({ updateExisting: false }));
  }
  if (updateDraftButton) {
    updateDraftButton.addEventListener("click", () => saveCommunicationDraft({ updateExisting: true }));
  }
}

function loadSelectedCommunicationTemplate() {
  const select = document.querySelector("#commTemplateSelect");
  if (!select?.value) {
    addLog("Seleccione una comunicacion preparada");
    return;
  }
  const selected = state.evidenceEntries.find((entry) => entry?.id === select.value && isCommunicationEntry(entry));
  if (!selected) {
    addLog("La comunicacion seleccionada ya no existe");
    return;
  }

  const fromInput = document.querySelector("#commFromInput");
  const titleInput = document.querySelector("#commTitleInput");
  const bodyInput = document.querySelector("#commBodyInput");
  const draftIdInput = document.querySelector("#commDraftIdInput");
  if (fromInput) {
    fromInput.value = selected.from || selected.source || state.activeUser?.displayName || "SISTEMA";
  }
  if (titleInput) {
    titleInput.value = selected.title || "Comunicacion operativa";
  }
  if (bodyInput) {
    bodyInput.value = selected.content || "";
  }
  if (draftIdInput) {
    draftIdInput.value = selected.commStatus === "draft" ? selected.id : "";
  }
  addLog(`Comunicacion preparada cargada: ${selected.title || selected.command}`);
}

async function sendSelectedPreparedCommunication() {
  const select = document.querySelector("#commTemplateSelect");
  if (!select?.value) {
    addLog("Seleccione una comunicacion preparada para enviar");
    return;
  }
  const selected = state.evidenceEntries.find((entry) => entry?.id === select.value && isCommunicationEntry(entry));
  if (!selected) {
    addLog("La comunicacion seleccionada ya no existe");
    return;
  }

  const now = new Date().toISOString();
  const audienceMode = selected.audienceMode === "specific" ? "specific" : "all";
  const commanders = audienceMode === "specific" ? (Array.isArray(selected.commanders) ? [...selected.commanders] : []) : [];
  const sentEntry = normalizeEvidenceEntry({
    ...selected,
    id: `ev-comm-${Date.now()}`,
    command: `comm-${Date.now()}`,
    access: "user",
    audienceMode,
    commanders,
    commStatus: "sent",
    createdAt: now,
    updatedAt: now,
    active: true,
    hidden: false,
    unlockedForAll: true
  });

  state.evidenceEntries.unshift(sentEntry);
  await persistRuntimeEvidenceAndSync();
  renderCommunications();
  addLog(`Comunicacion enviada desde preparada: ${sentEntry.title}`);
}

async function saveCommunicationDraft({ updateExisting }) {
  if (state.activeUser?.role !== "admin") {
    addLog("Accion denegada: solo admin puede gestionar borradores");
    return;
  }

  const fromInput = document.querySelector("#commFromInput");
  const titleInput = document.querySelector("#commTitleInput");
  const bodyInput = document.querySelector("#commBodyInput");
  const draftIdInput = document.querySelector("#commDraftIdInput");

  const from = fromInput?.value.trim() || state.activeUser.displayName;
  const title = titleInput?.value.trim() || "Comunicacion operativa";
  const content = bodyInput?.value.trim() || "";
  if (!content) {
    addLog("No se puede guardar un borrador vacio");
    return;
  }

  const now = new Date().toISOString();
  const existingDraftId = draftIdInput?.value.trim() || "";
  const shouldUpdate = updateExisting && existingDraftId;
  const draftId = shouldUpdate ? existingDraftId : `ev-comm-draft-${Date.now()}`;
  const draftCommand = shouldUpdate ? `comm-draft-${draftId}` : `comm-draft-${Date.now()}`;
  const existingDraft = shouldUpdate
    ? state.evidenceEntries.find((entry) => entry?.id === draftId && entry?.commStatus === "draft")
    : null;

  const draftEntry = normalizeEvidenceEntry({
    id: draftId,
    command: draftCommand,
    aliases: [],
    title,
    type: "text",
    content,
    summary: content.slice(0, 160),
    source: from,
    from,
    channel: "communications",
    kind: "communication",
    commStatus: "draft",
    createdAt: existingDraft?.createdAt || now,
    updatedAt: now,
    active: true,
    access: "admin",
    audienceMode: "all",
    commanders: ["jordan walke"],
    hidden: true,
    unlockedForAll: false,
    unlockedFor: []
  });

  const existingIndex = state.evidenceEntries.findIndex((entry) => entry?.id === draftId);
  if (existingIndex >= 0) {
    state.evidenceEntries[existingIndex] = draftEntry;
  } else {
    state.evidenceEntries.unshift(draftEntry);
  }

  await persistRuntimeEvidenceAndSync();
  if (draftIdInput) {
    draftIdInput.value = draftEntry.id;
  }
  renderCommunications();
  addLog(shouldUpdate ? `Borrador actualizado: ${title}` : `Borrador guardado: ${title}`);
}

async function handleAdminCommunicationSubmit(event) {
  event.preventDefault();

  if (state.activeUser?.role !== "admin") {
    addLog("Accion denegada: solo admin puede enviar comunicaciones");
    return;
  }

  const fromInput = document.querySelector("#commFromInput");
  const titleInput = document.querySelector("#commTitleInput");
  const bodyInput = document.querySelector("#commBodyInput");
  const from = fromInput?.value.trim() || state.activeUser.displayName;
  const title = titleInput?.value.trim() || "Comunicacion operativa";
  const content = bodyInput?.value.trim() || "";
  if (!content) {
    addLog("No se envio comunicacion vacia");
    return;
  }

  const now = new Date().toISOString();
  const newEntry = normalizeEvidenceEntry({
    id: `ev-comm-${Date.now()}`,
    command: `comm-${Date.now()}`,
    aliases: [],
    title,
    type: "text",
    content,
    summary: content.slice(0, 160),
    source: from,
    from,
    channel: "communications",
    kind: "communication",
    commStatus: "sent",
    createdAt: now,
    updatedAt: now,
    active: true,
    access: "user",
    audienceMode: "all",
    commanders: [],
    hidden: false,
    unlockedForAll: true,
    unlockedFor: []
  });

  state.evidenceEntries.unshift(newEntry);
  await persistRuntimeEvidenceAndSync();
  renderCommunications();
  addLog(`Comunicacion enviada como ${from}`);
}

function renderNotes() {
  const notes = state.evidenceEntries
    .filter((entry) => entry.active && isNoteEntry(entry) && evaluateEntryAccess(entry, state.activeUser).allowed)
    .sort((a, b) => {
      const aTime = Date.parse(a.createdAt || "") || 0;
      const bTime = Date.parse(b.createdAt || "") || 0;
      return bTime - aTime;
    });

  const notesListHtml = notes.length > 0
    ? notes.map((entry) => {
      const from = entry.from || entry.source || "DESCONOCIDO";
      const when = entry.createdAt ? new Date(entry.createdAt).toLocaleString("es-ES") : "SIN MARCA DE TIEMPO";
      const sharedLabel = entry.audienceMode === "specific" ? "COMPARTIDA" : "GLOBAL";
      const content = String(entry.content || "").trim();
      const preview = content || "(Nota sin texto)";
      return `
        <article class="note-item">
          <header>
            <strong>DE: ${escapeHtml(from)}</strong>
            <span>${escapeHtml(when)} // ${sharedLabel}</span>
          </header>
          <h4>${escapeHtml(entry.title || "NOTA DE CAMPO")}</h4>
          <p>${escapeHtml(preview)}</p>
          ${buildNoteAttachmentHtml(entry)}
        </article>
      `;
    }).join("")
    : "<p>No hay notas disponibles para este comandante.</p>";

  const targetUsers = Object.keys(state.usersByKey)
    .map((username) => normalizeUserName(username))
    .filter(Boolean)
    .filter((username) => username !== normalizeUserName(state.activeUser?.username || ""))
    .map((username) => {
      const user = state.usersByKey[username];
      if (!user) {
        return "";
      }
      return `
        <label class="note-target-option">
          <input type="checkbox" name="noteTargets" value="${escapeAttribute(username)}">
          <span>${escapeHtml(user.displayName)}</span>
        </label>
      `;
    })
    .join("");

  const composerHtml = state.activeUser
    ? `
      <form id="notesComposerForm" class="comm-composer">
        <p class="eyebrow">BITACORA DE COMANDANTE</p>
        <label>
          Titulo
          <input id="noteTitleInput" type="text" value="Nota de campo" required>
        </label>
        <label>
          Anotacion
          <textarea id="noteBodyInput" rows="4" placeholder="Registre hallazgos, hipotesis o coordenadas..."></textarea>
        </label>
        <label>
          Compartir con
          <select id="noteAudienceInput">
            <option value="all">todos los comandantes</option>
            <option value="specific">comandantes especificos</option>
          </select>
        </label>
        <div id="noteTargetsWrap" class="note-targets" hidden>
          ${targetUsers || "<p>No hay otros comandantes configurados.</p>"}
        </div>
        <label>
          Adjunto (opcional)
          <input id="noteFileInput" type="file" accept="${NOTE_UPLOAD_ACCEPT}">
        </label>
        <button type="submit" class="primary-button">GUARDAR NOTA</button>
      </form>
    `
    : "";

  setContentHeader("NOTAS DE CAMPO", "BITACORA");
  elements.contentViewport.innerHTML = `
    <section class="comm-feed">
      <div class="comm-list">
        ${notesListHtml}
      </div>
      ${composerHtml}
    </section>
  `;

  if (state.activeUser) {
    const form = document.querySelector("#notesComposerForm");
    const audienceInput = document.querySelector("#noteAudienceInput");
    if (form) {
      form.addEventListener("submit", handleCommanderNoteSubmit);
    }
    if (audienceInput) {
      audienceInput.addEventListener("change", toggleNoteTargetsByAudience);
      toggleNoteTargetsByAudience();
    }
  }

  setProjectionFromEntry(findEvidenceByCommand("phx 01"), "PROYECCION");
  addLog("Seccion Notas abierta");
}

function toggleNoteTargetsByAudience() {
  const audienceInput = document.querySelector("#noteAudienceInput");
  const targetsWrap = document.querySelector("#noteTargetsWrap");
  if (!audienceInput || !targetsWrap) {
    return;
  }
  targetsWrap.hidden = audienceInput.value !== "specific";
}

async function handleCommanderNoteSubmit(event) {
  event.preventDefault();

  if (!state.activeUser) {
    return;
  }

  const titleInput = document.querySelector("#noteTitleInput");
  const bodyInput = document.querySelector("#noteBodyInput");
  const audienceInput = document.querySelector("#noteAudienceInput");
  const fileInput = document.querySelector("#noteFileInput");

  const title = titleInput?.value.trim() || "Nota de campo";
  const content = bodyInput?.value.trim() || "";
  const audienceMode = audienceInput?.value === "specific" ? "specific" : "all";
  const authorUsername = normalizeUserName(state.activeUser.username || "");
  const targetCommanders = resolveNoteTargetCommanders(authorUsername, audienceMode);

  const file = fileInput?.files?.[0];
  let media = "";
  let mediaType = "";
  let mediaName = "";
  if (file) {
    try {
      media = await readFileAsDataUrl(file);
      mediaType = file.type || "";
      mediaName = file.name || "";
    } catch (error) {
      addLog(`Error al leer adjunto: ${error.message}`);
      return;
    }
  }

  if (!content && !media) {
    addLog("No se puede guardar una nota vacia");
    return;
  }

  const now = new Date().toISOString();
  const timestamp = Date.now();
  const summary = content ? content.slice(0, 160) : `Adjunto: ${mediaName || "archivo"}`;
  const newEntry = normalizeEvidenceEntry({
    id: `ev-note-${timestamp}-${authorUsername.replace(/\s+/g, "-")}`,
    command: `note-${timestamp}`,
    aliases: [],
    title,
    type: "text",
    content: content || "Nota sin texto. Ver adjunto.",
    summary,
    source: state.activeUser.displayName,
    from: state.activeUser.displayName,
    authorUsername,
    media,
    mediaType,
    mediaName,
    channel: "notes",
    kind: "note",
    createdAt: now,
    active: true,
    access: "user",
    audienceMode,
    commanders: targetCommanders,
    hidden: false,
    unlockedForAll: true,
    unlockedFor: []
  });

  state.evidenceEntries.unshift(newEntry);
  await persistRuntimeEvidenceAndSync();
  renderNotes();
  addLog(`Nota guardada por ${state.activeUser.displayName}`);
}

function resolveNoteTargetCommanders(authorUsername, audienceMode) {
  if (audienceMode !== "specific") {
    return [];
  }

  const selected = Array.from(document.querySelectorAll("input[name='noteTargets']:checked"))
    .map((input) => normalizeUserName(input.value || ""))
    .filter(Boolean);

  if (!selected.includes(authorUsername)) {
    selected.push(authorUsername);
  }

  return Array.from(new Set(selected));
}

function buildNoteAttachmentHtml(entry) {
  const source = String(entry.media || "").trim();
  if (!source) {
    return "";
  }

  const mediaType = resolveMediaType(entry, source);
  const mediaName = String(entry.mediaName || "adjunto");

  if (mediaType === "image") {
    return `
      <figure class="note-attachment">
        <img src="${escapeAttribute(source)}" alt="${escapeAttribute(mediaName)}">
      </figure>
    `;
  }

  if (mediaType === "video") {
    return `
      <figure class="note-attachment">
        <video controls preload="metadata">
          <source src="${escapeAttribute(source)}">
        </video>
      </figure>
    `;
  }

  if (mediaType === "audio") {
    return `
      <div class="note-attachment">
        <audio controls preload="metadata">
          <source src="${escapeAttribute(source)}">
        </audio>
      </div>
    `;
  }

  return `
    <p class="note-attachment-link">
      <a href="${escapeAttribute(source)}" download="${escapeAttribute(mediaName)}">Descargar adjunto: ${escapeHtml(mediaName)}</a>
    </p>
  `;
}

function renderRoster() {
  const rosterEntries = state.evidenceEntries
    .filter((entry) => entry.active && isRosterEntry(entry) && evaluateEntryAccess(entry, state.activeUser).allowed)
    .sort((a, b) => {
      const aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
      const bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
      return bTime - aTime;
    });

  const cardsHtml = rosterEntries.length > 0
    ? rosterEntries.map((entry) => {
      const ownerUsername = normalizeUserName(entry.rosterOwner || entry.authorUsername || "");
      const ownerUser = state.usersByKey[ownerUsername];
      const ownerName = ownerUser?.displayName || entry.from || entry.source || "COMANDANTE";
      const data = entry.rosterData || {};
      const media = String(entry.media || "").trim();
      const mediaType = media ? resolveMediaType(entry, media) : "";
      let mediaHtml = "";
      if (mediaType === "image") {
        mediaHtml = `<img src="${escapeAttribute(media)}" alt="${escapeAttribute(ownerName)}">`;
      } else if (mediaType === "video") {
        mediaHtml = `
          <video controls preload="metadata">
            <source src="${escapeAttribute(media)}">
          </video>
        `;
      } else if (mediaType === "audio") {
        mediaHtml = `
          <audio controls preload="metadata">
            <source src="${escapeAttribute(media)}">
          </audio>
        `;
      }

      return `
        <article class="roster-card">
          <header>
            <strong>${escapeHtml(ownerName)}</strong>
            <span>${escapeHtml((entry.updatedAt || entry.createdAt || "").replace("T", " ").replace("Z", " UTC") || "SIN ACTUALIZACION")}</span>
          </header>
          ${mediaHtml ? `<div class="roster-media">${mediaHtml}</div>` : ""}
          <div class="roster-grid">
            <p><span>Callsign</span>${escapeHtml(data.callsign || "-")}</p>
            <p><span>Rol</span>${escapeHtml(data.role || "-")}</p>
            <p><span>Nave insignia</span>${escapeHtml(data.ship || "-")}</p>
            <p><span>Ala / Flota</span>${escapeHtml(data.wing || "-")}</p>
            <p><span>Especialidad</span>${escapeHtml(data.specialty || "-")}</p>
            <p><span>Estado</span>${escapeHtml(data.status || "-")}</p>
          </div>
          <p class="roster-bio">${escapeHtml(data.bio || "Sin anotaciones de perfil.")}</p>
        </article>
      `;
    }).join("")
    : "<p>No hay roster cargado todavia.</p>";

  const myRoster = getRosterEntryForUser(state.activeUser?.username || "");
  const rosterData = myRoster?.rosterData || {};
  const myAudience = myRoster?.audienceMode === "specific" ? "specific" : "all";

  setContentHeader("ROSTER DE COMANDANTES", "PERFILES");
  elements.contentViewport.innerHTML = `
    <section class="roster-layout">
      <div class="roster-list">
        ${cardsHtml}
      </div>
      <form id="rosterForm" class="comm-composer">
        <p class="eyebrow">EDITAR MI ROSTER</p>
        <label>
          Callsign
          <input id="rosterCallsignInput" type="text" value="${escapeAttribute(rosterData.callsign || "")}" placeholder="CMDR ...">
        </label>
        <label>
          Rol
          <input id="rosterRoleInput" type="text" value="${escapeAttribute(rosterData.role || "")}" placeholder="Explorador / Investigador / Seguridad">
        </label>
        <label>
          Nave insignia
          <input id="rosterShipInput" type="text" value="${escapeAttribute(rosterData.ship || "")}" placeholder="Nombre de nave">
        </label>
        <label>
          Ala / Flota
          <input id="rosterWingInput" type="text" value="${escapeAttribute(rosterData.wing || "")}" placeholder="Ala o carrier">
        </label>
        <label>
          Especialidad
          <input id="rosterSpecialtyInput" type="text" value="${escapeAttribute(rosterData.specialty || "")}" placeholder="Xenoarqueologia, combate, logistica...">
        </label>
        <label>
          Estado operativo
          <input id="rosterStatusInput" type="text" value="${escapeAttribute(rosterData.status || "")}" placeholder="Activo / En despliegue / Reserva">
        </label>
        <label>
          Bio breve
          <textarea id="rosterBioInput" rows="3" placeholder="Resumen del comandante">${escapeHtml(rosterData.bio || "")}</textarea>
        </label>
        <label>
          Visibilidad
          <select id="rosterAudienceInput">
            <option value="all"${myAudience === "all" ? " selected" : ""}>visible para todos</option>
            <option value="specific"${myAudience === "specific" ? " selected" : ""}>solo comandantes especificos</option>
          </select>
        </label>
        <label>
          Comandantes objetivo (si visibilidad especifica)
          <input id="rosterTargetsInput" type="text" value="${escapeAttribute((myRoster?.commanders || []).join(", "))}" placeholder="jota alpha, sadane, jordan walke">
        </label>
        <label>
          Adjunto MP4/MP3 (opcional)
          <input id="rosterFileInput" type="file" accept="video/mp4,audio/mpeg,audio/mp3,video/*,audio/*,image/*">
        </label>
        <button type="submit" class="primary-button">GUARDAR MI ROSTER</button>
      </form>
    </section>
  `;

  const form = document.querySelector("#rosterForm");
  if (form) {
    form.addEventListener("submit", handleRosterSubmit);
  }

  setProjectionFromEntry(myRoster || findEvidenceByCommand("phx 01"), "PROYECCION");
  addLog("Seccion Roster abierta");
}

function getRosterEntryForUser(username) {
  const normalized = normalizeUserName(username || "");
  if (!normalized) {
    return null;
  }
  return state.evidenceEntries.find((entry) => {
    if (!entry || !isRosterEntry(entry)) {
      return false;
    }
    const owner = normalizeUserName(entry.rosterOwner || entry.authorUsername || "");
    return owner === normalized;
  }) || null;
}

async function handleRosterSubmit(event) {
  event.preventDefault();
  if (!state.activeUser) {
    return;
  }

  const ownerUsername = normalizeUserName(state.activeUser.username || "");
  const ownerDisplay = state.activeUser.displayName || ownerUsername;
  const existing = getRosterEntryForUser(ownerUsername);

  const callsign = String(document.querySelector("#rosterCallsignInput")?.value || "").trim();
  const role = String(document.querySelector("#rosterRoleInput")?.value || "").trim();
  const ship = String(document.querySelector("#rosterShipInput")?.value || "").trim();
  const wing = String(document.querySelector("#rosterWingInput")?.value || "").trim();
  const specialty = String(document.querySelector("#rosterSpecialtyInput")?.value || "").trim();
  const status = String(document.querySelector("#rosterStatusInput")?.value || "").trim();
  const bio = String(document.querySelector("#rosterBioInput")?.value || "").trim();
  const audienceMode = String(document.querySelector("#rosterAudienceInput")?.value || "all") === "specific" ? "specific" : "all";
  const rawTargets = String(document.querySelector("#rosterTargetsInput")?.value || "");
  const commanders = audienceMode === "specific"
    ? rawTargets.split(",").map((item) => normalizeUserName(item)).filter(Boolean)
    : [];

  if (audienceMode === "specific" && !commanders.includes(ownerUsername)) {
    commanders.push(ownerUsername);
  }

  const file = document.querySelector("#rosterFileInput")?.files?.[0];
  let media = existing?.media || "";
  let mediaType = existing?.mediaType || "";
  let mediaName = existing?.mediaName || "";
  if (file) {
    media = await readFileAsDataUrl(file);
    mediaType = file.type || "";
    mediaName = file.name || "";
  }

  const now = new Date().toISOString();
  const entry = normalizeEvidenceEntry({
    id: existing?.id || `ev-roster-${ownerUsername.replace(/\s+/g, "-")}`,
    command: `roster-${ownerUsername.replace(/\s+/g, "-")}`,
    aliases: [`roster ${ownerUsername}`, `perfil ${ownerUsername}`],
    title: `Roster // ${ownerDisplay}`,
    type: "text",
    content: `Roster de ${ownerDisplay}`,
    summary: bio || `${ownerDisplay} actualizo su roster`,
    source: ownerDisplay,
    from: ownerDisplay,
    authorUsername: ownerUsername,
    rosterOwner: ownerUsername,
    rosterData: { callsign, role, ship, wing, specialty, status, bio },
    media,
    mediaType,
    mediaName,
    channel: "roster",
    kind: "roster",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    active: true,
    access: "user",
    audienceMode,
    commanders,
    hidden: false,
    unlockedForAll: true,
    unlockedFor: []
  });

  const index = state.evidenceEntries.findIndex((item) => item?.id === entry.id);
  if (index >= 0) {
    state.evidenceEntries[index] = entry;
  } else {
    state.evidenceEntries.unshift(entry);
  }

  await persistRuntimeEvidenceAndSync();
  renderRoster();
  addLog(`Roster actualizado: ${ownerDisplay}`);
}

function renderObservatory() {
  renderDocument(
    "OBSERVATORIO",
    "Telemetria en modo pasivo.\n\nNo se detectan rutas finales confirmadas.\nConsulte DOSSIER-A01 y MAPA-NODOS para contexto tactico."
  );
  setProjectionFromEntry(findEvidenceByCommand("dossier a01"), "PROYECCION");
  addLog("Seccion Observatorio abierta");
}

function renderPhoenixNetwork() {
  setContentHeader("RED PHOENIX", "MAPA PARCIAL");
  elements.contentViewport.innerHTML = `
    <div class="network-map">
      <div class="network-node active">A-01<span>RECUPERADO</span></div>
      <div class="network-node locked">C-07<span>BLOQUEADO</span></div>
      <div class="network-node partial">K-11<span>INCOMPLETO</span></div>
      <div class="network-node unknown">OMEGA<span>NO VERIFICADO</span></div>
      <p>Los nodos disponibles operan como indices y referencias cruzadas. Revise las evidencias de tipo mapa para ampliar correlaciones.</p>
    </div>
  `;
  setProjectionFromEntry(findEvidenceByCommand("stitch terminal"), "PROYECCION");
  addLog("Red Phoenix renderizada");
}

function renderProfile() {
  const user = state.activeUser;
  renderDocument(
    "PERFIL DE SESION",
    `USUARIO: ${user.displayName.toUpperCase()}\nNIVEL: ${user.accessLabel}\nROL: ${user.role.toUpperCase()}\nNODO: A.C.V. PHOENIX / CENTRAL\nESTADO: SESION LOCAL ACTIVA`
  );
  setProjectionFromEntry(findEvidenceByCommand("stitch perfil"), "PROYECCION");
  addLog("Perfil de sesion consultado");
}

function renderDocument(title, body) {
  setContentHeader(title, "DOCUMENTO");
  elements.contentViewport.innerHTML = `
    <article class="document-view">
      <p class="eyebrow">ARCHIVO AORNUM // LECTURA LOCAL</p>
      <h3>${escapeHtml(title)}</h3>
      <pre>${escapeHtml(body)}</pre>
    </article>
  `;
}

function renderSystemMessage(title, body) {
  setContentHeader(title, "SISTEMA");
  elements.contentViewport.innerHTML = `
    <div class="system-message">
      <p class="eyebrow">MENSAJE DEL SISTEMA</p>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
    </div>
  `;
}

function renderEvidenceEntry(entry, target) {
  target.innerHTML = "";
  const mediaSource = getEntryMediaSource(entry);

  if (entry.type === "image") {
    target.innerHTML = `
      <figure class="media-view">
        <img src="${escapeAttribute(entry.content)}" alt="${escapeAttribute(entry.title)}">
        <figcaption>${escapeHtml(entry.title)} // ${escapeHtml(entry.source || "sin fuente")}</figcaption>
      </figure>
    `;
    return;
  }

  if (entry.type === "video") {
    if (isPlaceholderVideoSource(entry.content)) {
      target.innerHTML = `
        <figure class="media-view">
          <div class="video-placeholder">
            <p class="eyebrow">VIDEO // FUENTE PENDIENTE</p>
            <h3>${escapeHtml(entry.title)}</h3>
            <p>URL placeholder editable desde data/evidence.json o desde el panel admin.</p>
            <code>${escapeHtml(entry.content || "sin-ruta-definida")}</code>
          </div>
          <figcaption>${escapeHtml(entry.title)} // ${escapeHtml(entry.command.toUpperCase())}</figcaption>
        </figure>
      `;
      return;
    }

    target.innerHTML = `
      <figure class="media-view">
        <video controls preload="metadata">
          <source src="${escapeAttribute(entry.content)}">
        </video>
        <figcaption>${escapeHtml(entry.title)} // ${escapeHtml(entry.source || "sin fuente")}</figcaption>
      </figure>
    `;
    return;
  }

  if (entry.type === "audio") {
    target.innerHTML = `
      <figure class="media-view">
        <audio controls preload="metadata">
          <source src="${escapeAttribute(entry.content)}">
        </audio>
        <figcaption>${escapeHtml(entry.title)} // ${escapeHtml(entry.source || "sin fuente")}</figcaption>
      </figure>
    `;
    return;
  }

  if (entry.type === "text" && mediaSource) {
    const embeddedType = resolveMediaType(entry, mediaSource);
    let embeddedHtml = "";
    if (embeddedType === "image") {
      embeddedHtml = `
        <figure class="media-view embedded-media">
          <img src="${escapeAttribute(mediaSource)}" alt="${escapeAttribute(entry.title || "Evidencia")}">
          <figcaption>${escapeHtml(entry.title)} // ${escapeHtml(entry.source || "sin fuente")}</figcaption>
        </figure>
      `;
    } else if (embeddedType === "video") {
      embeddedHtml = `
        <figure class="media-view embedded-media">
          <video controls preload="metadata">
            <source src="${escapeAttribute(mediaSource)}">
          </video>
          <figcaption>${escapeHtml(entry.title)} // ${escapeHtml(entry.source || "sin fuente")}</figcaption>
        </figure>
      `;
    } else if (embeddedType === "audio") {
      embeddedHtml = `
        <figure class="media-view embedded-media">
          <audio controls preload="metadata">
            <source src="${escapeAttribute(mediaSource)}">
          </audio>
          <figcaption>${escapeHtml(entry.title)} // ${escapeHtml(entry.source || "sin fuente")}</figcaption>
        </figure>
      `;
    } else {
      const downloadName = entry.mediaName || "adjunto";
      embeddedHtml = `
        <p><a href="${escapeAttribute(mediaSource)}" download="${escapeAttribute(downloadName)}">Descargar adjunto: ${escapeHtml(downloadName)}</a></p>
      `;
    }

    target.innerHTML = `
      <article class="document-view">
        ${embeddedHtml}
        <p class="eyebrow">EVIDENCIA // ${escapeHtml(entry.command.toUpperCase())}</p>
        <h3>${escapeHtml(entry.title)}</h3>
        <pre>${escapeHtml(entry.content)}</pre>
        ${entry.summary ? `<p>${escapeHtml(entry.summary)}</p>` : ""}
      </article>
    `;
    return;
  }

  target.innerHTML = `
    <article class="document-view">
      <p class="eyebrow">EVIDENCIA // ${escapeHtml(entry.command.toUpperCase())}</p>
      <h3>${escapeHtml(entry.title)}</h3>
      <pre>${escapeHtml(entry.content)}</pre>
      ${entry.summary ? `<p>${escapeHtml(entry.summary)}</p>` : ""}
    </article>
  `;
}

function renderTerminalEvidenceEntry(entry) {
  setProjectionFromEntry(entry, "PROYECCION");
  renderEvidenceEntry(entry, elements.contentViewport);
}

function setProjectionFromEntry(entry, prefix = "PROYECCION") {
  if (!elements.projectionStage || !elements.projectionCaption) {
    return;
  }

  elements.projectionStage.innerHTML = `
    <video autoplay muted loop playsinline preload="metadata">
      <source src="${escapeAttribute(FIXED_RELIC_LOOP_VIDEO)}" type="video/mp4">
      <img src="${escapeAttribute(FIXED_RELIC_FALLBACK_IMAGE)}" alt="Proyeccion fija de reliquia">
    </video>
  `;
  elements.projectionCaption.textContent = `${prefix} // RELIQUIA A-01 // LOOP ESTABLE`;
}

function getEntryMediaSource(entry) {
  if (!entry) {
    return "";
  }
  if (entry.type === "image") {
    return String(entry.content || "").trim();
  }
  if (entry.type === "audio" || entry.type === "video") {
    return String(entry.content || "").trim();
  }
  if (entry.type === "text") {
    return String(entry.media || "").trim();
  }
  return "";
}

function resolveMediaType(entry, source) {
  const fromEntry = String(entry?.mediaType || "").toLowerCase();
  if (fromEntry.startsWith("image/")) {
    return "image";
  }
  if (fromEntry.startsWith("video/")) {
    return "video";
  }
  if (fromEntry.startsWith("audio/")) {
    return "audio";
  }

  const src = String(source || "").toLowerCase();
  if (src.startsWith("data:image/")) {
    return "image";
  }
  if (src.startsWith("data:video/")) {
    return "video";
  }
  if (src.startsWith("data:audio/")) {
    return "audio";
  }
  if (/\.(png|jpg|jpeg|webp|gif|bmp|svg)(\?|#|$)/.test(src)) {
    return "image";
  }
  if (/\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/.test(src)) {
    return "video";
  }
  if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?|#|$)/.test(src)) {
    return "audio";
  }
  return "file";
}

function setContentHeader(title, stateLabel) {
  elements.contentTitle.textContent = title;
  elements.contentState.textContent = stateLabel;
}

function handleDirection(direction) {
  addLog(`Entrada direccional: ${direction}`);
}

function showAdminPanel() {
  if (!state.activeUser || state.activeUser.role !== "admin") {
    addLog("Acceso administrativo denegado");
    return;
  }

  renderAdminList();
  showView("admin");
}

function renderAdminList() {
  const entries = state.evidenceEntries.filter(Boolean);
  elements.adminEntryList.innerHTML = "";

  entries.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "admin-entry-button";
    button.classList.toggle("is-selected", entry.id === state.selectedEvidenceId);
    const scopeLabel = entry.audienceMode === "specific" ? "ASIGNADA" : "GLOBAL";
    const hiddenLabel = entry.hidden ? "OCULTA" : "VISIBLE";
    button.innerHTML = `
      <strong>${escapeHtml(entry.command.toUpperCase())}</strong>
      <span>${escapeHtml(entry.title)}</span>
      <em>${entry.active ? "ACTIVO" : "INACTIVO"} // ${escapeHtml((entry.access || "user").toUpperCase())} // ${scopeLabel} // ${hiddenLabel}</em>
    `;
    button.addEventListener("click", () => selectAdminEvidence(entry.id));
    elements.adminEntryList.append(button);
  });

  const first = entries.find((item) => item.id === state.selectedEvidenceId) || entries[0];
  if (first) {
    selectAdminEvidence(first.id);
  } else {
    createNewAdminEntry();
  }
}

function selectAdminEvidence(entryId) {
  state.selectedEvidenceId = entryId;
  const index = state.evidenceEntries.findIndex((item) => item.id === entryId);
  if (index < 0) {
    return;
  }
  const entry = normalizeEvidenceEntry(state.evidenceEntries[index]);
  state.evidenceEntries[index] = entry;
  if (!entry) {
    return;
  }

  elements.entryIdInput.value = entry.id || "";
  elements.entryCommandInput.value = entry.command || "";
  elements.entryTitleInput.value = entry.title || "";
  elements.entryTypeInput.value = entry.type || "text";
  elements.entryAccessInput.value = entry.access || "user";
  elements.entryAudienceModeInput.value = entry.audienceMode || "all";
  elements.entryCommandersInput.value = (entry.commanders || []).join(", ");
  elements.entryAliasesInput.value = (entry.aliases || []).join(", ");
  elements.entryContentInput.value = entry.content || "";
  elements.entryMediaInput.value = entry.media || "";
  elements.entrySummaryInput.value = entry.summary || "";
  elements.entrySourceInput.value = entry.source || "";
  elements.entryActiveInput.checked = !!entry.active;
  elements.entryHiddenInput.checked = !!entry.hidden;
  elements.entryUnlockedForAllInput.checked = !!entry.unlockedForAll;
  elements.entryFileInput.value = "";
  elements.editEntryButton.disabled = false;

  renderEvidenceEntry(entry, elements.adminPreview);
  elements.adminMetaBox.innerHTML = `
    <p><strong>Comando:</strong> ${escapeHtml(entry.command)}</p>
    <p><strong>Tipo:</strong> ${escapeHtml(entry.type)}</p>
    <p><strong>Acceso:</strong> ${escapeHtml(entry.access || "user")}</p>
    <p><strong>Alcance:</strong> ${escapeHtml(entry.audienceMode === "specific" ? "comandantes especificos" : "todos")}</p>
    <p><strong>Activo:</strong> ${entry.active ? "si" : "no"}</p>
    <p><strong>Oculta:</strong> ${entry.hidden ? "si" : "no"}</p>
    <p><strong>Media asociada:</strong> ${entry.media ? "si" : "no"}</p>
    <p><strong>Tamano contenido:</strong> ${String(entry.content || "").length} chars</p>
  `;
  renderUnlockPanel(entry);

  renderAdminSelection();
}

function createNewAdminEntry() {
  state.selectedEvidenceId = null;
  elements.entryIdInput.value = "";
  elements.entryCommandInput.value = "";
  elements.entryTitleInput.value = "";
  elements.entryTypeInput.value = "text";
  elements.entryAccessInput.value = "user";
  elements.entryAudienceModeInput.value = "all";
  elements.entryCommandersInput.value = "";
  elements.entryAliasesInput.value = "";
  elements.entryContentInput.value = "";
  elements.entryMediaInput.value = "";
  elements.entrySummaryInput.value = "";
  elements.entrySourceInput.value = "Carga admin local";
  elements.entryActiveInput.checked = true;
  elements.entryHiddenInput.checked = false;
  elements.entryUnlockedForAllInput.checked = false;
  elements.entryFileInput.value = "";
  elements.editEntryButton.disabled = true;
  elements.adminMetaBox.innerHTML = `
    <p><strong>Nueva entrada</strong></p>
    <p>Complete los campos y use GUARDAR.</p>
    <p>Para imagen/video puede pegar ruta/URL o cargar archivo local.</p>
  `;
  elements.commanderUnlockPanel.innerHTML = `
    <p><strong>Desbloqueos por comandante</strong></p>
    <p>Primero guarde la entrada para poder gestionar desbloqueos individuales.</p>
  `;
  renderAdminSelection();
  refreshAdminPreview();
}

function editSelectedAdminEntry() {
  const id = elements.entryIdInput.value.trim();
  if (!id) {
    addLog("Admin: seleccione una entrada para editar");
    return;
  }

  const entry = state.evidenceEntries.find((item) => item.id === id);
  if (!entry) {
    addLog("Admin: la entrada seleccionada ya no existe");
    return;
  }

  selectAdminEvidence(id);
  elements.entryTitleInput.focus();
  addLog(`Admin en modo edicion: ${entry.command}`);
}

async function saveAdminEntry(event) {
  event.preventDefault();
  const entry = buildEntryFromForm();
  const existing = state.evidenceEntries.find((item) => item.id === entry.id);
  if (existing && Array.isArray(existing.unlockedFor)) {
    entry.unlockedFor = [...existing.unlockedFor];
  }

  const existingIndex = state.evidenceEntries.findIndex((item) => item.id === entry.id);
  if (existingIndex >= 0) {
    state.evidenceEntries[existingIndex] = entry;
  } else {
    state.evidenceEntries.unshift(entry);
  }

  await persistRuntimeEvidenceAndSync();
  state.selectedEvidenceId = entry.id;
  renderAdminList();
  selectAdminEvidence(entry.id);
  addLog(`Admin guardo entrada: ${entry.command}`);
}

async function deleteSelectedAdminEntry() {
  const id = elements.entryIdInput.value.trim();
  if (!id) {
    addLog("Admin: no hay entrada seleccionada para eliminar");
    return;
  }

  state.evidenceEntries = state.evidenceEntries.filter((item) => item.id !== id);
  await persistRuntimeEvidenceAndSync();
  addLog("Admin elimino una entrada");
  renderAdminList();
  if (state.evidenceEntries.length === 0) {
    createNewAdminEntry();
  }
}

function exportEvidenceJson() {
  const blob = new Blob([JSON.stringify(state.evidenceEntries, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "evidence.runtime.export.json";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  addLog("Admin exporto JSON de evidencias");
}

async function restoreFromBaseJson() {
  localStorage.removeItem(RUNTIME_EVIDENCE_STORAGE_KEY);
  state.evidenceEntries = normalizeEvidenceList(cloneData(state.baseEvidenceEntries));
  await persistRuntimeEvidenceAndSync();
  state.selectedEvidenceId = null;
  renderAdminList();
  addLog("Admin restauro evidencias desde JSON base");
}

async function handleAdminFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    if (elements.entryTypeInput.value === "text") {
      elements.entryMediaInput.value = dataUrl;
    } else {
      elements.entryContentInput.value = dataUrl;
    }
    if (!elements.entrySourceInput.value.trim()) {
      elements.entrySourceInput.value = `Upload admin: ${file.name}`;
    }
    if (elements.entryTypeInput.value !== "text") {
      if (file.type.startsWith("image/")) {
        elements.entryTypeInput.value = "image";
      } else if (file.type.startsWith("video/")) {
        elements.entryTypeInput.value = "video";
      } else if (file.type.startsWith("audio/")) {
        elements.entryTypeInput.value = "audio";
      }
    }
    refreshAdminPreview();
    addLog(`Archivo cargado en admin: ${file.name}`);
  } catch (error) {
    addLog(`Error de carga admin: ${error.message}`);
  }
}

function refreshAdminPreview() {
  const previewEntry = buildEntryFromForm(true);
  renderEvidenceEntry(previewEntry, elements.adminPreview);
}

function renderUnlockPanel(entry) {
  const commanders = getCommanderUsernames();
  if (!entry?.id) {
    elements.commanderUnlockPanel.innerHTML = `
      <p><strong>Desbloqueos por comandante</strong></p>
      <p>Guarde la entrada para administrar desbloqueos.</p>
    `;
    return;
  }

  const rows = commanders.map((username) => {
    const user = state.usersByKey[username];
    const isUnlocked = entry.unlockedForAll || (entry.unlockedFor || []).includes(username);
    return `
      <div class="unlock-row">
        <span>${escapeHtml(user.displayName)}</span>
        <button type="button" data-action="${isUnlocked ? "lock-user" : "unlock-user"}" data-user="${escapeAttribute(username)}">
          ${isUnlocked ? "BLOQUEAR" : "DESBLOQUEAR"}
        </button>
      </div>
    `;
  }).join("");

  elements.commanderUnlockPanel.innerHTML = `
    <p><strong>Desbloqueos por comandante</strong></p>
    <div class="admin-actions">
      <button type="button" data-action="unlock-all">DESBLOQUEAR TODOS</button>
      <button type="button" data-action="lock-all">BLOQUEAR TODOS</button>
    </div>
    ${rows || "<p>No hay comandantes disponibles.</p>"}
  `;
}

async function handleUnlockPanelClick(event) {
  const trigger = event.target.closest("[data-action]");
  if (!trigger) {
    return;
  }

  const entry = state.evidenceEntries.find((item) => item.id === state.selectedEvidenceId);
  if (!entry) {
    return;
  }

  entry.unlockedFor = Array.isArray(entry.unlockedFor) ? entry.unlockedFor : [];
  const action = trigger.dataset.action;
  const username = normalizeUserName(trigger.dataset.user || "");

  if (action === "unlock-all") {
    entry.unlockedForAll = true;
  } else if (action === "lock-all") {
    entry.unlockedForAll = false;
    entry.unlockedFor = [];
  } else if (action === "unlock-user" && username) {
    if (!entry.unlockedFor.includes(username)) {
      entry.unlockedFor.push(username);
    }
  } else if (action === "lock-user" && username) {
    entry.unlockedFor = entry.unlockedFor.filter((item) => item !== username);
  }

  await persistRuntimeEvidenceAndSync();
  selectAdminEvidence(entry.id);
  addLog(`Admin actualizo desbloqueos: ${entry.command}`);
}

function buildEntryFromForm(forPreview = false) {
  const idValue = elements.entryIdInput.value.trim();
  const entryId = idValue || `ev-runtime-${Date.now()}`;
  const aliases = elements.entryAliasesInput.value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const commanders = elements.entryCommandersInput.value
    .split(",")
    .map((item) => normalizeUserName(item))
    .filter(Boolean);

  return normalizeEvidenceEntry({
    id: entryId,
    command: elements.entryCommandInput.value.trim().toLowerCase(),
    aliases,
    title: elements.entryTitleInput.value.trim(),
    type: elements.entryTypeInput.value,
    content: elements.entryContentInput.value.trim(),
    media: elements.entryMediaInput.value.trim(),
    summary: elements.entrySummaryInput.value.trim(),
    source: elements.entrySourceInput.value.trim(),
    active: elements.entryActiveInput.checked,
    access: elements.entryAccessInput.value,
    audienceMode: elements.entryAudienceModeInput.value,
    commanders,
    hidden: elements.entryHiddenInput.checked,
    unlockedForAll: elements.entryUnlockedForAllInput.checked,
    unlockedFor: [],
    _preview: forPreview
  });
}

function renderAdminSelection() {
  elements.adminEntryList.querySelectorAll(".admin-entry-button").forEach((node) => {
    node.classList.remove("is-selected");
  });

  const selected = state.evidenceEntries.find((entry) => entry.id === state.selectedEvidenceId);
  if (!selected) {
    return;
  }

  const selectedCommand = selected.command.toUpperCase();
  elements.adminEntryList.querySelectorAll(".admin-entry-button").forEach((node) => {
    if (node.querySelector("strong")?.textContent === selectedCommand) {
      node.classList.add("is-selected");
    }
  });
}

function findEvidenceByCommand(normalizedCommand) {
  return state.evidenceEntries.find((entry) => {
    if (!entry || !entry.active) {
      return false;
    }

    const tokens = [entry.command, ...(entry.aliases || [])]
      .filter(Boolean)
      .map((token) => normalizeCommand(token));

    return tokens.includes(normalizedCommand);
  });
}

function evaluateEntryAccess(entry, user) {
  if (!entry || !user) {
    return { allowed: false, reason: "no_session" };
  }

  if (user.role === "admin") {
    return { allowed: true, reason: "admin" };
  }

  if ((entry.access || "user") === "admin") {
    return { allowed: false, reason: "admin_only" };
  }

  const userName = normalizeUserName(user.username || "");
  const audienceMode = entry.audienceMode || "all";
  const commanders = Array.isArray(entry.commanders) ? entry.commanders : [];
  if (audienceMode === "specific" && !commanders.includes(userName)) {
    return { allowed: false, reason: "not_assigned" };
  }

  if (entry.hidden) {
    const unlockedForAll = !!entry.unlockedForAll;
    const unlockedFor = Array.isArray(entry.unlockedFor) ? entry.unlockedFor : [];
    if (!unlockedForAll && !unlockedFor.includes(userName)) {
      return { allowed: false, reason: "hidden_locked" };
    }
  }

  return { allowed: true, reason: "ok" };
}

function normalizeEvidenceList(entries) {
  return (entries || [])
    .filter(Boolean)
    .map((entry) => normalizeEvidenceEntry(entry));
}

function isCommunicationEntry(entry) {
  if (!entry) {
    return false;
  }
  if (entry.channel === "communications" || entry.kind === "communication") {
    return true;
  }
  const cmd = normalizeCommand(entry.command || "");
  return cmd.startsWith("comm ") || cmd.startsWith("vesper") || cmd.startsWith("libertas");
}

function isNoteEntry(entry) {
  if (!entry) {
    return false;
  }
  if (entry.channel === "notes" || entry.kind === "note") {
    return true;
  }
  const cmd = normalizeCommand(entry.command || "");
  return cmd.startsWith("note ") || cmd.startsWith("nota ");
}

function isRosterEntry(entry) {
  if (!entry) {
    return false;
  }
  if (entry.channel === "roster" || entry.kind === "roster") {
    return true;
  }
  const cmd = normalizeCommand(entry.command || "");
  return cmd.startsWith("roster ") || cmd.startsWith("perfil ");
}

function normalizeEvidenceEntry(entry) {
  if (!entry) {
    return null;
  }

  const normalizedCommanders = (entry.commanders || [])
    .map((item) => normalizeUserName(String(item)))
    .filter(Boolean);

  const inferredAudience = normalizedCommanders.length > 0 ? "specific" : "all";
  const audienceMode = entry.audienceMode === "specific" ? "specific" : (entry.audienceMode === "all" ? "all" : inferredAudience);
  const commStatus = entry.commStatus === "draft" ? "draft" : "sent";

  return {
    ...entry,
    access: entry.access || "user",
    aliases: Array.isArray(entry.aliases) ? entry.aliases : [],
    media: String(entry.media || "").trim(),
    commStatus,
    commanders: normalizedCommanders,
    audienceMode,
    hidden: !!entry.hidden,
    unlockedForAll: !!entry.unlockedForAll,
    unlockedFor: Array.isArray(entry.unlockedFor) ? entry.unlockedFor.map((item) => normalizeUserName(String(item))).filter(Boolean) : []
  };
}

function getCommanderUsernames() {
  return Object.keys(state.usersByKey)
    .filter((username) => state.usersByKey[username]?.role !== "admin")
    .map((username) => normalizeUserName(username));
}

function renderAvailableUsers() {
  const users = Object.values(state.usersByKey);
  elements.availableUsersList.innerHTML = users
    .map((user) => `<li>${escapeHtml(user.displayName.toUpperCase())}</li>`)
    .join("");
}

function clearLog() {
  state.logLines = [];
  renderLog();
}

function addLog(message) {
  const timestamp = new Date().toLocaleTimeString("es-ES", { hour12: false });
  state.logLines.push(`> [${timestamp}] ${message}`);
  if (state.logLines.length > 100) {
    state.logLines.shift();
  }
  renderLog();
}

function renderLog() {
  elements.eventLog.innerHTML = state.logLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  elements.eventLog.scrollTop = elements.eventLog.scrollHeight;
}

function bindInlineCommands() {
  elements.contentViewport.querySelectorAll("[data-inline-command]").forEach((button) => {
    button.addEventListener("click", () => executeCommand(button.dataset.inlineCommand));
  });
}

function playUiSoundFromEvent(event) {
  const target = event.target?.closest?.("button, [role='button']");
  if (!target) {
    return;
  }

  let tone = "default";
  if (target.classList.contains("danger-button")) {
    tone = "danger";
  } else if (target.classList.contains("primary-button")) {
    tone = "primary";
  } else if (target.dataset?.direction) {
    tone = "direction";
  }

  playUiTone(tone);
}

function playUiSoundFromKey(event) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }
  playUiTone("key");
}

function ensureAudioContext() {
  if (!state.audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return null;
    }
    state.audioContext = new AudioCtx();
  }

  if (state.audioContext.state === "suspended") {
    void state.audioContext.resume();
  }
  state.audioReady = true;
  return state.audioContext;
}

function playUiTone(kind) {
  const ctx = ensureAudioContext();
  if (!ctx) {
    return;
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const profile = getToneProfile(kind);
  osc.type = profile.type;
  osc.frequency.setValueAtTime(profile.freqStart, now);
  osc.frequency.linearRampToValueAtTime(profile.freqEnd, now + profile.duration);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(profile.gain, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + profile.duration + 0.01);
}

function getToneProfile(kind) {
  if (kind === "primary") {
    return { type: "triangle", freqStart: 700, freqEnd: 920, duration: 0.065, gain: 0.028 };
  }
  if (kind === "danger") {
    return { type: "sawtooth", freqStart: 240, freqEnd: 170, duration: 0.08, gain: 0.02 };
  }
  if (kind === "direction") {
    return { type: "square", freqStart: 560, freqEnd: 620, duration: 0.05, gain: 0.018 };
  }
  if (kind === "key") {
    return { type: "triangle", freqStart: 520, freqEnd: 500, duration: 0.04, gain: 0.014 };
  }
  return { type: "triangle", freqStart: 480, freqEnd: 650, duration: 0.055, gain: 0.016 };
}

function normalizeUserName(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeCommand(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function isPlaceholderVideoSource(value) {
  const source = String(value || "").trim().toLowerCase();
  return !source || source.includes("placeholder");
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildEvidenceSignature(entries) {
  const normalized = (entries || [])
    .filter(Boolean)
    .map((entry) => ({
      id: entry.id || "",
      command: entry.command || "",
      title: entry.title || "",
      type: entry.type || "",
      content: entry.content || "",
      media: entry.media || "",
      hidden: !!entry.hidden,
      unlockedForAll: !!entry.unlockedForAll,
      unlockedFor: Array.isArray(entry.unlockedFor) ? [...entry.unlockedFor].sort() : [],
      audienceMode: entry.audienceMode || "all",
      commanders: Array.isArray(entry.commanders) ? [...entry.commanders].sort() : []
    }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  return JSON.stringify(normalized);
}

function mergeBaseWithRuntime(baseEntries, runtimeEntries) {
  const runtimeById = new Map(
    runtimeEntries
      .filter((entry) => entry && entry.id)
      .map((entry) => [entry.id, entry])
  );

  const merged = [];

  baseEntries.forEach((baseEntry) => {
    if (baseEntry?.id && runtimeById.has(baseEntry.id)) {
      merged.push(runtimeById.get(baseEntry.id));
      runtimeById.delete(baseEntry.id);
    } else {
      merged.push(baseEntry);
    }
  });

  runtimeById.forEach((entry) => merged.push(entry));
  return merged;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}
