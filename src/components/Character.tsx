import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Feather, Plus, Shield } from "lucide-react";
import type { Ability } from "../percival/types.ts";
import type { PanelProps } from "./shared.ts";
import { abilityNames, signed } from "./shared.ts";
export function Character({ state, sheet, act, open }: PanelProps) {
  const [notes, setNotes] = useState(state.session.notes);
  useEffect(() => setNotes(state.session.notes), [state.session.notes]);
  const nextXp = sheet.xp.nextLevelThreshold;
  const floorXp = sheet.xp.currentLevelThreshold;
  const xpRatio = nextXp
    ? Math.max(
        0,
        Math.min(1, (sheet.xp.current - floorXp) / Math.max(1, nextXp - floorXp)),
      )
    : 1;
  const xpRemaining = nextXp ? Math.max(0, nextXp - sheet.xp.current) : 0;
  return (
    <section className="page-panel character-panel">
      <div className="page-heading">
        <div>
          <h2>Por trás da armadura</h2>
          <p>Humano variante · Soldado · Paladino {sheet.level}</p>
        </div>
        <Feather size={34} strokeWidth={1} />
      </div>
      <section className="xp-panel" aria-label="Experiência de Percival">
        <div className="section-heading">
          <h2>Experiência</h2>
          <span>
            {nextXp
              ? `Nível ${sheet.level} → ${sheet.level + 1}`
              : "Nível máximo"}
          </span>
        </div>
        <div className="xp-main">
          <div className="xp-numbers">
            <strong data-testid="current-xp">
              {sheet.xp.current.toLocaleString("pt-BR")}
            </strong>
            <span>
              {nextXp
                ? `/ ${nextXp.toLocaleString("pt-BR")} XP`
                : "XP acumulados"}
            </span>
          </div>
          <button
            className="button compact primary"
            onClick={() => open({ kind: "xp" })}
          >
            <Plus size={15} />
            Somar XP
          </button>
        </div>
        <div className="xp-track" aria-hidden="true">
          <div
            className={`xp-fill ${nextXp && xpRemaining === 0 ? "is-ready" : ""}`}
            style={{ transform: `scaleX(${xpRatio})` }}
          />
        </div>
        <div className="xp-footer">
          <p>
            {!nextXp
              ? "Percival alcançou o nível 20."
              : xpRemaining > 0
                ? `Faltam ${xpRemaining.toLocaleString("pt-BR")} XP para o nível ${sheet.level + 1}.`
                : `XP suficiente para o nível ${sheet.level + 1} · confirme com o mestre e role o d10 físico.`}
          </p>
          {nextXp && xpRemaining === 0 && (
            <button
              className="text-button"
              onClick={() => open({ kind: "level" })}
            >
              Evoluir
              <ArrowUpRight size={15} />
            </button>
          )}
        </div>
      </section>
      <div className="ability-grid">
        {(Object.keys(abilityNames) as Ability[]).map((ability) => (
          <div className="ability" key={ability}>
            <span>{abilityNames[ability]}</span>
            <strong>{signed(sheet.modifiers[ability])}</strong>
            <small>{sheet.abilities[ability]}</small>
          </div>
        ))}
      </div>
      <section className="saves-section">
        <div className="section-heading">
          <h2>Salvaguardas</h2>
          <span>
            {sheet.auras.protection.active
              ? `Aura +${sheet.auras.protection.bonus} incluída`
              : "Sem aura"}
          </span>
        </div>
        <div className="saves-grid">
          {(Object.keys(abilityNames) as Ability[]).map((ability) => (
            <div key={ability}>
              <Shield size={14} />
              <span>{abilityNames[ability]}</span>
              <strong>{signed(sheet.savingThrows[ability])}</strong>
            </div>
          ))}
        </div>
      </section>
      <details className="feature-group">
        <summary>
          <h2>Perícias</h2>
          <span>Percepção passiva {sheet.passivePerception}</span>
        </summary>
        <div className="skills-list">
          {Object.entries(sheet.skills).map(([id, skill]) => (
            <div key={id}>
              {skill.proficient ? (
                <Check size={14} />
              ) : (
                <span className="untrained" />
              )}
              <span>
                {skill.name}
                {id === "stealth" && sheet.stealthDisadvantage && (
                  <small> · desvantagem</small>
                )}
              </span>
              <strong>{signed(skill.bonus)}</strong>
            </div>
          ))}
        </div>
      </details>
      <div className="section-heading">
        <h2>Traços & juramento</h2>
        <span>{sheet.features.length} características</span>
      </div>
      <div className="features-list">
        {sheet.features.map((feature) => (
          <details key={feature.id}>
            <summary>
              {feature.name}
              <PlusMark />
            </summary>
            <p>{feature.description}</p>
            <small>{feature.source.replace("PHB:", "Livro, p. ")}</small>
          </details>
        ))}
      </div>
      <section className="notes-section">
        <label htmlFor="session-notes">
          <h2>Notas da jornada</h2>
        </label>
        <textarea
          id="session-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Nomes, promessas e dívidas que não devem ser esquecidos…"
          rows={5}
        />
        <button
          className="button secondary"
          disabled={notes === state.session.notes}
          onClick={() =>
            act({ type: "notes", value: notes }, "Notas salvas neste aparelho.")
          }
        >
          Salvar notas
        </button>
      </section>
      <button
        className="evolution-action"
        disabled={sheet.level >= 20}
        onClick={() => open({ kind: "level" })}
      >
        <span>
          <strong>Evoluir Percival</strong>
          <small>
            {sheet.level >= 20
              ? "Nível máximo alcançado"
              : `Próximo capítulo: nível ${sheet.level + 1} · d10 físico`}
          </small>
        </span>
        <ArrowUpRight size={24} />
      </button>
      {sheet.warnings.length > 0 && (
        <details className="pending-rules">
          <summary>
            Confirmações pendentes <span>{sheet.warnings.length}</span>
          </summary>
          <ul>
            {sheet.warnings.map((warning) => (
              <li key={warning.code}>{warning.message}</li>
            ))}
          </ul>
          <button
            className="text-button"
            onClick={() => open({ kind: "settings" })}
          >
            Abrir ajustes da ficha
          </button>
        </details>
      )}
    </section>
  );
}
function PlusMark() {
  return (
    <span className="expand-mark" aria-hidden="true">
      +
    </span>
  );
}
