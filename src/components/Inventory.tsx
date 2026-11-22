import {
  Backpack,
  Coins,
  Droplets,
  Minus,
  Plus,
  Shield,
  Sword,
} from "lucide-react";
import type { PanelProps } from "./shared.ts";
export function Inventory({ state, sheet, act, open }: PanelProps) {
  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <h2>O que carrego</h2>
          <p>Aço, relíquias e o necessário para a próxima jornada.</p>
        </div>
        <Backpack size={34} strokeWidth={1} />
      </div>
      <div className="coin-strip">
        <Coins size={24} />
        <div>
          <strong>{state.record.coins.gp}</strong>
          <span>ouro</span>
        </div>
        <div>
          <strong>{state.record.coins.sp}</strong>
          <span>prata</span>
        </div>
        <div>
          <strong>{state.record.coins.cp}</strong>
          <span>cobre</span>
        </div>
      </div>
      <div className="coin-actions">
        <button className="button secondary" onClick={() => open({ kind: "coins", mode: "receive" })}>
          <Plus size={18} aria-hidden="true" />Receber moedas
        </button>
        <button className="button secondary" onClick={() => open({ kind: "coins", mode: "spend" })}>
          <Minus size={18} aria-hidden="true" />Gastar moedas
        </button>
      </div>
      <p className="caption">
        Inventário inicial importado do cadastro antigo. Confira as quantidades
        com sua mesa.
      </p>
      <div className="inventory-list">
        {state.record.equipment.map((item) => {
          const Icon =
            item.id === "halberd"
              ? Sword
              : item.id === "greater-healing-potion"
                ? Droplets
                : Shield;
          const consumable = ["greater-healing-potion", "rations"].includes(
            item.id,
          );
          return (
            <article className="inventory-item" key={item.id}>
              <div className="item-header">
                <Icon size={24} strokeWidth={1.4} />
                <div>
                  <h3>{item.name}</h3>
                  <span>
                    {item.weightKg.toLocaleString("pt-BR")} kg por unidade
                    {item.id === "amulet-of-the-devout" &&
                      ` · ${item.attuned ? "Sintonizado" : "Sintonização não confirmada"}`}
                  </span>
                </div>
                {!consumable && (
                  <button
                    className="equip-toggle"
                    aria-pressed={item.equipped}
                    onClick={() =>
                      act(
                        {
                          type: "equipment",
                          id: item.id,
                          equipped: !item.equipped,
                        },
                        `${item.name}: ${item.equipped ? "desequipado" : "equipado"}.`,
                      )
                    }
                  >
                    {item.equipped ? "Equipado" : "Equipar"}
                  </button>
                )}
              </div>
              <p>{item.description}</p>
              <div className="item-footer">
                <span>Quantidade</span>
                <div className="quantity-control">
                  <button
                    aria-label={`Diminuir quantidade de ${item.name}`}
                    disabled={item.quantity === 0}
                    onClick={() =>
                      act({
                        type: "item-quantity",
                        id: item.id,
                        quantity: item.quantity - 1,
                      }, `${item.name}: quantidade ${item.quantity - 1}.`)
                    }
                  >
                    <Minus size={15} />
                  </button>
                  <strong>{item.quantity}</strong>
                  <button
                    aria-label={`Aumentar quantidade de ${item.name}`}
                    onClick={() =>
                      act({
                        type: "item-quantity",
                        id: item.id,
                        quantity: item.quantity + 1,
                      }, `${item.name}: quantidade ${item.quantity + 1}.`)
                    }
                  >
                    <Plus size={15} />
                  </button>
                </div>
                {item.id === "greater-healing-potion" && (
                  <button
                    className="button compact"
                    disabled={item.quantity === 0}
                    onClick={() => open({ kind: "potion" })}
                  >
                    Beber poção
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <section className="mount-inventory" aria-label="Equipamento da montaria">
        <div className="section-heading">
          <h2>{sheet.mount.name}</h2>
          <span>
            {sheet.mount.species} · {state.session.mount.hp}/
            {sheet.mount.hpMax} PV
          </span>
        </div>
        <article className="inventory-item">
          <div className="item-header">
            <Shield size={24} strokeWidth={1.4} />
            <div>
              <h3>{sheet.mount.armor.name}</h3>
              <span>
                {sheet.mount.armor.weightKg.toLocaleString("pt-BR")} kg na
                montaria · CA {sheet.mount.armorClass}
              </span>
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
                    ? "Cota de talas retirada da montaria."
                    : "Cota de talas equipada na montaria.",
                )
              }
            >
              {sheet.mount.armor.equipped ? "Equipado" : "Equipar"}
            </button>
          </div>
          <p>
            Armadura pesada de montaria: CA 17, exige Força 15 (atendida pela
            Força 18 do Cavalo de Guerra) e impõe desvantagem em Furtividade à
            montaria.
          </p>
        </article>
      </section>
    </section>
  );
}
