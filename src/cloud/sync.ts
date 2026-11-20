import { parseBackup } from '../session/state.ts';

export const MAX_PAYLOAD = 5_000_000;
export function decode(value: unknown): Envelope | null {
  if (value === null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Registro remoto inválido.');
  const e = value as Envelope;
  if (Object.keys(e).sort().join(',') !== 'payload,revision' || !Number.isSafeInteger(e.revision) || e.revision < 1 || e.revision >= Number.MAX_SAFE_INTEGER || typeof e.payload !== 'string' || e.payload.length > MAX_PAYLOAD) throw new Error('Registro remoto inválido.');
  parseBackup(e.payload);
  return { revision: e.revision, payload: e.payload };
}
export function compareAndSwap(current: unknown, expected: Envelope | null, payload: string): Envelope | undefined {
  const actual = decode(current);
  if (!same(actual, expected)) return undefined;
  return decode({ revision: (actual?.revision ?? 0) + 1, payload })!;
}
export interface Envelope { revision: number; payload: string }
export type SyncStatus = { kind: 'local' | 'syncing' | 'synced' | 'migration' | 'conflict' | 'error'; message: string };
export interface Transport {
  subscribe(value: (value: unknown) => void, connected: (online: boolean) => void, error: (error: unknown) => void): () => void;
  cas(expected: Envelope | null, payload: string): Promise<{ committed: boolean; value: unknown }>;
}
interface Options {
  local: string; base: Envelope | null; transport: Transport;
  status: (status: SyncStatus) => void;
  saveBase: (base: Envelope) => void;
  archive: (payload: string) => void;
  adopt: (payload: string) => void;
}
export class SyncSession {
  private local: string;
  private base: Envelope | null;
  private remote: Envelope | null = null;
  private read = false;
  private online = false;
  private paused = false;
  private active = true;
  private busy = false;
  private failed = false;
  private unsubscribe: (() => void) | undefined;
  private options: Options;
  constructor(options: Options) {
    this.options = options; this.local = options.local; this.base = options.base;
  }
  private show(kind: SyncStatus['kind'], message: string) {
    if (this.active) this.options.status({ kind, message });
  }
  private error = (_error: unknown) => {
    this.failed = true;
    this.read = false;
    this.show('error', 'Não foi possível sincronizar. Sua ficha local foi mantida. Verifique a conexão, a conta e as regras; depois tente novamente.');
  };
  start() {
    this.show('syncing', 'Lendo a ficha na nuvem antes de enviar alterações…');
    this.unsubscribe = this.options.transport.subscribe(value => {
      if (!this.active) return;
      try { this.remote = decode(value); this.read = true; this.process(); }
      catch (error) { this.error(error); }
    }, online => {
      if (!this.active) return;
      this.online = online;
      this.process();
    }, this.error);
  }
  update(local: string, paused: boolean) {
    this.local = local; this.paused = paused; this.process();
  }
  private remember(value: Envelope) {
    this.options.saveBase(value); this.base = value;
  }
  private process() {
    if (!this.active || this.busy || this.failed) return;
    if (this.paused) { this.show('local', 'Sincronização pausada. Salve as notas e resolva os avisos locais.'); return; }
    if (!this.online) { this.show('local', 'Sem conexão com a nuvem. Alterações permanecem neste aparelho.'); return; }
    if (!this.read) { this.show('syncing', 'Lendo a ficha na nuvem antes de enviar alterações…'); return; }
    try {
      const decision = reconcile(this.local, this.base, this.remote);
      if (decision === 'synced') { this.remember(this.remote!); this.show('synced', 'Ficha sincronizada com a nuvem.'); }
      else if (decision === 'push') void this.push(this.remote);
      else if (decision === 'migration') this.show('migration', 'Nenhuma ficha na nuvem. Envie a ficha deste aparelho quando estiver pronto.');
      else this.show('conflict', 'As versões são diferentes. Exporte as duas antes de escolher qual manter. Nada foi substituído.');
    } catch (error) { this.error(error); }
  }
  private async push(expected: Envelope | null) {
    if (!this.active || this.busy || this.paused || !this.online || !this.read) return;
    const payload = this.local;
    this.busy = true; this.show('syncing', 'Enviando alterações com verificação de revisão…');
    try {
      const result = await this.options.transport.cas(expected, payload);
      if (!this.active) return;
      const receipt = decode(result.value);
      // A listener may already have observed a later commit from another device.
      if (!this.remote || !receipt || this.remote.revision <= receipt.revision) this.remote = receipt;
      if (result.committed) {
        if (!receipt || receipt.payload !== payload) throw new Error('Confirmação divergente.');
        this.remember(receipt);
      } else {
        // Never loop a stale write after a transaction is refused.
        this.base = null;
      }
      this.busy = false; this.process();
    } catch (error) { this.busy = false; this.error(error); }
  }
  keepLocal() {
    if (!this.active || this.failed || this.busy || this.paused || !this.online || !this.read) return;
    try {
      if (this.remote) this.options.archive(this.remote.payload);
      void this.push(this.remote);
    } catch (error) { this.error(error); }
  }
  useRemote() {
    if (!this.active || this.failed || this.busy || this.paused || !this.online || !this.read || !this.remote) return;
    try {
      this.options.archive(this.local);
      this.options.adopt(this.remote.payload);
      this.local = this.remote.payload;
      this.remember(this.remote);
      this.process();
    } catch (error) { this.error(error); }
  }
  remoteBackup() { return this.remote?.payload ?? null; }
  stop() { this.active = false; this.unsubscribe?.(); }
}

export type Decision = 'migration' | 'conflict' | 'push' | 'synced';
export function same(a: Envelope | null, b: Envelope | null): boolean {
  return a === b || !!(a && b && a.revision === b.revision && a.payload === b.payload);
}
export function reconcile(local: string, base: Envelope | null, remote: Envelope | null): Decision {
  if (!remote) return base ? 'conflict' : 'migration';
  if (local === remote.payload) return 'synced';
  return base && same(base, remote) ? 'push' : 'conflict';
}
