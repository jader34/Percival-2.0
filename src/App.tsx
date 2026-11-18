import { useEffect, useRef, useState } from "react";
import {
  Backpack,
  BookOpen,
  Check,
  Download,
  Feather,
  Moon,
  Settings2,
  Swords,
  Undo2,
  X,
} from "lucide-react";
import { PERCIVAL } from "./percival/data.ts";
import {
  applyAction,
  createAppState,
  getSheet,
  parseBackup,
  serialize,
  undo,
} from "./session/state.ts";
import type { AppState } from "./session/state.ts";
import { Combat } from "./components/Combat.tsx";
import { Spells } from "./components/Spells.tsx";
import { Inventory } from "./components/Inventory.tsx";
import { Character } from "./components/Character.tsx";
import { ActionDialog } from "./components/ActionDialog.tsx";
import type { Dialog, SessionAction } from "./components/shared.ts";

export const STORAGE_KEY = "percival-session-v1";
const tabs = [
  { id: "combat", name: "Combate", Icon: Swords },
  { id: "spells", name: "Magias", Icon: BookOpen },
  { id: "inventory", name: "Inventário", Icon: Backpack },
  { id: "character", name: "Ficha", Icon: Feather },
] as const;

function upgradeSnapshot(entry: unknown) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return;
  const snap = entry as {
    record?: Record<string, unknown>;
    session?: Record<string, unknown>;
  };
  if (
    snap.record &&
    typeof snap.record === "object" &&
    !Array.isArray(snap.record) &&
    snap.record.mount &&
    typeof snap.record.mount === "object" &&
    "legacyHp" in snap.record.mount
  ) {
    snap.record.mount = structuredClone(PERCIVAL.mount);
  }
  if (
    snap.session &&
    typeof snap.session === "object" &&
    !Array.isArray(snap.session)
  ) {
    if (!("hitDiceSpent" in snap.session)) snap.session.hitDiceSpent = 0;
    if (!("deathSaves" in snap.session)) {
      snap.session.deathSaves = { successes: 0, failures: 0, stable: false };
    }
    if (!("mount" in snap.session)) {
      snap.session.mount = { hp: PERCIVAL.mount.hpMax, tempHp: 0, hitDiceSpent: 0 };
    }
  }
}

function parseCompatibleBackup(raw: string): AppState {
  try {
    return parseBackup(raw);
  } catch (firstError) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        (parsed as { version?: unknown }).version !== 1
      ) {
        throw firstError;
      }
      upgradeSnapshot(parsed);
      const history = (parsed as { history?: unknown }).history;
      if (Array.isArray(history)) history.forEach(upgradeSnapshot);
      return parseBackup(JSON.stringify(parsed));
    } catch {
      throw firstError;
    }
  }
}

function loadLocal() {
  try {
    const saved =
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { state: createAppState(), issue: null as string | null };
    const loaded = parseCompatibleBackup(saved);
    if (
      loaded.record.xp === 14000 &&
      loaded.record.advancements.length === 0 &&
      !loaded.log.some((entry) => entry.startsWith("XP"))
    ) {
      loaded.record.xp = PERCIVAL.xp;
    }
    return {
      state: loaded,
      issue: null as string | null,
    };
  } catch {
    return {
      state: createAppState(),
      issue:
        "Não foi possível carregar o arquivo local. O original não foi sobrescrito. Exporte-o antes de iniciar outra ficha.",
    };
  }
}
function download(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function App() {
  const [initial] = useState(loadLocal);
  const [state, setState] = useState<AppState>(initial.state);
  const [storageIssue, setStorageIssue] = useState(initial.issue);
  const [blocked, setBlocked] = useState(!!initial.issue);
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("combat");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheet = getSheet(state);
  useEffect(() => {
    if (blocked) return;
    try {
      localStorage.setItem(STORAGE_KEY, serialize(state));
      setStorageIssue(null);
    } catch {
      setStorageIssue(
        "O navegador não salvou as últimas alterações. Exporte um backup antes de fechar.",
      );
    }
  }, [state, blocked]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  // Never silently overwrite another tab's newer session.
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setBlocked(true);
        setStorageIssue(
          "Outra aba alterou esta ficha. Exporte sua versão se necessário e recarregue antes de continuar.",
        );
      }
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);
  const notify = (text: string, error = false) => {
    if (timer.current) clearTimeout(timer.current);
    setNotice({ text, error });
    timer.current = setTimeout(() => setNotice(null), error ? 10000 : 4500);
  };
  const act = (action: SessionAction, message = "Registro atualizado.") => {
    try {
      setState(applyAction(state, action));
      notify(message);
      return true;
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a ação.",
        true,
      );
      return false;
    }
  };
  const exportData = () => {
    download(serialize(state), "percival-backup.json");
    if (blocked) {
      try {
        const original = localStorage.getItem(STORAGE_KEY);
        if (original) download(original, "percival-arquivo-original.json");
      } catch {
        notify(
          "Não foi possível acessar o arquivo original. O backup da sessão atual foi solicitado.",
          true,
        );
      }
    }
  };
  const importData = async (file: File) => {
    try {
      if (file.size > 5_000_000)
        throw new Error("O backup excede 5 MB. Escolha um arquivo menor.");
      const imported = parseCompatibleBackup(await file.text());
      if (
        !window.confirm(
          "Substituir a ficha deste navegador pelo backup? Exporte sua sessão atual antes de continuar.",
        )
      )
        return;
      setState(imported);
      setBlocked(false);
      setDialog(null);
      notify("Backup validado e importado.");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Arquivo de backup inválido.",
        true,
      );
    }
  };
  const recover = () => {
    if (
      window.confirm(
        "Você já exportou os dados que deseja preservar? A sessão atual substituirá o arquivo local.",
      )
    ) {
      setBlocked(false);
      setState({ ...state });
    }
  };
  const open = (next: Dialog) => { setNotice(null); setDialog(next); };
  const props = { state, sheet, act, open };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Pular para a ficha
      </a>
      <aside className="identity-rail">
        <img src="/sigil.svg" alt="" width="56" height="56" />
        <p>
          Juramento
          <br />
          de Sangue
        </p>
        <span>
          Uma vida.
          <br />
          Uma promessa.
        </span>
        <div className="rail-rule" />
        <small>PERCIVAL</small>
      </aside>
      <div className="app-body">
        <header className="masthead">
          <div className="identity">
            <img src="/sigil.svg" alt="" width="42" height="42" />
            <div>
              <h1>Percival</h1>
              <p>
                Paladino <span>·</span> Juramento de Sangue
              </p>
            </div>
            <span className="level-seal" aria-label={`Nível ${sheet.level}`}>
              <small>NV</small>
              {sheet.level}
            </span>
          </div>
          <button
            className="icon-button settings-trigger"
            aria-label="Ajustes e backup"
            onClick={() => setDialog({ kind: "settings" })}
          >
            <Settings2 size={21} />
          </button>
        </header>
        <div className="session-toolbar">
          <span className={`save-status ${storageIssue ? "has-error" : ""}`}>
            <i />
            {storageIssue ? "Não salvo" : "Salvo neste aparelho"}
          </span>
          <div>
            <button
              className="text-button"
              disabled={!state.history.length}
              onClick={() => {
                setState(undo(state));
                notify("Último registro desfeito.");
              }}
            >
              <Undo2 size={16} />
              Desfazer
            </button>
            <button
              className="text-button"
              onClick={() => setDialog({ kind: "rest" })}
            >
              <Moon size={16} />
              Descansar
            </button>
          </div>
        </div>
        {storageIssue && (
          <div role="alert" className="storage-warning">
            <p>{storageIssue}</p>
            <button className="button secondary" onClick={exportData}>
              <Download size={16} />
              Exportar dados
            </button>
          </div>
        )}
        <main id="main-content" tabIndex={-1}>
          {tab === "combat" && <Combat {...props} />}
          {tab === "spells" && <Spells {...props} />}
          {tab === "inventory" && <Inventory {...props} />}
          {tab === "character" && <Character {...props} />}
        </main>
        <footer className="page-footer">
          <span>O juramento permanece.</span>
          <small>Dados físicos. Memórias neste aparelho.</small>
        </footer>
      </div>
      <nav className="main-nav" aria-label="Navegação principal">
        {tabs.map(({ id, name, Icon }) => (
          <button
            key={id}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => {
              setTab(id);
              window.scrollTo({ top: 0 });
            }}
          >
            <Icon size={21} strokeWidth={1.7} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
      {dialog && (
        <ActionDialog
          key={dialog.kind === "spell" ? `spell-${dialog.id}` : dialog.kind}
          {...props}
          dialog={dialog}
          close={() => setDialog(null)}
          exportData={exportData}
          importData={importData}
          storageIssue={storageIssue}
          recover={recover}
          feedback={notice}
        />
      )}
      {notice && !dialog && (
        <div
          className={`toast ${notice.error ? "error" : ""}`}
          role={notice.error ? "alert" : "status"}
        >
          {notice.error ? <X size={18} /> : <Check size={18} />}
          <span>{notice.text}</span>
          <button
            className="icon-button"
            aria-label="Dispensar mensagem"
            onClick={() => setNotice(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
