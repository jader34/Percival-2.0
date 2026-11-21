# Firebase — ativação segura da ficha de Percival

## Estado desta entrega

A integração recebe atualizações remotas automaticamente quando a ficha deste aparelho ainda coincide com a última base sincronizada e não há rascunhos/avisos locais. O usuário informou que publicou as regras e ativou `VITE_FIREBASE_SYNC_ENABLED=true` na Vercel, com login funcionando no PC e no celular. Isso é contexto informado, não uma nova verificação de produção. Nesta alteração não houve login real, acesso ao banco real, leitura de secrets/.env, publicação de regras, commit, push ou deploy. Sem a flag, a rede continua desativada por padrão.

`src/cloud/config.ts` contém somente a configuração pública fornecida. A mensagem original trouxe `databaseURL` como `@url:` seguido de uma URL entre crases. Essa marcação **não é uma URL válida**: foi extraído explicitamente o conteúdo `https://percival2-4650c-default-rtdb.firebaseio.com`. O código valida protocolo, host, caminho e ausência de credenciais/query/hash. Não há Analytics, Measurement ID, credenciais administrativas ou secrets nesta integração.

## Antes de ativar

1. Exporte a ficha atual em **Ajustes e backup**. Preserve também arquivos de outros aparelhos.
2. No projeto Firebase `percival2-4650c`, habilite o provedor **Google** em Authentication → Sign-in method, escolhendo o e-mail de suporte solicitado pelo console.
3. Em Authentication → Settings → Authorized domains, autorize `percival-2-0.vercel.app`. Para teste local, autorize também `localhost` (e o host exato utilizado, se diferente). Não presuma que localhost está habilitado automaticamente.
4. Teste `database.rules.json` no emulador local (instruções abaixo). Publique **o arquivo inteiro**, substituindo as regras públicas; não mantenha permissões abertas em nenhum ancestral. Em uma instalação nova, a publicação é manual; não foi executada nem inspecionada nesta alteração.
5. Confirme no console que a regra publicada é a fechada. O caminho `/sheets/$uid` exige simultaneamente: `auth.uid == $uid`, e-mail exato `lavytraveco@gmail.com`, `email_verified == true` e `firebase.sign_in_provider == google.com`. Raiz, outros caminhos, outros usuários e exclusão são negados. Revisão deve avançar exatamente uma unidade. Campos desconhecidos são negados.
6. Só então configure a variável pública de build `VITE_FIREBASE_SYNC_ENABLED=true`. Na Vercel, aplique somente ao ambiente desejado e gere um novo build quando decidir publicar. A flag não é uma proteção de servidor: **as Security Rules são a autorização real**. O teste de e-mail no cliente é apenas UX.
7. Valide com login real da proprietária em um aparelho confiável. O Google pode exigir nova autorização após logout, revogação, limpeza de dados ou expiração da sessão. A persistência é local ao navegador/perfil, não uma promessa de autenticação permanente.

Não altere a flag antes dos passos de regras. A versão entregue continua local e não inicializa o SDK com a flag ausente/false.

## Uso e reconciliação

- Abra **Conta e nuvem**. Com a ativação concluída, **Entrar com Google** abre a autenticação; **Sair da conta** mantém a ficha e os backups neste navegador.
- Antes de qualquer envio, o controlador aguarda a leitura remota. Banco vazio exige **Enviar esta ficha para a nuvem** e confirmação; a ficha padrão nunca é enviada automaticamente no primeiro acesso.
- Com uma base conhecida e a ficha local inalterada, uma revisão remota mais nova é recebida automaticamente, com backup local antes da substituição. A base persistida permite reconhecer esse caso após recarregar/reconectar. Notificações repetidas da mesma versão não geram novas substituições.
- Se ambas as versões mudaram, ou se não existe base conhecida e os conteúdos diferem, aparece **Conflito entre versões**. Não há mesclagem automática nem last-write-wins silencioso. Exporte ambas e escolha **Manter ficha deste aparelho** ou **Usar ficha da nuvem**. Revisões regredidas ou conteúdo diferente na mesma revisão também não são adotados automaticamente.
- Ao substituir uma versão, a anterior é arquivada localmente. Os arquivos ficam em **Backups de recuperação neste aparelho**, para exportar individualmente e importar pelo fluxo normal de backup. Se não houver espaço para preservar a versão, a substituição é interrompida.
- Cada envio usa `runTransaction`, comparando revisão **e payload** da versão-base. Um concorrente vence? A transação é recusada e o conflito reaparece. A confirmação de commit não esconde um evento remoto de revisão posterior.
- A ficha inteira, incluindo histórico/desfazer e log, viaja como string produzida por `serialize`, validada por `parseBackup`. Isso preserva arrays/objetos vazios que o RTDB normalizaria/removeria se fossem enviados como árvores. O envelope remoto contém somente `revision` e `payload`; o cliente rejeita dados inválidos antes de adotá-los. As regras limitam o tamanho/tipo do texto, mas não interpretam seu JSON interno.
- Mudanças locais durante um envio são mantidas e enviadas em seguida. Offline, a ficha continua local; após reconectar, a revisão é comparada antes de confirmar. Falhas de permissão, registro remoto inválido e erros de persistência exigem **Tentar novamente** após corrigir a causa.
- Notas em rascunho continuam controladas pelo App; não são sincronizadas nem descartadas. Durante a pausa, o controlador guarda a última notificação remota. Reverter o rascunho ao texto salvo permite recebê-la automaticamente se a ficha continuar limpa. Salvar notas divergentes cria edição local e exige escolha caso a nuvem também tenha mudado. Falha de armazenamento local ou conflito com outra aba também pausa a sincronização. O hook publica edições e a proteção de rascunhos na fase de layout do React, antes que listeners possam substituir um estado já atualizado usando a base do render anterior.
- Listeners são cancelados ao sair/trocar de sessão/desmontar; callbacks tardios não alteram o estado. Uma requisição já aceita pelo servidor antes de sair não pode ser desfeita pelo logout. Validação real desse cenário exige teste autenticado.

### Limites de armazenamento

`percival-session-v1` continua sendo a ficha local. `percival-cloud-base-<uid>` guarda a última base confirmada para reconhecer edições offline. `percival-cloud-recovery-<data>-<id>` guarda versões substituídas. Essas cópias não são apagadas automaticamente; a quota do navegador pode esgotar. Exporte-as e preserve fora do navegador antes de qualquer limpeza. Sair da conta **não** torna um aparelho compartilhado seguro, pois os dados locais permanecem legíveis ali.

O aplicativo já carregado pode editar sem rede; não foi adicionada uma PWA/service worker. Não se promete abrir a aplicação do zero sem internet. O rascunho de notas é memória de interface com aviso de saída, não persistência entre recargas.

## Testes locais sem tocar em produção

```sh
npm ci
npm test
npm run test:ui
npm run build
npm audit
```

`tests/sync.test.mjs` cobre a decisão de recepção, transações e falhas. `tests/sync-devices.test.mjs` usa dois controladores reais, armazenamento separado e transporte compartilhado em memória, com agendamento explícito de commits/confirmações: testa ida e volta PC/celular, concorrência, reconexão com base persistida, edição offline, rascunhos, notificações repetidas e falhas de backup. `tests/cloud-ui.test.tsx` monta App/hook reais em JSDOM, substituindo apenas a fronteira Firebase/configuração; verifica rascunhos, rajadas remotas, armazenamento e logout. `test:ui` também mantém os testes de renderização existentes. O mock de módulos do Node exige `--experimental-test-module-mocks` e emite aviso experimental.

Esses testes não acessam Firebase e não representam OAuth aprovado, semântica do SDK/emulador, entrega real de eventos de rede, navegadores móveis ou teste ponta a ponta em aparelhos físicos. Nenhuma nova validação visual em navegador foi realizada nesta alteração; a mudança visual se limita ao texto explicativo do painel.

### Regras no emulador

Pré-requisitos: Java compatível com a versão atual do Firebase CLI e `firebase-tools` disponível. Nesta máquina `java -version` falhou (`java: command not found`) e não havia CLI Firebase executável. Portanto **a semântica das regras não foi validada no emulador nesta entrega**. O teste foi preparado; a execução direta verificou a trava que recusa rodar sem host local explícito.

Depois de instalar os pré-requisitos, use um projeto **demo**, nunca o ID real:

```sh
npx --package firebase-tools firebase emulators:exec --project demo-percival --only database "npm run test:rules"
```

`firebase.json` fixa o emulador em `127.0.0.1:9000`. `tests/firebase.rules.emulator.mjs` recusa qualquer outro valor de `FIREBASE_DATABASE_EMULATOR_HOST`, usa `demo-percival` e testa leitura/escrita autorizadas, outras contas, outro UID, provedor incorreto, e-mail não verificado, acesso na raiz, exclusão, revisão, payload e campos extras. Não coloque credenciais reais nos testes.

### Validação final ainda necessária

Após regras publicadas e flag ativada, teste manualmente: login da proprietária e conta negada; autorização do domínio Vercel; primeiro envio explícito; conflito em dois dispositivos; edição offline/reconexão; edição durante envio; rascunho de notas; sair durante uma operação; persistência após recarregar; exportação/recuperação. Nenhum desses cenários foi declarado aprovado com OAuth real.

## Dependências e referências

O SDK é modular (`firebase/app`, `firebase/auth`, `firebase/database`) e carregado dinamicamente. O pacote Firebase inclui uma dependência transitiva de gRPC via Firestore, que não é usado nesta aplicação; foi aplicado override `@grpc/grpc-js ^1.14.7` para corrigir os alertas reportados pelo `npm audit`. A auditoria posterior retornou zero vulnerabilidades. Não foi feito downgrade automático do Firebase.

Documentação oficial de referência:
- `https://firebase.google.com/docs/auth/web/google-signin`
- `https://firebase.google.com/docs/auth/web/auth-state-persistence`
- `https://firebase.google.com/docs/database/web/read-and-write`
- `https://firebase.google.com/docs/database/security/rules-conditions`
- `https://firebase.google.com/docs/rules/unit-tests`
