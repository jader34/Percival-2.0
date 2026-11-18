import { useState } from "react";
import { BookOpen, Check, Search, Sparkles } from "lucide-react";
import type { PanelProps } from "./shared.ts";
import { signed } from "./shared.ts";
import { SPELL_DETAILS } from "./spellDetails.ts";

export function Spells({ state, sheet, act, open }: PanelProps) {
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);
  const oath = new Set(sheet.spellcasting.oathSpells.map((x) => x.id));
  const prepared = new Set(
    [
      ...sheet.spellcasting.preparedSpells,
      ...sheet.spellcasting.oathSpells,
    ].map((x) => x.id),
  );
  const normalize = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const list = sheet.spellcasting.availableSpells.filter(
    (spell) =>
      (all || prepared.has(spell.id)) &&
      normalize(spell.name).includes(normalize(query)),
  );
  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <h2>O grimório</h2>
          <p>O poder vem do juramento. Os dados, da sua mão.</p>
        </div>
        <BookOpen size={34} strokeWidth={1} />
      </div>
      <div className="magic-stats">
        <div>
          <span>CD de magia</span>
          <strong>{sheet.spellcasting.saveDC}</strong>
        </div>
        <div>
          <span>Ataque mágico</span>
          <strong>{signed(sheet.spellcasting.attackBonus)}</strong>
        </div>
        <div>
          <span>Preparadas</span>
          <strong>
            {sheet.spellcasting.preparedCount}
            <small>/{sheet.spellcasting.preparedLimit}</small>
          </strong>
        </div>
      </div>
      <div className="spell-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Encontrar uma magia…"
            aria-label="Buscar magia"
          />
        </label>
        <div className="segmented">
          <button aria-pressed={!all} onClick={() => setAll(false)}>
            Preparadas
          </button>
          <button aria-pressed={all} onClick={() => setAll(true)}>
            Todas disponíveis
          </button>
        </div>
      </div>
      <p className="caption">
        Magias do juramento ficam sempre preparadas e não ocupam sua cota.
        Altere a preparação após um descanso longo.
      </p>
      {state.session.concentration && (
        <div className="concentration-banner">
          <Sparkles size={19} />
          <span>
            Concentrando em{" "}
            <strong>
              {sheet.spellcasting.availableSpells.find(
                (x) => x.id === state.session.concentration,
              )?.name ?? state.session.concentration}
            </strong>
          </span>
          <button
            className="text-button"
            onClick={() =>
              act({ type: "end-concentration" }, "Concentração encerrada.")
            }
          >
            Encerrar
          </button>
        </div>
      )}
      {list.length ? (
        <div className="spell-list">
          {list.map((spell) => {
            const detail = SPELL_DETAILS[spell.id];
            const usable = prepared.has(spell.id);
            return (
              <article className="spell-entry" key={spell.id}>
                <div
                  className="spell-circle"
                  aria-label={`${spell.level}º círculo`}
                >
                  {spell.level}
                  <span>círculo</span>
                </div>
                <div className="spell-content">
                  <div className="spell-title">
                    <h3>{spell.name}</h3>
                    {oath.has(spell.id) && (
                      <span className="oath-badge">Juramento</span>
                    )}
                  </div>
                  <p className="spell-meta">
                    {detail
                      ? `${detail.action} · ${detail.range} · ${detail.duration}${detail.concentration ? " · Concentração" : ""}`
                      : "Consulte tempo, alcance e concentração no livro"}
                  </p>
                  <details>
                    <summary>Descrição</summary>
                    <p>
                      {detail?.summary ??
                        "Esta magia foi liberada pela progressão do paladino. Consulte sua descrição completa no Livro do Jogador antes de conjurar; este aplicativo registra preparação e gasto de espaço."}
                    </p>
                  </details>
                </div>
                <div className="spell-controls">
                  {usable ? (
                    <button
                      className="button compact"
                      disabled={state.session.hp === 0}
                      onClick={() => open({ kind: "spell", id: spell.id })}
                    >
                      Conjurar
                    </button>
                  ) : (
                    <button
                      className="button compact secondary"
                      onClick={() =>
                        act(
                          { type: "prepare", spellId: spell.id },
                          `${spell.name} preparada.`,
                        )
                      }
                    >
                      Preparar
                    </button>
                  )}
                  {!oath.has(spell.id) && usable && (
                    <button
                      className="text-button"
                      aria-label={`Remover ${spell.name} da preparação`}
                      onClick={() =>
                        act(
                          { type: "prepare", spellId: spell.id },
                          `${spell.name} removida da preparação.`,
                        )
                      }
                    >
                      <Check size={13} />
                      Preparada
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={30} />
          <h3>Nenhuma magia encontrada</h3>
          <p>Tente outro nome ou consulte todas as disponíveis.</p>
        </div>
      )}
      {!!sheet.spellcasting.unresolvedPreparedSpellIds.length && (
        <div className="notice">
          <strong>Uma regra precisa ser confirmada</strong>
          <p>
            Vínculo Protetor consta na ficha antiga, mas não na lista deste
            livro. Confirme o acesso em Ajustes para usá-la aqui.
          </p>
          <button
            className="text-button"
            onClick={() => open({ kind: "settings" })}
          >
            Ver confirmações
          </button>
        </div>
      )}
    </section>
  );
}
