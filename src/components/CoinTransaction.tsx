import { useState } from "react";
import type { AppState } from "../session/state.ts";
import type { SessionAction } from "./shared.ts";

const coinNames = { gp: "ouro", sp: "prata", cp: "cobre" } as const;
type Coin = keyof AppState["record"]["coins"];

export function CoinTransaction({ state, mode, submit }: {
  state: AppState;
  mode: "receive" | "spend";
  submit: (action: SessionAction, message: string) => void;
}) {
  const [coin, setCoin] = useState<Coin>("gp");
  const [amount, setAmount] = useState("");
  const numeric = Number(amount);
  const balance = state.record.coins[coin];
  const name = coinNames[coin];
  const valid = /^\d+$/.test(amount) && Number.isSafeInteger(numeric) && numeric > 0;
  const error = !valid
    ? "Informe um inteiro positivo, apenas com algarismos, dentro do limite seguro."
    : mode === "spend" && numeric > balance
      ? `Saldo insuficiente: há ${balance.toLocaleString("pt-BR")} de ${name}. Diminua a quantidade ou escolha outra moeda.`
      : mode === "receive" && numeric > Number.MAX_SAFE_INTEGER - balance
        ? "O saldo ultrapassaria o limite seguro de moedas. Diminua a quantidade."
        : "";
  const nextBalance = error ? balance : balance + (mode === "receive" ? numeric : -numeric);
  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      if (error) return;
      submit({ type: "coins", mode, coin, amount: numeric },
        `${mode === "receive" ? "Recebido" : "Gasto"}: ${numeric.toLocaleString("pt-BR")} de ${name}. Saldo: ${nextBalance.toLocaleString("pt-BR")} de ${name}.`);
    }}>
      <p className="dialog-description" id="coin-help">Registre somente a moeda escolhida. Não há conversão automática entre ouro, prata e cobre.</p>
      <label className="field-label" htmlFor="coin-kind">Moeda</label>
      <select id="coin-kind" value={coin} onChange={event => setCoin(event.target.value as Coin)}>
        {(Object.keys(state.record.coins) as Coin[]).map(id => <option key={id} value={id}>{coinNames[id]}</option>)}
      </select>
      <p className="caption">Saldo atual: <strong>{balance.toLocaleString("pt-BR")} de {name}</strong></p>
      <label className="field-label" htmlFor="coin-amount">Quantidade a {mode === "receive" ? "receber" : "gastar"}</label>
      <input id="coin-amount" className="amount-input coin-amount" type="text" inputMode="numeric" pattern="[0-9]+"
        value={amount} onChange={event => setAmount(event.target.value)} placeholder="0" autoFocus
        aria-invalid={amount !== "" && !!error} aria-describedby={`coin-help${amount !== "" && error ? " coin-error" : ""}`} />
      {amount !== "" && error && <p id="coin-error" className="form-error" role="alert">{error}</p>}
      {!error && <div className="result-preview coin-preview" role="status"><span>Saldo após {mode === "receive" ? "receber" : "gastar"}</span><strong>{nextBalance.toLocaleString("pt-BR")} <small>de {name}</small></strong></div>}
      <button className="button primary full" type="submit" disabled={!!error}>Confirmar {mode === "receive" ? "recebimento" : "gasto"}</button>
      <p className="caption">Você pode desfazer este registro.</p>
    </form>
  );
}
