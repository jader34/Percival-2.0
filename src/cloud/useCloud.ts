import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { parseBackup, serialize } from '../session/state.ts';
import type { AppState } from '../session/state.ts';
import { FIREBASE_SYNC_ENABLED } from './config.ts';
import { authMessage, connectFirebase } from './firebase.ts';
import type { FirebaseClient } from './firebase.ts';
import { isOwner } from './identity.ts';
import { decode, SyncSession } from './sync.ts';
import type { SyncStatus } from './sync.ts';

export const RECOVERY_PREFIX = 'percival-cloud-recovery-';
const localStatus: SyncStatus = { kind: 'local', message: 'Entre com Google para compartilhar a ficha entre seus aparelhos.' };

export function useCloud(state: AppState, paused: boolean, storageKey: string, adopt: (state: AppState) => void) {
  const [status, setStatus] = useState<SyncStatus>(localStatus);
  const [uid, setUid] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const client = useRef<FirebaseClient | null>(null);
  const session = useRef<SyncSession | null>(null);
  const latest = useRef({ state, paused, adopt });
  latest.current = { state, paused, adopt };

  useEffect(() => {
    if (!FIREBASE_SYNC_ENABLED) return;
    let active = true;
    let unobserve: (() => void) | undefined;
    setReady(false);
    const fail = (error: unknown) => {
      if (!active) return;
      session.current?.stop(); session.current = null;
      setStatus({ kind: 'error', message: authMessage(error) });
    };
    void connectFirebase().then(api => {
      if (!active) return;
      client.current = api; setReady(true);
      unobserve = api.observe(user => {
        if (!active) return;
        session.current?.stop(); session.current = null;
        setUid(null);
        if (!user) { setStatus(localStatus); return; }
        if (!isOwner(user)) {
          setStatus({ kind: 'error', message: 'Conta não autorizada. Saia e entre com a conta proprietária verificada. Nenhuma ficha foi enviada.' });
          // Keep a sign-out action available, but never attach a database listener.
          setUid(user.uid); return;
        }
        setUid(user.uid);
        try {
          const baseKey = `percival-cloud-base-${user.uid}`;
          let base = null;
          try { const saved = localStorage.getItem(baseKey); base = saved ? decode(JSON.parse(saved)) : null; }
          catch { /* Missing/corrupt metadata means explicit reconciliation, never overwrite. */ }
          const sync = new SyncSession({
            local: serialize(latest.current.state), base, transport: api.transport(user.uid), status: setStatus,
            saveBase: value => localStorage.setItem(baseKey, JSON.stringify(value)),
            archive: payload => {
              parseBackup(payload);
              localStorage.setItem(`${RECOVERY_PREFIX}${new Date().toISOString()}-${crypto.randomUUID()}`, payload);
            },
            adopt: payload => {
              if (latest.current.paused) throw new Error('Há alterações locais não salvas.');
              const next = parseBackup(payload);
              // Persist before changing React state: quota failures cannot discard local state.
              localStorage.setItem(storageKey, payload);
              latest.current.adopt(next);
            },
          });
          session.current = sync;
          sync.update(serialize(latest.current.state), latest.current.paused);
          sync.start();
        } catch (error) { fail(error); }
      }, fail);
    }).catch(fail);
    return () => {
      active = false; unobserve?.(); session.current?.stop(); session.current = null; client.current = null;
    };
  }, [attempt, storageKey]);

  // Publish committed edits/draft guards before external listeners can act on
  // the previous render. A passive effect leaves a window for unsafe adoption.
  useLayoutEffect(() => { session.current?.update(serialize(state), paused); }, [state, paused]);
  const login = async () => {
    if (!client.current || authBusy) return;
    setAuthBusy(true);
    try { await client.current.login(); }
    catch (error) { setStatus({ kind: 'error', message: authMessage(error) }); }
    finally { setAuthBusy(false); }
  };
  const logout = async () => {
    session.current?.stop(); session.current = null;
    setAuthBusy(true);
    try { await client.current?.logout(); setUid(null); setStatus(localStatus); }
    catch (error) { setStatus({ kind: 'error', message: authMessage(error) }); }
    finally { setAuthBusy(false); }
  };
  return {
    status, uid, ready, authBusy, login, logout,
    enabled: FIREBASE_SYNC_ENABLED,
    retry: () => setAttempt(value => value + 1),
    keepLocal: () => session.current?.keepLocal(),
    useRemote: () => session.current?.useRemote(),
    remoteBackup: () => session.current?.remoteBackup() ?? null,
  };
}
export type CloudState = ReturnType<typeof useCloud>;
