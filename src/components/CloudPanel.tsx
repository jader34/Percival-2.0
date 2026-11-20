import { useState } from 'react';
import { Cloud, Download, LogIn, LogOut } from 'lucide-react';
import type { CloudState } from '../cloud/useCloud.ts';
import { RECOVERY_PREFIX } from '../cloud/useCloud.ts';

const labels = { local: 'Somente neste aparelho', syncing: 'Sincronizando', synced: 'Sincronizado', migration: 'Pronto para enviar', conflict: 'Conflito entre versões', error: 'Erro na sincronização' };
interface Props { cloud: CloudState; paused: boolean; exportLocal: () => void; download: (text: string, filename: string) => void }
export function CloudPanel({ cloud, paused, exportLocal, download }: Props) {
  const [recovery, setRecovery] = useState<{ key: string; payload: string }[]>([]);
  const [recoveryError, setRecoveryError] = useState('');
  const { status } = cloud;
  const conflict = status.kind === 'conflict';
  return <details className={`cloud-panel cloud-${status.kind}`}>
    <summary><Cloud size={17} /><span aria-live="polite">{labels[status.kind]}</span><span className="cloud-summary-action">Conta e nuvem</span></summary>
    <div className="cloud-content">
      <p role={status.kind === 'error' || conflict ? 'alert' : 'status'}>{status.message}</p>
      {!cloud.enabled && <p>A nuvem está bloqueada até publicar e testar as regras fechadas. A ativação está descrita em FIREBASE.md; a ficha local continua funcionando.</p>}
      <div className="cloud-actions">
        {cloud.uid ? <button className="button secondary" disabled={cloud.authBusy} onClick={() => void cloud.logout()}><LogOut size={16} />Sair da conta</button>
          : <button className="button secondary" disabled={!cloud.enabled || !cloud.ready || cloud.authBusy} onClick={() => void cloud.login()}><LogIn size={16} />{cloud.authBusy ? 'Aguardando Google…' : 'Entrar com Google'}</button>}
        {status.kind === 'error' && cloud.enabled && <button className="button secondary" onClick={cloud.retry}>Tentar novamente</button>}
      </div>
      {cloud.enabled && <p className="cloud-help">A entrada fica salva neste navegador. Sair não apaga a ficha local. Use apenas em aparelhos de confiança.</p>}
      {(conflict || status.kind === 'migration') && <>
        <div className="cloud-actions">
          <button className="button secondary" onClick={exportLocal}><Download size={16} />Exportar ficha local</button>
          {cloud.remoteBackup() && <button className="button secondary" onClick={() => { const raw = cloud.remoteBackup(); if (raw) download(raw, 'percival-nuvem.json'); }}><Download size={16} />Exportar ficha da nuvem</button>}
        </div>
        <div className="cloud-actions">
          <button className="button primary" disabled={paused} onClick={() => {
            if (window.confirm(conflict ? 'Substituir a versão da nuvem pela ficha deste aparelho? A versão anterior será preservada neste navegador. Se outro aparelho alterá-la agora, a operação será recusada.' : 'Enviar esta ficha para a nuvem? Nenhuma ficha remota será substituída.')) cloud.keepLocal();
          }}>{conflict ? 'Manter ficha deste aparelho' : 'Enviar esta ficha para a nuvem'}</button>
          {cloud.remoteBackup() && <button className="button secondary" disabled={paused} onClick={() => {
            if (window.confirm('Usar a ficha da nuvem neste aparelho? A ficha local atual será preservada nos backups de recuperação.')) cloud.useRemote();
          }}>Usar ficha da nuvem</button>}
        </div>
      </>}
      <details className="cloud-recovery" onToggle={event => {
        if (!event.currentTarget.open) return;
        try {
          const keys = Object.keys(localStorage).filter(key => key.startsWith(RECOVERY_PREFIX)).sort().reverse();
          setRecovery(keys.map(key => ({ key, payload: localStorage.getItem(key)! })));
          setRecoveryError('');
        } catch { setRecoveryError('Não foi possível ler os backups preservados neste navegador.'); }
      }}>
        <summary>Backups de recuperação neste aparelho</summary>
        {recoveryError && <p role="alert">{recoveryError}</p>}
        {!recovery.length && !recoveryError && <p>Nenhuma substituição preservada. Exporte backups regularmente; limpar os dados do navegador também apaga estas cópias.</p>}
        {recovery.map(({ key, payload }) => <button key={key} className="button secondary" onClick={() => download(payload, 'percival-recuperacao.json')}><Download size={16} />{key.slice(RECOVERY_PREFIX.length, RECOVERY_PREFIX.length + 19).replace('T', ' ')} UTC</button>)}
      </details>
    </div>
  </details>;
}
