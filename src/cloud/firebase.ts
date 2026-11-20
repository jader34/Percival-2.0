import { FIREBASE_SYNC_ENABLED, firebaseConfig } from './config.ts';
import { isOwner, OWNER_EMAIL } from './identity.ts';
import { compareAndSwap } from './sync.ts';
import type { Transport } from './sync.ts';
import type { User } from 'firebase/auth';

export async function connectFirebase() {
  if (!FIREBASE_SYNC_ENABLED) throw new Error('Publique e teste as regras fechadas antes de ativar a nuvem.');
  const [appSDK, authSDK, dbSDK] = await Promise.all([
    import('firebase/app'), import('firebase/auth'), import('firebase/database'),
  ]);
  const app = appSDK.getApps().find(a => a.name === 'percival-cloud') ?? appSDK.initializeApp(firebaseConfig, 'percival-cloud');
  const auth = authSDK.getAuth(app);
  await authSDK.setPersistence(auth, authSDK.browserLocalPersistence);
  const db = dbSDK.getDatabase(app);
  dbSDK.goOffline(db);
  const provider = new authSDK.GoogleAuthProvider();
  provider.setCustomParameters({ login_hint: OWNER_EMAIL, prompt: 'select_account' });
  return {
    observe: (next: (user: User | null) => void, error: (error: Error) => void) => authSDK.onIdTokenChanged(auth, next, error),
    login: () => authSDK.signInWithPopup(auth, provider),
    logout: async () => { dbSDK.goOffline(db); await authSDK.signOut(auth); },
    transport: (uid: string): Transport => {
      let active = true;
      const permitted = () => active && auth.currentUser?.uid === uid && isOwner(auth.currentUser);
      const target = dbSDK.ref(db, `sheets/${uid}`);
      return {
        subscribe(value, connected, error) {
          if (!permitted()) throw new Error('Conta não autorizada.');
          const stopValue = dbSDK.onValue(target, snapshot => { if (permitted()) value(snapshot.val()); }, error);
          const stopConnection = dbSDK.onValue(dbSDK.ref(db, '.info/connected'), snapshot => { if (permitted()) connected(snapshot.val() === true); }, error);
          dbSDK.goOnline(db);
          return () => { active = false; stopValue(); stopConnection(); dbSDK.goOffline(db); };
        },
        async cas(expected, payload) {
          if (!permitted()) throw new Error('Conta não autorizada.');
          const result = await dbSDK.runTransaction(target, current => {
            if (!permitted()) return undefined;
            return compareAndSwap(current, expected, payload);
          }, { applyLocally: false });
          return { committed: result.committed, value: result.snapshot.val() };
        },
      };
    },
  };
}
export type FirebaseClient = Awaited<ReturnType<typeof connectFirebase>>;

export function authMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'Entrada cancelada. Sua ficha continua neste aparelho.';
  if (code === 'auth/popup-blocked') return 'O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente novamente.';
  if (code === 'auth/unauthorized-domain') return 'Este domínio não está autorizado no Firebase Auth. Consulte FIREBASE.md.';
  if (code === 'auth/network-request-failed') return 'Sem conexão com o Google. Continue localmente e tente entrar quando a rede voltar.';
  if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') return 'O login Google ainda precisa ser habilitado no Firebase Auth.';
  return 'Não foi possível entrar ou manter a sessão. Sua ficha local foi preservada. Tente novamente.';
}
