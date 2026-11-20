import {
  Check,
  Crosshair,
  Droplets,
  Eye,
  Flame,
  Footprints,
  HandHeart,
  HeartPulse,
  Minus,
  Plus,
  Shield,
  Sparkles,
  Sword,
  Swords,
  Wind,
  X,
} from "lucide-react";
import type { Ability } from "../percival/types.ts";
import { BloodVessel } from "./BloodVessel.tsx";
import type { PanelProps } from "./shared.ts";
import { abilityNames, signed } from "./shared.ts";

const shortAbility: Record<Ability, string> = {
  str: "FOR",
  dex: "DES",
  con: "CON",
  int: "INT",
  wis: "SAB",
  cha: "CAR",
};

export function Combat({ state, sheet, act, open }: PanelProps) {
  const s = state.session;
  const hitDice = sheet.hitDice.maximum - s.hitDiceSpent;
  const mountHitDice = sheet.mount.hitDice.maximum - s.mount.hitDiceSpent;
  const channel =
    sheet.resources.channelDivinity.maximum - s.resourceSpent.channelDivinity;
  const amulet = Math.max(
    0,
    sheet.resources.amuletChannelDivinity.maximum -
      s.resourceSpent.amuletChannelDivinity,
  );
  const hands = sheet.resources.layOnHands.maximum - s.resourceSpent.layOnHands;
  const sense =
    sheet.resources.divineSense.maximum - s.resourceSpent.divineSense;
  const veil = Math.max(
    0,
    sheet.resources.bloodVeil.maximum - s.resourceSpent.bloodVeil,
  );
  const vitalityStatus =
    s.hp === 0
      ? s.deathSaves.failures >= 3
        ? "Tombado · 3 falhas"
        : s.deathSaves.stable
          ? "Inconsciente · Estável"
          : "Inconsciente · Em risco"
      : s.hp <= sheet.hpMax / 2
        ? "Ferido"
        : "De pé, pelo juramento";
  const displayedSuccesses = s.deathSaves.stable ? 3 : s.deathSaves.successes;
  return (
    <div className="combat-layout">
      <div className="combat-primary">
        <section
          className={`vitality ${s.hp === 0 ? "fallen" : ""}`}
          aria-label="Vitalidade de Percival"
        >
          <div className="vitality-copy">
            <div className="vitality-heading">
              <h2>Vitalidade</h2>
              <span className="status-mark">{vitalityStatus}</span>
            </div>
            <div className="hp-number">
              <strong data-testid="current-hp">{s.hp}</strong>
              <span>
                / {sheet.hpMax}
                <small>pontos de vida</small>
              </span>
            </div>
            <button
              className="temp-button"
              onClick={() => open({ kind: "temp" })}
            >
              <Shield size={14} />
              {s.tempHp > 0
                ? `${s.tempHp} PV temporários`
                : "Adicionar PV temporários"}
              <Plus size={13} />
            </button>
          </div>
          <BloodVessel ratio={s.hp / sheet.hpMax} />
          <div className="hp-actions">
            <button
              className="button damage-button"
              onClick={() => open({ kind: "damage" })}
            >
              <Minus size={18} />
              Registrar dano
            </button>
            <button
              className="button heal-button"
              onClick={() => open({ kind: "heal" })}
            >
              <Plus size={18} />
              Curar
            </button>
          </div>
        </section>
        {s.hp === 0 && (
          <section
            className="death-saves"
            aria-label="Salvaguardas contra a morte"
          >
            <div className="section-heading">
              <h2>Salvaguardas contra a morte</h2>
              <span>
                {s.deathSaves.failures >= 3
                  ? "3 falhas registradas"
                  : s.deathSaves.stable
                    ? "Estabilizado"
                    : "d20 físico · CD 10"}
              </span>
            </div>
            <div className="death-tracks">
              <div className="death-track">
                <span>Sucessos</span>
                <div
                  className="death-pips"
                  aria-label={`${displayedSuccesses} de 3 sucessos`}
                >
                  {[0, 1, 2].map((pip) => (
                    <i
                      key={pip}
                      className={
                        pip < displayedSuccesses ? "filled success" : ""
                      }
                    />
                  ))}
                </div>
                <strong>
                  {displayedSuccesses}
                  <small>/3</small>
                </strong>
              </div>
              <div className="death-track">
                <span>Falhas</span>
                <div
                  className="death-pips"
                  aria-label={`${s.deathSaves.failures} de 3 falhas`}
                >
                  {[0, 1, 2].map((pip) => (
                    <i
                      key={pip}
                      className={
                        pip < s.deathSaves.failures ? "filled failure" : ""
                      }
                    />
                  ))}
                </div>
                <strong>
                  {s.deathSaves.failures}
                  <small>/3</small>
                </strong>
              </div>
            </div>
            {!s.deathSaves.stable && s.deathSaves.failures < 3 && (
              <>
                <div className="death-actions-primary">
                  <button
                    className="button heal-button"
                    onClick={() =>
                      act(
                        { type: "death-save", outcome: "success" },
                        s.deathSaves.successes + 1 >= 3
                          ? "Terceiro sucesso: Percival está estável a 0 PV."
                          : "Sucesso contra a morte registrado.",
                      )
                    }
                  >
                    <Check size={17} />
                    Sucesso (10–19)
                  </button>
                  <button
                    className="button damage-button"
                    onClick={() =>
                      act(
                        { type: "death-save", outcome: "failure" },
                        s.deathSaves.failures + 1 >= 3
                          ? "Terceira falha contra a morte registrada."
                          : "Falha contra a morte registrada.",
                      )
                    }
                  >
                    <X size={17} />
                    Falha (2–9)
                  </button>
                </div>
                <div className="death-actions-secondary">
                  <button
                    className="button compact secondary"
                    onClick={() =>
                      act(
                        { type: "death-save", outcome: "nat20" },
                        "20 natural: Percival recobra a consciência com 1 PV.",
                      )
                    }
                  >
                    20 natural (+1 PV)
                  </button>
                  <button
                    className="button compact secondary"
                    onClick={() =>
                      act(
                        { type: "death-save", outcome: "nat1" },
                        "1 natural: duas falhas contra a morte registradas.",
                      )
                    }
                  >
                    1 natural (2 falhas)
                  </button>
                  <button
                    className="button compact secondary"
                    onClick={() =>
                      act(
                        { type: "death-save", outcome: "stabilize" },
                        "Percival estabilizado a 0 PV.",
                      )
                    }
                  >
                    Estabilizar
                  </button>
                </div>
              </>
            )}
            {s.deathSaves.stable && (
              <p className="death-note">
                Percival está estável e inconsciente a 0 PV. Não faça testes por
                turno; sofrer novo dano encerra a estabilidade e curar restaura
                a consciência.
              </p>
            )}
            {s.deathSaves.failures >= 3 && (
              <p className="death-note is-fallen">
                Três falhas contra a morte registradas. Cure, reviva conforme a
                mesa ou use Desfazer se houve toque acidental.
              </p>
            )}
          </section>
        )}
        <div className="defense-strip">
          <div>
            <Shield size={19} />
            <span>Classe de armadura</span>
            <strong>{sheet.armorClass}</strong>
          </div>
          <div>
            <Wind size={19} />
            <span>Iniciativa</span>
            <strong>{signed(sheet.initiative)}</strong>
          </div>
          <div>
            <Footprints size={19} />
            <span>Deslocamento</span>
            <strong>
              {sheet.speedMeters}
              <small> m</small>
            </strong>
          </div>
        </div>
        {(s.effects.bloodBlessing ||
          s.effects.bloodVeil ||
          s.concentration) && (
          <section className="active-effects" aria-label="Efeitos ativos">
            {s.effects.bloodBlessing && (
              <button
                onClick={() =>
                  act(
                    { type: "end-effect", effect: "bloodBlessing" },
                    "Bênção de Sangue encerrada.",
                  )
                }
              >
                <Droplets size={15} />
                Bênção de Sangue
                <X size={14} />
              </button>
            )}
            {s.effects.bloodVeil && (
              <button
                onClick={() =>
                  act(
                    { type: "end-effect", effect: "bloodVeil" },
                    "Véu de Sangue encerrado.",
                  )
                }
              >
                <Shield size={15} />
                Véu de Sangue
                <X size={14} />
              </button>
            )}
            {s.concentration && (
              <button
                onClick={() =>
                  act({ type: "end-concentration" }, "Concentração encerrada.")
                }
              >
                <Sparkles size={15} />
                Concentrando:{" "}
                {sheet.spellcasting.availableSpells.find(
                  (x) => x.id === s.concentration,
                )?.name ?? s.concentration}
                <X size={14} />
              </button>
            )}
            <small>
              Toque para encerrar. Durações são controladas na mesa.
            </small>
          </section>
        )}
        <section className="attacks-section">
          <div className="section-heading">
            <h2>Às armas</h2>
            <span>Dados na mesa</span>
          </div>
          <button
            className="smite-action"
            onClick={() => open({ kind: "smite" })}
          >
            <Flame size={23} />
            <span>
              <strong>Destruição Divina</strong>
              <small>Acertou? Consuma um espaço para o Smite.</small>
            </span>
            <span className="action-tail">
              Usar <Plus size={16} />
            </span>
          </button>
          <div className="weapon-row">
            <div className="weapon-art">
              <Swords size={40} strokeWidth={1} />
            </div>
            <div className="weapon-text">
              <h3>Alabarda</h3>
              <p>Cortante · alcance de 3 m</p>
              <span className="subtle-tag">2 ataques por ação</span>
            </div>
            <div className="attack-numbers">
              <strong>{signed(sheet.attacks.halberd.toHit)}</strong>
              <span>para atingir</span>
              <b>{sheet.attacks.halberd.damage}</b>
            </div>
          </div>
          <div className="secondary-attack">
            <Sword size={19} />
            <div>
              <h3>Golpe com o cabo</h3>
              <p>Ação bônus após atacar com a alabarda</p>
            </div>
            <strong>1d4 {signed(sheet.modifiers.str)}</strong>
          </div>
          {sheet.attacks.improvedDivineSmite && (
            <p className="inline-note">
              Cada acerto corpo-a-corpo com arma soma{" "}
              {sheet.attacks.improvedDivineSmite} radiante.
            </p>
          )}
        </section>
        <section className="oath-section">
          <div className="section-heading">
            <h2>O sangue responde</h2>
            <span>Juramento de Sangue</span>
          </div>
          <button
            className={`oath-action ${s.effects.bloodBlessing ? "is-active" : ""}`}
            disabled={
              s.effects.bloodBlessing ||
              s.hp === 0 ||
              (channel <= 0 && amulet <= 0)
            }
            onClick={() => open({ kind: "blessing" })}
          >
            <Droplets size={24} />
            <span>
              <strong>Bênção de Sangue</strong>
              <small>+{sheet.modifiers.cha} para atingir · 1 minuto</small>
            </span>
            <span className="action-label">
              {s.effects.bloodBlessing ? "Ativa" : "Ação"}
            </span>
          </button>
          <button
            className="oath-action"
            disabled={s.hp === 0 || (channel <= 0 && amulet <= 0)}
            onClick={() => open({ kind: "absorb" })}
          >
            <Crosshair size={24} />
            <span>
              <strong>Absorver Vitalidade</strong>
              <small>Toque · Constituição CD {sheet.spellcasting.saveDC}</small>
            </span>
            <span className="action-label">Ação</span>
          </button>
          <p className="caption">
            As duas habilidades compartilham Canalizar Divindade.
          </p>
        </section>
      </div>
      <aside className="combat-secondary" aria-label="Recursos da sessão">
        <section className="resource-panel">
          <div className="section-heading">
            <h2>Reservas</h2>
            <span>Restantes</span>
          </div>
          <button
            className="resource-row"
            disabled={hands <= 0 || s.hp === 0}
            onClick={() => open({ kind: "hands" })}
          >
            <HandHeart size={20} />
            <span>
              <strong>Cura pelas Mãos</strong>
              <small>Descanso longo</small>
            </span>
            <b>
              {hands}
              <small>/{sheet.resources.layOnHands.maximum}</small>
            </b>
          </button>
          <button
            className="resource-row"
            disabled={hitDice <= 0}
            onClick={() => open({ kind: "hit-dice" })}
          >
            <HeartPulse size={20} />
            <span>
              <strong>Dados de Vida</strong>
              <small>
                d10 {signed(sheet.modifiers.con)} · recupera até{" "}
                {sheet.hitDice.longRestRecovery} no descanso longo
              </small>
            </span>
            <b>
              {hitDice}
              <small>/{sheet.hitDice.maximum}</small>
            </b>
          </button>
          <button
            className="resource-row"
            disabled={sense <= 0 || s.hp === 0}
            onClick={() =>
              act(
                { type: "use-resource", resource: "divineSense" },
                "Sentido Divino: um uso registrado.",
              )
            }
          >
            <Eye size={20} />
            <span>
              <strong>Sentido Divino</strong>
              <small>Detectar a até 18 m</small>
            </span>
            <b>
              {sense}
              <small>/{sheet.resources.divineSense.maximum}</small>
            </b>
          </button>
          <div className="resource-row">
            <Droplets size={20} />
            <span>
              <strong>Canalizar Divindade</strong>
              <small>Descanso curto ou longo</small>
            </span>
            <b>
              {channel}
              <small>/1</small>
            </b>
          </div>
          {sheet.resources.amuletChannelDivinity.maximum > 0 && (
            <div className="resource-row">
              <Sparkles size={20} />
              <span>
                <strong>Amuleto do Devoto</strong>
                <small>Recupera ao amanhecer</small>
              </span>
              <b>
                {amulet}
                <small>/1</small>
              </b>
            </div>
          )}
          <button
            className={`resource-row ${s.effects.bloodVeil ? "is-active" : ""}`}
            disabled={veil <= 0 || s.effects.bloodVeil}
            onClick={() =>
              act(
                { type: "veil" },
                "Véu de Sangue ativo: +2 CA e +2 em salvaguardas de Destreza.",
              )
            }
          >
            <Shield size={20} />
            <span>
              <strong>Véu de Sangue</strong>
              <small>+2 CA · ação bônus · 1 min</small>
            </span>
            <b>{s.effects.bloodVeil ? "Ativo" : `${veil}/1`}</b>
          </button>
        </section>
        <section className="slots-panel">
          <div className="section-heading">
            <h2>Espaços de magia</h2>
            <button
              className="text-button"
              onClick={() => open({ kind: "rest" })}
            >
              Recuperar
            </button>
          </div>
          {sheet.spellcasting.slots.map(
            (maximum, index) =>
              maximum > 0 && (
                <div className="slot-row" key={index}>
                  <span>{index + 1}º círculo</span>
                  <div
                    className="slot-pips"
                    aria-label={`${maximum - s.slotsSpent[index]} de ${maximum} espaços restantes`}
                  >
                    {Array.from({ length: maximum }, (_, pip) => (
                      <i
                        key={pip}
                        className={
                          pip < maximum - s.slotsSpent[index] ? "filled" : ""
                        }
                      />
                    ))}
                  </div>
                  <strong>
                    {maximum - s.slotsSpent[index]}
                    <small>/{maximum}</small>
                  </strong>
                </div>
              ),
          )}
        </section>
        <div className="aura-note">
          <Shield size={26} strokeWidth={1.5} />
          <div>
            <strong>
              Aura de Proteção <span>+{sheet.auras.protection.bonus}</span>
            </strong>
            <p>
              {s.hp > 0
                ? `Você e aliados a ${sheet.auras.protection.radiusMeters} m somam o bônus em salvaguardas.`
                : "Sua aura está inativa enquanto estiver inconsciente."}
            </p>
          </div>
        </div>
        <section className="session-log">
          <h2>Últimos registros</h2>
          {state.log.length ? (
            <ol>
              {state.log.slice(0, 3).map((entry, i) => (
                <li key={`${i}-${entry}`}>{entry}</li>
              ))}
            </ol>
          ) : (
            <p>
              O próximo capítulo ainda está por escrever. Seus registros
              aparecem aqui.
            </p>
          )}
        </section>
      </aside>
        <section className="mount-section" aria-label="Ficha da montaria">
          <div className="section-heading">
            <h2>Em sela</h2>
            <span>
              {sheet.mount.species} · {sheet.mount.size}
            </span>
          </div>
          <div className={`mount-card ${s.mount.hp === 0 ? "fallen" : ""}`}>
            <div className="mount-header">
              <div>
                <h3>{sheet.mount.name}</h3>
                <p>
                  {sheet.mount.creatureType} {sheet.mount.size.toLowerCase()} ·{" "}
                  {sheet.mount.armor.equipped
                    ? "Cota de talas"
                    : "Sem armadura"}
                </p>
              </div>
              <div className="mount-hp-readout">
                <div>
                  <strong data-testid="mount-hp">{s.mount.hp}</strong>
                  <span>/{sheet.mount.hpMax} PV</span>
                </div>
                {s.mount.tempHp > 0 && (
                  <small className="mount-temp-tag">
                    +{s.mount.tempHp} PV temp.
                  </small>
                )}
              </div>
            </div>
            <div className="mount-hp-actions">
              <button
                className="button compact damage-button"
                onClick={() => open({ kind: "mount-damage" })}
              >
                <Minus size={15} />
                Dano
              </button>
              <button
                className="button compact heal-button"
                onClick={() => open({ kind: "mount-heal" })}
              >
                <Plus size={15} />
                Curar
              </button>
              {s.mount.hp === 0 ? (
                <button
                  className="button compact secondary"
                  onClick={() =>
                    act(
                      { type: "mount-summon" },
                      "Pesadelo Sanguinário restaurado com 19 PV.",
                    )
                  }
                >
                  Restaurar 19 PV
                </button>
              ) : (
                <button
                  className="button compact secondary"
                  onClick={() => open({ kind: "mount-temp" })}
                >
                  {s.mount.tempHp > 0 ? `+${s.mount.tempHp} temp.` : "PV temp."}
                </button>
              )}
            </div>
            <div className="mount-stats">
              <div>
                <span>CA</span>
                <strong>{sheet.mount.armorClass}</strong>
                {s.effects.bloodVeil && (
                  <small>
                    {sheet.mount.armorClassMountedWithVeil} no Véu
                  </small>
                )}
              </div>
              <div>
                <span>Deslocamento</span>
                <strong>
                  {sheet.mount.speedMeters}
                  <small> m</small>
                </strong>
              </div>
              <div>
                <span>Iniciativa</span>
                <strong>{signed(sheet.mount.initiative)}</strong>
              </div>
              <button
                className="mount-hd-button"
                disabled={mountHitDice <= 0}
                onClick={() => open({ kind: "mount-hit-dice" })}
              >
                <span>Dados de Vida</span>
                <strong>
                  {mountHitDice}
                  <small>/{sheet.mount.hitDice.maximum} d10</small>
                </strong>
              </button>
            </div>
            <div className="mount-attack">
              <Sword size={18} />
              <div>
                <h4>{sheet.mount.attack.name}</h4>
                <p>
                  Concussão · alcance{" "}
                  {sheet.mount.attack.reachMeters.toLocaleString("pt-BR")} m
                </p>
              </div>
              <div className="mount-attack-numbers">
                <strong>{signed(sheet.mount.attack.toHit)}</strong>
                <b>{sheet.mount.attack.damage}</b>
              </div>
            </div>
            <p className="mount-charge-note">
              <strong>Investida Atropeladora:</strong> moveu 6 m em linha reta e
              acertou os cascos? Salvaguarda de Força <strong>CD 14</strong> ou
              fica caído; se caído, outro ataque de cascos com{" "}
              <strong>ação bônus</strong>.
            </p>
            <details className="mount-details">
              <summary>
                Atributos, salvaguardas e barda
                <span className="expand-mark" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="mount-abilities">
                {(Object.keys(shortAbility) as Ability[]).map((ability) => (
                  <div key={ability} aria-label={abilityNames[ability]}>
                    <span>{shortAbility[ability]}</span>
                    <strong>{signed(sheet.mount.modifiers[ability])}</strong>
                    <small>{sheet.mount.abilities[ability]}</small>
                  </div>
                ))}
              </div>
              <p className="mount-meta-line">
                Percepção passiva <strong>{sheet.mount.passivePerception}</strong>
                {sheet.mount.stealthDisadvantage
                  ? " · Desvantagem em Furtividade (Cota de talas)"
                  : " · Sem penalidade em Furtividade"}
              </p>
              <p className="mount-meta-line">
                {sheet.auras.protection.active ? (
                  <>
                    Com Percival consciente a até{" "}
                    {sheet.auras.protection.radiusMeters} m (Aura +
                    {sheet.auras.protection.bonus}
                    {s.effects.bloodVeil ? " e Véu +2 DES" : ""}): salvaguardas
                    FOR {signed(sheet.mount.savingThrowsWithAura.str)}, DES{" "}
                    {signed(sheet.mount.savingThrowsWithAura.dex)}, CON{" "}
                    {signed(sheet.mount.savingThrowsWithAura.con)}, INT{" "}
                    {signed(sheet.mount.savingThrowsWithAura.int)}, SAB{" "}
                    {signed(sheet.mount.savingThrowsWithAura.wis)}, CAR{" "}
                    {signed(sheet.mount.savingThrowsWithAura.cha)}.
                  </>
                ) : (
                  "Aura de Proteção inativa enquanto Percival estiver inconsciente."
                )}
              </p>
              <div className="mount-barding-row">
                <div>
                  <strong>{sheet.mount.armor.name}</strong>
                  <small>
                    CA 17 · Força 15 atendida (FOR 18) · sem armadura: CA 11
                  </small>
                </div>
                <button
                  className="equip-toggle"
                  aria-pressed={sheet.mount.armor.equipped}
                  onClick={() =>
                    act(
                      {
                        type: "mount-armor",
                        equipped: !sheet.mount.armor.equipped,
                      },
                      sheet.mount.armor.equipped
                        ? "Cota de talas retirada da montaria (CA 11)."
                        : "Cota de talas equipada na montaria (CA 17).",
                    )
                  }
                >
                  {sheet.mount.armor.equipped ? "Equipada" : "Equipar"}
                </button>
              </div>
              <p className="mount-meta-line">
                {sheet.mount.traits[1]?.description}
              </p>
            </details>
          </div>
        </section>
    </div>
  );
}
