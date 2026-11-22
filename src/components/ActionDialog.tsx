import { useState } from "react";
import { Download, Droplets, Minus, Moon, Plus, Sun, Upload } from "lucide-react";
import type { Ability, Skill } from "../percival/types.ts";
import { divineSmite } from "../percival/rules.ts";
import { Modal } from "./Modal.tsx";
import { abilityNames, signed } from "./shared.ts";
import type { Dialog, PanelProps, SessionAction } from "./shared.ts";
import { SPELL_DETAILS } from "./spellDetails.ts";
import { CoinTransaction } from "./CoinTransaction.tsx";

interface Props extends PanelProps {
  dialog: Dialog;
  close: () => void;
  exportData: () => void;
  importData: (file: File) => void;
  storageIssue: string | null;
  recover: () => void;
  feedback?: { text: string; error: boolean } | null;
}
const titles: Record<Dialog["kind"], string> = {
  damage: "Registrar dano",
  heal: "Recuperar vida",
  temp: "PV temporários",
  "hit-dice": "Dados de Vida",
  "mount-damage": "Dano na montaria",
  "mount-heal": "Curar montaria",
  "mount-temp": "PV temporários da montaria",
  "mount-hit-dice": "Dados de Vida da montaria",
  hands: "Cura pelas Mãos",
  smite: "Destruição Divina",
  blessing: "Bênção de Sangue",
  absorb: "Absorver Vitalidade",
  rest: "Pausa na jornada",
  xp: "Experiência (XP)",
  coins: "Registrar moedas",
  settings: "Sua ficha, seu aparelho",
  level: "Um novo capítulo",
  potion: "Poção de Cura Maior",
  spell: "Conjurar magia",
};

export function ActionDialog({
  dialog,
  state,
  sheet,
  act,
  open,
  close,
  exportData,
  importData,
  storageIssue,
  recover,
  feedback,
}: Props) {
  const [amount, setAmount] = useState("");
  const [diceCount, setDiceCount] = useState(1);
  const [self, setSelf] = useState(true);
  const [source, setSource] = useState<"class" | "amulet">("class");
  const spell =
    dialog.kind === "spell"
      ? sheet.spellcasting.availableSpells.find((x) => x.id === dialog.id)
      : undefined;
  const [slot, setSlot] = useState(
    () =>
      sheet.spellcasting.slots.findIndex(
        (max, i) =>
          i + 1 >= (spell?.level ?? 1) && max > state.session.slotsSpent[i],
      ) + 1,
  );
  const [concentration, setConcentration] = useState(
    spell ? (SPELL_DETAILS[spell.id]?.concentration ?? false) : false,
  );
  const [specialTarget, setSpecialTarget] = useState(false);
  const [critical, setCritical] = useState(false);
  const [rest, setRest] = useState<"short" | "long" | "dawn">("short");
  const [xpMode, setXpMode] = useState<"add" | "set">("add");
  const [acknowledged, setAcknowledged] = useState(false);
  const [ability, setAbility] = useState<Ability | "">("");
  const [secondAbility, setSecondAbility] = useState<Ability | "">("");
  const [split, setSplit] = useState(false);
  const [skill, setSkill] = useState<Skill | "">("");
  const [error, setError] = useState("");
  const numeric = Number(amount);
  const s = state.session;
  const validNumber =
    amount.trim() !== "" && Number.isSafeInteger(numeric) && numeric > 0;
  const resourceLeft =
    source === "class"
      ? sheet.resources.channelDivinity.maximum -
        s.resourceSpent.channelDivinity
      : sheet.resources.amuletChannelDivinity.maximum -
        s.resourceSpent.amuletChannelDivinity;
  const isMountHd = dialog.kind === "mount-hit-dice";
  const hdRemaining = isMountHd
    ? sheet.mount.hitDice.maximum - s.mount.hitDiceSpent
    : sheet.hitDice.maximum - s.hitDiceSpent;
  const hdConMod = isMountHd
    ? sheet.mount.hitDice.conModifier
    : sheet.modifiers.con;
  const hdCurrentHp = isMountHd ? s.mount.hp : s.hp;
  const hdMaxHp = isMountHd ? sheet.mount.hpMax : sheet.hpMax;
  const validHdRoll =
    validNumber &&
    diceCount >= 1 &&
    diceCount <= hdRemaining &&
    numeric >= diceCount &&
    numeric <= diceCount * 10;
  const hdHealing = validHdRoll ? Math.max(0, numeric + diceCount * hdConMod) : 0;

  const submit = (action: SessionAction, message?: string) => {
    if (act(action, message)) close();
  };
  const numberInput = (
    <>
      <label className="field-label" htmlFor="action-amount">
        {dialog.kind === "level"
          ? "Resultado físico do d10"
          : dialog.kind === "potion"
            ? "Resultado físico de 4d4 + 4"
            : "Quantidade de pontos"}
      </label>
      <input
        className="amount-input"
        id="action-amount"
        type="number"
        inputMode="numeric"
        min="1"
        max={dialog.kind === "level" ? 10 : 9999}
        step="1"
        value={amount}
        placeholder="0"
        onChange={(e) => setAmount(e.target.value)}
        autoFocus
      />
      {dialog.kind !== "level" && dialog.kind !== "potion" && (
        <div className="quick-amounts">
          {[1, 5, 10, 20].map((value) => (
            <button
              key={value}
              className="button secondary"
              onClick={() => setAmount(String(value))}
            >
              {value}
            </button>
          ))}
        </div>
      )}
    </>
  );
  const sourcePicker = (
    <fieldset className="source-picker">
      <legend>Qual recurso usar?</legend>
      <label>
        <input
          type="radio"
          name="channel-source"
          checked={source === "class"}
          onChange={() => setSource("class")}
        />
        Canalizar Divindade{" "}
        <span>
          {sheet.resources.channelDivinity.maximum -
            s.resourceSpent.channelDivinity}
          /1
        </span>
      </label>
      <label>
        <input
          type="radio"
          name="channel-source"
          checked={source === "amulet"}
          onChange={() => setSource("amulet")}
          disabled={sheet.resources.amuletChannelDivinity.maximum === 0}
        />
        Amuleto do Devoto{" "}
        <span>
          {Math.max(
            0,
            sheet.resources.amuletChannelDivinity.maximum -
              s.resourceSpent.amuletChannelDivinity,
          )}
          /{sheet.resources.amuletChannelDivinity.maximum}
        </span>
      </label>
    </fieldset>
  );
  const slotPicker = (
    <fieldset className="slot-picker">
      <legend>Espaço a consumir</legend>
      <div>
        {sheet.spellcasting.slots.map(
          (max, index) =>
            max > 0 &&
            index + 1 >= (spell?.level ?? 1) && (
              <button
                className="slot-choice"
                key={index}
                aria-pressed={slot === index + 1}
                disabled={max <= s.slotsSpent[index]}
                onClick={() => setSlot(index + 1)}
              >
                <strong>{index + 1}º</strong>
                <span>{max - s.slotsSpent[index]} restantes</span>
              </button>
            ),
        )}
      </div>
    </fieldset>
  );
  return (
    <Modal title={dialog.kind === "coins" ? (dialog.mode === "receive" ? "Receber moedas" : "Gastar moedas") : spell?.name ?? titles[dialog.kind]} onClose={close}>
      {dialog.kind === "coins" && <CoinTransaction state={state} mode={dialog.mode} submit={submit} />}
      {feedback && (
        <p
          className="dialog-feedback"
          role={feedback.error ? "alert" : "status"}
        >
          {feedback.text}
        </p>
      )}
      {[
        "damage",
        "heal",
        "temp",
        "hands",
        "potion",
        "mount-damage",
        "mount-heal",
        "mount-temp",
      ].includes(dialog.kind) && (
        <>
          <p className="dialog-description">
            {dialog.kind === "damage"
              ? s.hp === 0
                ? "Percival já está a 0 PV: dano não absorvido por PV temporários encerra a estabilidade e registra 1 falha contra a morte (2 em acerto crítico)."
                : "PV temporários absorvem o dano primeiro. Resistências e reduções devem ser aplicadas na mesa antes de registrar."
              : dialog.kind === "temp"
                ? "PV temporários não se somam. Será mantido o maior valor."
                : dialog.kind === "hands"
                  ? `${sheet.resources.layOnHands.maximum - s.resourceSpent.layOnHands} pontos disponíveis na reserva.`
                  : dialog.kind === "potion"
                    ? "Role seus dados físicos. Este registro consome uma poção e aplica a cura a Percival."
                    : dialog.kind === "mount-damage"
                      ? `Dano em ${sheet.mount.name}. PV temporários absorvem primeiro.`
                      : dialog.kind === "mount-temp"
                        ? `PV temporários de ${sheet.mount.name} não se somam; vale o maior valor.`
                        : dialog.kind === "mount-heal"
                          ? `Informe a cura recebida por ${sheet.mount.name} (máximo ${sheet.mount.hpMax} PV).`
                          : "Informe a cura recebida. Seus PV não ultrapassarão o máximo."}
          </p>
          {numberInput}
          {dialog.kind === "hands" && (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={self}
                onChange={(e) => setSelf(e.target.checked)}
              />
              Aplicar a cura em Percival
            </label>
          )}
          {dialog.kind === "damage" && s.hp === 0 && (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={critical}
                onChange={(e) => setCritical(e.target.checked)}
              />
              Foi um acerto crítico (causa 2 falhas contra a morte)
            </label>
          )}
          {validNumber &&
            [
              "damage",
              "heal",
              "temp",
              "mount-damage",
              "mount-heal",
              "mount-temp",
            ].includes(dialog.kind) && (
              <div className="result-preview">
                <span>
                  {dialog.kind.endsWith("temp")
                    ? "PV temporários após registro"
                    : "Vida após registro"}
                </span>
                <strong>
                  {dialog.kind === "damage"
                    ? Math.max(0, s.hp - Math.max(0, numeric - s.tempHp))
                    : dialog.kind === "heal"
                      ? Math.min(sheet.hpMax, s.hp + numeric)
                      : dialog.kind === "temp"
                        ? Math.max(s.tempHp, numeric)
                        : dialog.kind === "mount-damage"
                          ? Math.max(
                              0,
                              s.mount.hp - Math.max(0, numeric - s.mount.tempHp),
                            )
                          : dialog.kind === "mount-heal"
                            ? Math.min(sheet.mount.hpMax, s.mount.hp + numeric)
                            : Math.max(s.mount.tempHp, numeric)}
                  {!dialog.kind.endsWith("temp") && (
                    <small>
                      {" "}
                      /{" "}
                      {dialog.kind.startsWith("mount-")
                        ? sheet.mount.hpMax
                        : sheet.hpMax}
                    </small>
                  )}
                </strong>
              </div>
            )}
          {dialog.kind === "damage" &&
            s.hp > 0 &&
            validNumber &&
            numeric - s.tempHp - s.hp >= sheet.hpMax && (
              <p className="notice">
                Atenção: o dano restante iguala ou supera os PV máximos (
                {sheet.hpMax}). Confira a regra de morte instantânea na mesa.
              </p>
            )}
          {dialog.kind === "damage" && s.concentration && validNumber && (
            <p className="notice">
              Concentrando: faça na mesa a salvaguarda de Constituição CD{" "}
              {Math.max(10, Math.floor(numeric / 2))}. Em falha, encerre a
              concentração na ficha.
            </p>
          )}
          <button
            className="button primary full"
            disabled={!validNumber}
            onClick={() => {
              if (dialog.kind === "hands")
                submit(
                  { type: "lay-on-hands", amount: numeric, self },
                  "Cura pelas Mãos registrada.",
                );
              else if (dialog.kind === "potion")
                submit(
                  { type: "potion", healing: numeric },
                  "Poção consumida e cura registrada.",
                );
              else if (dialog.kind.startsWith("mount-"))
                submit(
                  {
                    type: "mount-hp",
                    mode:
                      dialog.kind === "mount-damage"
                        ? "damage"
                        : dialog.kind === "mount-temp"
                          ? "temp"
                          : "heal",
                    amount: numeric,
                  },
                  `Vitalidade de ${sheet.mount.name} atualizada.`,
                );
              else
                submit(
                  {
                    type: "hp",
                    mode:
                      dialog.kind === "damage"
                        ? "damage"
                        : dialog.kind === "temp"
                          ? "temp"
                          : "heal",
                    amount: numeric,
                    ...(dialog.kind === "damage" && s.hp === 0
                      ? { critical }
                      : {}),
                  },
                  "Vitalidade atualizada.",
                );
            }}
          >
            Confirmar registro
          </button>
          <p className="caption">Você pode desfazer este registro.</p>
        </>
      )}
      {(dialog.kind === "hit-dice" || dialog.kind === "mount-hit-dice") && (
        <>
          <p className="dialog-description">
            {isMountHd
              ? `${sheet.mount.name} tem ${hdRemaining} de ${sheet.mount.hitDice.maximum} d10 disponíveis. Cada d10 soma Constituição (${signed(hdConMod)}).`
              : `Percival tem ${hdRemaining} de ${sheet.hitDice.maximum} d10 disponíveis. Role fisicamente durante o descanso curto; Constituição (${signed(hdConMod)}) é somada por dado.`}
          </p>
          <div className="dice-count-row">
            <span>Dados d10 a gastar</span>
            <div className="quantity-control">
              <button
                aria-label="Diminuir quantidade de Dados de Vida"
                disabled={diceCount <= 1}
                onClick={() => setDiceCount((c) => Math.max(1, c - 1))}
              >
                <Minus size={15} />
              </button>
              <strong>{diceCount}</strong>
              <button
                aria-label="Aumentar quantidade de Dados de Vida"
                disabled={diceCount >= hdRemaining}
                onClick={() =>
                  setDiceCount((c) => Math.min(hdRemaining, c + 1))
                }
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
          <label className="field-label" htmlFor="hd-roll-amount">
            {diceCount === 1
              ? "Resultado físico do d10 (1 a 10)"
              : `Soma física dos ${diceCount}d10 (${diceCount} a ${diceCount * 10})`}
          </label>
          <input
            className="amount-input"
            id="hd-roll-amount"
            type="number"
            inputMode="numeric"
            min={diceCount}
            max={diceCount * 10}
            step="1"
            value={amount}
            placeholder="0"
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
          {validHdRoll && (
            <div className="result-preview">
              <span>
                Cura (+{hdHealing} PV · dado {numeric}{" "}
                {signed(diceCount * hdConMod)} CON)
              </span>
              <strong>
                {Math.min(hdMaxHp, hdCurrentHp + hdHealing)}
                <small> / {hdMaxHp}</small>
              </strong>
            </div>
          )}
          <button
            className="button primary full"
            disabled={!validHdRoll}
            onClick={() =>
              submit(
                {
                  type: isMountHd ? "mount-hit-dice" : "hit-dice",
                  count: diceCount,
                  rollTotal: numeric,
                },
                isMountHd
                  ? `Dados de Vida de ${sheet.mount.name} gastos (+${hdHealing} PV).`
                  : `Dados de Vida gastos (+${hdHealing} PV).`,
              )
            }
          >
            Gastar {diceCount}d10 e curar
          </button>
          <p className="caption">
            Em descanso longo, recuperam-se até{" "}
            {isMountHd
              ? sheet.mount.hitDice.longRestRecovery
              : sheet.hitDice.longRestRecovery}{" "}
            Dados de Vida gastos.
          </p>
        </>
      )}
      {dialog.kind === "smite" && (
        <>
          <p className="dialog-description">
            Use depois de acertar um ataque corpo-a-corpo com arma. O aplicativo
            informa os dados e gasta o espaço; você rola na mesa.
          </p>
          {slotPicker}
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={specialTarget}
              onChange={(e) => setSpecialTarget(e.target.checked)}
            />
            Alvo é corruptor ou morto-vivo
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={critical}
              onChange={(e) => setCritical(e.target.checked)}
            />
            Foi um acerto crítico
          </label>
          <div className="smite-result">
            <FlameSymbol />
            <strong>
              {slot > 0
                ? divineSmite(state.record, slot, {
                    fiendOrUndead: specialTarget,
                    critical,
                  }).expression
                : "Sem espaços"}
            </strong>
            <span>dano radiante adicional · role fisicamente</span>
          </div>
          <p className="caption">
            Não inclui o dano da arma
            {sheet.attacks.improvedDivineSmite
              ? " nem o 1d8 da Destruição Divina Aprimorada"
              : ""}
            .
          </p>
          <button
            className="button primary full"
            disabled={slot <= 0}
            onClick={() =>
              submit(
                { type: "smite", slotLevel: slot },
                "Espaço consumido para Destruição Divina.",
              )
            }
          >
            Consumir espaço de {slot}º círculo
          </button>
        </>
      )}
      {(dialog.kind === "blessing" || dialog.kind === "absorb") && (
        <>
          <div className="homebrew-description">
            {dialog.kind === "blessing" ? (
              <>
                <p>
                  Imbua sua arma por 1 minuto. Some{" "}
                  <strong>+{sheet.modifiers.cha} aos ataques</strong>. O
                  primeiro acerto aplica a Marca de Sangue.
                </p>
                <p>
                  Contra um alvo marcado, o ataque com a arma causa{" "}
                  <strong>+{sheet.modifiers.cha} radiante</strong> e remove a
                  marca. Controle as marcas e sua duração na mesa.
                </p>
              </>
            ) : (
              <>
                <p>
                  Toque uma criatura. Ela deve passar em uma salvaguarda de{" "}
                  <strong>Constituição CD {sheet.spellcasting.saveDC}</strong>{" "}
                  ou fica impedida.
                </p>
                <p>
                  A criatura repete o teste ao fim de cada turno dela. Não há
                  cura automática nessa habilidade.
                </p>
              </>
            )}
          </div>
          {sourcePicker}
          <button
            className="button primary full"
            disabled={resourceLeft <= 0 || s.hp === 0}
            onClick={() =>
              dialog.kind === "blessing"
                ? submit(
                    { type: "blessing", source },
                    "Bênção de Sangue ativada. O bônus permanece ao trocar de aba.",
                  )
                : submit(
                    {
                      type: "use-resource",
                      resource:
                        source === "class"
                          ? "channelDivinity"
                          : "amuletChannelDivinity",
                    },
                    "Absorver Vitalidade: recurso consumido. Resolva a salvaguarda na mesa.",
                  )
            }
          >
            {dialog.kind === "blessing"
              ? "Imbuir a alabarda"
              : "Consumir uso e aplicar na mesa"}
          </button>
        </>
      )}
      {dialog.kind === "spell" && spell && (
        <>
          <p className="dialog-description">
            {SPELL_DETAILS[spell.id]?.summary ??
              "Confira a descrição completa, os componentes e a concentração no livro. Este registro consome um espaço, sem resolver alvos ou danos automaticamente."}
          </p>
          {slotPicker}
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={concentration}
              onChange={(e) => setConcentration(e.target.checked)}
            />
            Manter concentração nesta magia
          </label>
          {concentration && s.concentration && (
            <p className="notice">
              A concentração anterior será substituída por esta magia.
            </p>
          )}
          <button
            className="button primary full"
            disabled={slot <= 0 || s.hp === 0}
            onClick={() =>
              submit(
                {
                  type: "cast",
                  spellId: spell.id,
                  slotLevel: slot,
                  concentration,
                },
                `${spell.name}: espaço consumido.`,
              )
            }
          >
            Conjurar com espaço de {slot}º
          </button>
        </>
      )}
      {dialog.kind === "rest" && (
        <>
          <p className="dialog-description">
            Confirme com a mesa antes de recuperar recursos. Descansar não faz o
            amanhecer acontecer automaticamente.
          </p>
          <div className="rest-options">
            {(["short", "long", "dawn"] as const).map((kind) => (
              <button
                className="rest-option"
                aria-pressed={rest === kind}
                onClick={() => setRest(kind)}
                key={kind}
              >
                {kind === "dawn" ? <Sun size={23} /> : <Moon size={23} />}
                <span>
                  <strong>
                    {kind === "short"
                      ? "Descanso curto"
                      : kind === "long"
                        ? "Descanso longo"
                        : "Amanhecer"}
                  </strong>
                  <small>
                    {kind === "short"
                      ? "Recupera Canalizar Divindade. Use Dados de Vida separadamente."
                      : kind === "long"
                        ? `Recupera PV, espaços, recursos e até ${sheet.hitDice.longRestRecovery} Dados de Vida.`
                        : "Recupera somente o uso adicional do amuleto."}
                  </small>
                </span>
              </button>
            ))}
          </div>
          {rest === "short" && (
            <div className="short-rest-hd">
              <p className="caption">
                Dados de Vida restantes:{" "}
                <strong>
                  {sheet.hitDice.maximum - s.hitDiceSpent}/
                  {sheet.hitDice.maximum} d10
                </strong>
                . Role na mesa se desejar curar-se durante a pausa.
              </p>
              {sheet.hitDice.maximum > s.hitDiceSpent && (
                <button
                  className="button secondary full"
                  onClick={() => open({ kind: "hit-dice" })}
                >
                  Gastar Dados de Vida de Percival
                </button>
              )}
            </div>
          )}
          <button
            className="button primary full"
            onClick={() =>
              submit(
                { type: "rest", kind: rest },
                "Recuperação registrada. Você pode desfazer.",
              )
            }
          >
            Confirmar{" "}
            {rest === "short"
              ? "descanso curto"
              : rest === "long"
                ? "descanso longo"
                : "amanhecer"}
          </button>
        </>
      )}
      {dialog.kind === "xp" && (
        <>
          <p className="dialog-description">
            XP atual:{" "}
            <strong>{sheet.xp.current.toLocaleString("pt-BR")} XP</strong>
            {sheet.xp.nextLevelThreshold
              ? ` (próximo nível em ${sheet.xp.nextLevelThreshold.toLocaleString("pt-BR")} XP).`
              : "."}{" "}
            Informe o XP ganho na sessão para somá-lo automaticamente.
          </p>
          <div className="segmented xp-mode-tabs">
            <button
              aria-pressed={xpMode === "add"}
              onClick={() => {
                setXpMode("add");
                setAmount("");
              }}
            >
              Somar XP ganho
            </button>
            <button
              aria-pressed={xpMode === "set"}
              onClick={() => {
                setXpMode("set");
                setAmount(String(sheet.xp.current));
              }}
            >
              Definir total
            </button>
          </div>
          <label className="field-label" htmlFor="xp-amount">
            {xpMode === "add" ? "XP ganho na aventura" : "Novo total de XP"}
          </label>
          <input
            className="amount-input"
            id="xp-amount"
            type="number"
            inputMode="numeric"
            min={xpMode === "add" ? 1 : 0}
            max={10000000}
            step="1"
            value={amount}
            placeholder="0"
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
          {xpMode === "add" && (
            <div className="quick-amounts">
              {[100, 250, 500, 1000].map((value) => (
                <button
                  key={value}
                  className="button secondary"
                  onClick={() =>
                    setAmount(
                      String(
                        (amount.trim() !== "" &&
                        Number.isSafeInteger(numeric) &&
                        numeric > 0
                          ? numeric
                          : 0) + value,
                      ),
                    )
                  }
                >
                  +{value}
                </button>
              ))}
            </div>
          )}
          {((xpMode === "add" && validNumber && numeric <= 10_000_000) ||
            (xpMode === "set" &&
              amount.trim() !== "" &&
              Number.isSafeInteger(numeric) &&
              numeric >= 0 &&
              numeric <= 10_000_000)) && (
            <>
              <div className="result-preview">
                <span>
                  {xpMode === "add"
                    ? `${sheet.xp.current.toLocaleString("pt-BR")} + ${numeric.toLocaleString("pt-BR")}`
                    : "Total após ajuste"}
                </span>
                <strong>
                  {(xpMode === "add"
                    ? sheet.xp.current + numeric
                    : numeric
                  ).toLocaleString("pt-BR")}{" "}
                  <small>XP</small>
                </strong>
              </div>
              {sheet.xp.nextLevelThreshold &&
                (xpMode === "add" ? sheet.xp.current + numeric : numeric) >=
                  sheet.xp.nextLevelThreshold && (
                  <p className="notice">
                    Meta de{" "}
                    {sheet.xp.nextLevelThreshold.toLocaleString("pt-BR")} XP do
                    nível {sheet.level + 1} alcançada. Subir de nível continua
                    exigindo autorização do mestre e o d10 físico em Ficha.
                  </p>
                )}
            </>
          )}
          <button
            className="button primary full"
            disabled={
              xpMode === "add"
                ? !validNumber || numeric > 10_000_000
                : amount.trim() === "" ||
                  !Number.isSafeInteger(numeric) ||
                  numeric < 0 ||
                  numeric > 10_000_000
            }
            onClick={() =>
              submit(
                { type: "xp", mode: xpMode, amount: numeric },
                xpMode === "add"
                  ? `+${numeric.toLocaleString("pt-BR")} XP somados (total ${(sheet.xp.current + numeric).toLocaleString("pt-BR")} XP).`
                  : `XP ajustado para ${numeric.toLocaleString("pt-BR")}.`,
              )
            }
          >
            {xpMode === "add"
              ? validNumber && numeric <= 10_000_000
                ? `Somar +${numeric.toLocaleString("pt-BR")} XP`
                : "Somar XP"
              : "Confirmar total de XP"}
          </button>
          <p className="caption">Você pode desfazer este registro.</p>
        </>
      )}
      {dialog.kind === "level" && (
        <>
          <p className="dialog-description">
            Percival alcançará o <strong>nível {sheet.level + 1}</strong>.
            Informe apenas o resultado do dado: Constituição será somada
            automaticamente.
          </p>
          {numberInput}
          {sheet.nextLevel?.requiresHomebrewDefinition && (
            <p className="notice">
              A característica do Juramento de Sangue deste nível depende do
              mestre. A ficha evolui os números conhecidos, mas não inventa a
              habilidade.
            </p>
          )}
          {sheet.nextLevel?.requiresImprovementChoice && (
            <fieldset>
              <legend>Seu incremento de atributo</legend>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={split}
                  onChange={(e) => setSplit(e.target.checked)}
                />
                Dividir em +1 para dois atributos
              </label>
              <label className="field-label" htmlFor="ability-choice">
                {split ? "Primeiro atributo (+1)" : "Atributo (+2)"}
              </label>
              <select
                id="ability-choice"
                value={ability}
                onChange={(e) => setAbility(e.target.value as Ability)}
              >
                <option value="">Escolha um atributo</option>
                {Object.entries(abilityNames).map(([id, name]) => (
                  <option value={id} key={id}>
                    {name} ({sheet.abilities[id as Ability]})
                  </option>
                ))}
              </select>
              {split && (
                <>
                  <label className="field-label" htmlFor="second-ability">
                    Segundo atributo (+1)
                  </label>
                  <select
                    id="second-ability"
                    value={secondAbility}
                    onChange={(e) =>
                      setSecondAbility(e.target.value as Ability)
                    }
                  >
                    <option value="">Escolha outro atributo</option>
                    {Object.entries(abilityNames)
                      .filter(([id]) => id !== ability)
                      .map(([id, name]) => (
                        <option value={id} key={id}>
                          {name}
                        </option>
                      ))}
                  </select>
                </>
              )}
              <p className="caption">
                Talentos novos precisam ter seus efeitos implementados antes da
                evolução. Não substitua um talento por um aumento fictício.
              </p>
            </fieldset>
          )}
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            O mestre autorizou esta evolução.
          </label>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button
            className="button primary full"
            disabled={!validNumber || numeric > 10 || !acknowledged}
            onClick={() => {
              if (
                sheet.nextLevel?.requiresImprovementChoice &&
                (!ability ||
                  (split && (!secondAbility || secondAbility === ability)))
              ) {
                setError("Escolha os atributos do incremento.");
                return;
              }
              submit(
                {
                  type: "level-up",
                  hitDieResult: numeric,
                  ...(sheet.nextLevel?.requiresImprovementChoice && ability
                    ? {
                        improvement: {
                          kind: "ability" as const,
                          increases: split
                            ? { [ability]: 1, [secondAbility]: 1 }
                            : { [ability]: 2 },
                        },
                      }
                    : {}),
                },
                "Percival evoluiu. PV atuais e gastos foram preservados.",
              );
            }}
          >
            Confirmar nível {sheet.level + 1}
          </button>
        </>
      )}
      {dialog.kind === "settings" && (
        <>
          <p className="dialog-description">
            Tudo fica neste navegador. Sem conta e sem sincronização entre
            aparelhos. Exporte uma cópia antes de limpar os dados do navegador.
          </p>
          <div className="backup-actions">
            <button className="button secondary" onClick={exportData}>
              <Download size={17} />
              Exportar backup
            </button>
            <label className="button secondary upload-button">
              <Upload size={17} />
              Importar backup
              <input
                type="file"
                accept="application/json,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importData(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {storageIssue && (
            <div className="notice">
              <p>{storageIssue}</p>
              <button className="text-button" onClick={recover}>
                Habilitar salvamento após recuperar os dados
              </button>
            </div>
          )}
          <h3 className="dialog-subheading">Confirmações permanentes</h3>
          <p className="caption">
            Confirmadas pela mesa para esta ficha. O acesso não prepara nem conjura
            magias automaticamente e não recupera recursos gastos.
          </p>
          <ul>
            <li>Percival está sintonizado com o Amuleto do Devoto +1</li>
            <li>A mesa concedeu Vínculo Protetor</li>
            <li>A mesa concedeu Oração Curativa</li>
            <li>A mesa concedeu Repouso Tranquilo</li>
          </ul>
          <label className="field-label" htmlFor="human-skill">
            Perícia adicional de humano variante
          </label>
          <select
            id="human-skill"
            value={skill || state.record.creation.extraHumanSkill || ""}
            onChange={(e) => setSkill(e.target.value as Skill)}
          >
            <option value="">Ainda não confirmada</option>
            {Object.entries(sheet.skills)
              .filter(
                ([id]) => !state.record.proficientSkills.includes(id as Skill),
              )
              .map(([id, entry]) => (
                <option key={id} value={id}>
                  {entry.name}
                </option>
              ))}
          </select>
          <button
            className="button secondary full"
            disabled={!skill}
            onClick={() => {
              if (skill)
                act(
                  { type: "human-skill", skill },
                  "Perícia humana confirmada.",
                );
            }}
          >
            Confirmar perícia
          </button>
          <p className="caption">
            A distribuição racial original, o idioma, o kit de jogo e as futuras
            habilidades de Sangue continuam documentados em PERCIVAL.md.
          </p>
        </>
      )}
    </Modal>
  );
}
function FlameSymbol() {
  return <Droplets size={27} strokeWidth={1.4} />;
}
