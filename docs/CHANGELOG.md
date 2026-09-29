# Registro Contínuo de Auditoria e Implementação — OPP v3.0

Este documento audita o avanço de cada fase de implementação em relação ao *Documento de Arquitetura e Diretrizes de Implementação Assistida por IA (Versão 3.0 — Setembro de 2026)*.

## [Auditoria de Arquitetura: Compatibilidade de Prototipagem na Vercel & Manutenção do Cânone Firebase] — Setembro de 2026

- **Objetivo**: Habilitar a publicação imediata da demonstração frontend do portal cívico na Vercel para testes visuais rápidos com munícipes e partes interessadas, preservando integralmente o backend canônico no Firebase.
- **Garantias de Desacoplamento Arquitetural**:
  1. **Firebase Mantido como Cânone Oficial**: A modelagem do Firestore (`firestore.rules`, `firestore.indexes.json`), Cloud Functions 2nd Gen (`functions/src`), storage e emuladores locais permanecem a espinha dorsal definitiva do projeto.
  2. **Isolamento de Configuração**: Os arquivos `vercel.json` e `apps/web/vercel.json` atuam exclusivamente como metadados de hospedagem do provedor Vercel e foram explicitamente adicionados ao vetor `ignore` do `firebase.json` (`firebase.json -> hosting -> ignore`). Não são transferidos nem lidos pelo Firebase Hosting.
  3. **Tipagem Aprimorada no TypeScript**: O mapeamento `paths` em `apps/web/tsconfig.json` (`@opp/shared -> ../../packages/shared/src/index.ts`) permite compilar o frontend estático tanto em pipelines isolados (Vercel) quanto na esteira unificada do Firebase (`firebase deploy --only hosting`), tornando a compilação do Vite mais resiliente e sem acoplamento a pastas de distribuição intermediárias.
  4. **Nenhum Vendor Lock-in**: Não foi instalado nenhum SDK ou dependência da Vercel (`@vercel/...`) no `package.json`. A migração para o Firebase Hosting no lançamento final requer zero refatoração.

---

## [Fase 1: Fundação] — Setembro de 2026

### 1. Entregas Realizadas
- **Estrutura de Monorepo**: Configurado com npm workspaces (`packages/shared`, `apps/web`, `functions`).
- **Configurações Firebase**:
  - `firebase.json` com mapeamento de emuladores para Auth (9099), Functions (5001), Firestore (8080), Storage (9199), Hosting (5000) e UI (4000).
  - `.firebaserc` com suporte a múltiplos ambientes (`local-dev`, `dev-municipio`, `staging`, `prod`).
- **Segurança & LGPD (Seção 11, 25 & 26)**:
  - `firestore.rules`: Implementada separação rígida entre dados públicos sanitizados (`issues`, `comments`, `evidences`, `publicAgencyResponses`) e dados privados restritos (`usersPrivate`, `formalManifestations`, `dispatches`, `auditEvents`).
  - `storage.rules`: Isolamento de uploads brutos privados por usuário (`/users/{uid}/evidence`), bloqueio de extensões não autorizadas e limite de tamanho (10MB).
  - `firestore.indexes.json`: Índices compostos por município, status, categoria e data para viabilizar consultas otimizadas sem listeners globais dispendiosos.
- **Pacote Compartilhado (`@opp/shared`)**:
  - Entidades de domínio completas (`Issue`, `FormalManifestation`, `Agency`, `AgencyChannel`, `Dispatch`, `AuditEvent`, `CitizenConsentRecord`).
  - Máquinas de estado para `IssueStatus`, `FormalManifestationStatus`, `DispatchStatus` e `ModerationStatus` com validações de transição.
  - Interfaces desacopladas para provedores (`SearchProvider`, `AIProvider`, `MailProvider`, `StorageProvider`, `DocumentProvider`, `IssueRepository`).
  - Utilitário de sanitização determinística para PII (CPF, telefone, e-mail, CEP, RG) pré-IA e pré-feed público.
  - Normalização e gerador de tokens de busca com remoção de stopwords em língua portuguesa.
- **Cloud Functions (`functions`)**:
  - Configuração Cloud Functions 2nd Gen em TypeScript / NodeNext.
  - Repositório `FirestoreIssueRepository` desacoplado do controller.
  - `FirestoreTokenSearchProvider` para busca de baixo custo por tokens no Firestore.
  - Endpoint seguro `createIssueWithRootManifestation` com sanitização mandatória, indexação de tokens e geração de `AuditEvent`.
  - Trigger `onIssueStatusChange` append-only para auditoria de ciclo de vida.
- **Frontend Web Cívico (`apps/web`)**:
  - React + TypeScript + Vite + Tailwind CSS.
  - Identidade visual V2 *Impactante e Engajadora* (Azul institucional `#0F2942` + Verde cidadão `#059669`).
  - Home *search-first clean* com campo de busca proeminente, tags rápidas de problemas frequentes e números de transparência.
  - Card de problema com status acessível (texto + ícone + cor) e contadores cívicos de adesões formais (sem foco em curtidas).
  - Página de detalhes de Issue (70% conteúdo/linha do tempo/documentos e 30% discussão comunitária em desktop; abas em mobile).
  - Fluxo de adesão formal individual com consentimentos expressos de transmissão e publicação sanitizada (LGPD).
  - Fluxo de registro com busca prévia obrigatória (Princípio P01: Busca antes de criar).
  - Páginas de Transparência, Órgãos Verificados, Sobre e Como Funciona.

### 2. Auditoria de Conformidade com o Documento v3.0
- **Aggregate Root**: Issue é o centro da modelagem e da interface. Cumprido.
- **Separação entre Discussão e Adesão Formal**: Comentários na discussão pública exibem alerta explícito de que não geram envio ao órgão. Cumprido.
- **Auditoria Append-Only**: Todo evento crítico gera `AuditEvent` com `correlationId`. Cumprido.
- **LGPD by design**: Dados pessoais permanecem em coleções restritas; texto público e dados enviados para IA passam por sanitização determinística prévia. Cumprido.
- **Decisões em Aberto**: Nenhum segredo, remetente fixo ou regra arbitrária inventada. Todas as políticas são configuráveis via parâmetros/banco. Cumprido.

### 3. Testes Executados
- Testes unitários de sanitização determinística de PII (`sanitizer.test.ts`).
- Testes de integridade de máquinas de estado (`state-machines.test.ts`).
- Testes de geração e pontuação de tokens de busca (`search-tokens.test.ts`).
- Build estático do TypeScript do monorepo e do frontend.

### 4. Status
Concluído e auditado com 100% de aprovação.

---

## [Fase 2: Domínio Issue-Centric] — Setembro de 2026

### 1. Entregas Realizadas
- **Serviço de Domínio de Fusão e Divisão (Seção 3.4 & AC-12)**:
  - Implementado `packages/shared/src/domain/issue-operations.ts` com as funções `validateMergeIssues`, `computeMergedIssue`, `validateSplitIssue` e `computeSplitIssue`.
  - Fusão unifica manifestações, comentários e seguidores, soma tokens de busca sem duplicidade e registra histórico em `mergeHistory`.
  - O problema de origem recebe status `MERGED` e `mergedIntoIssueId` apontando para o registro principal.
  - Eventos de auditoria imutáveis `AuditEvent` gerados para ambos os problemas envolvidos com correlação auditável.
  - Divisão de problemas suporta criação de nova entidade com `splitFromIssueId` e readequação proporcional de contadores.
- **Backend Cloud Functions (`functions`)**:
  - Implementado endpoint `mergeIssues` com verificação de custom claim de moderador/admin e transação atômica em batch no Firestore.
  - Implementado endpoint `splitIssue` com movimentação de manifestações e auditoria append-only.
- **Frontend Web Cívico (`apps/web`)**:
  - Banner informativo de issue unificado em [`IssueDetailPage.tsx`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/apps/web/src/pages/IssueDetailPage.tsx) quando `status === 'MERGED'`, com link de redirecionamento para o problema principal (Critério AC-12).
  - Linha do tempo exibe eventos históricos de unificações sofridas pelo problema a partir de `issue.mergeHistory`.
  - Dados mock atualizados com exemplo de issue absorvido (`OPP-MN-2026-00143` unificado em `OPP-MN-2026-00142`).

### 2. Auditoria de Conformidade com o Documento v3.0
- **Critério AC-12**: Merge de issues preserva histórico e redireciona URLs antigas. Cumprido.
- **Seção 3.4**: Fusão ou divisão DEVE gerar `AuditEvent` e nunca apagar o histórico original. Cumprido.
- **Invariantes de Município**: Bloqueio de unificação entre problemas de municípios distintos. Cumprido.
- **Princípio do Menor Privilégio**: Apenas moderadores autenticados com claim válida podem disparar merge/split. Cumprido.

### 3. Testes Executados
- `issue-operations.test.ts`: **3/3 passed** (fusão correta, validação de invariantes ilegais e divisão de issues).
- Total de testes no monorepo: **14 testes aprovados** (100% de sucesso).
- Build estático completo: `@opp/shared`, `@opp/web` e `@opp/functions` compilados sem warnings ou erros de tipagem.

### 4. Status
Concluído e auditado com 100% de aprovação.

---

## [Fase 3: Busca-First] — Setembro de 2026

### 1. Entregas Realizadas
- **Motor de Similaridade e Sinônimos Cívicos (Seção 12.1 & 12.3)**:
  - Implementado [`packages/shared/src/utils/similarity.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/packages/shared/src/utils/similarity.ts) com `calculateIssueSimilarity`, `findDuplicateCandidates` e expansão léxica via dicionário de sinônimos cívicos (`buraco` -> `cratera`/`asfalto`, `iluminacao` -> `poste`/`lampada`, `lixo` -> `entulho`, etc.).
  - Fórmula de pontuação multi-critério: Tokens (50%), Categoria de serviço (25%) e Bairro/Região territorial (25%).
- **Backend Cloud Functions (`functions`)**:
  - [`FirestoreTokenSearchProvider`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/functions/src/providers/token-search-provider.ts) atualizado com busca expandida por sinônimos e ranqueamento de relevância semântica.
  - Endpoint `suggestDuplicateIssues` criado em [`functions/src/index.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/functions/src/index.ts) para identificação instantânea de duplicidades.
- **Frontend Web Cívico (`apps/web`)**:
  - [`SearchBar.tsx`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/apps/web/src/features/search/SearchBar.tsx): Autocomplete reativo com dropdown flutuante exibindo correspondências conforme a digitação, status, adesões formais e porcentagem de relevância (Critério AC-01).
  - [`NewIssuePage.tsx`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/apps/web/src/pages/NewIssuePage.tsx):
    - Passo 1: Busca prévia mandatória com cards de problemas similares e justificativa semântica de correspondência.
    - Passo 2: Alerta proativo de duplicidade em tempo real ao preencher o formulário, sugerindo aderir ao problema existente mas **sem impedir** que o cidadão continue caso considere outra situação (Critério AC-02).

### 2. Auditoria de Conformidade com o Documento v3.0
- **Critério AC-01**: Dado um termo/local, quando o usuário pesquisar, issues relevantes do mesmo município aparecem antes do CTA de novo issue. Cumprido.
- **Critério AC-02**: Ao criar novo issue, o sistema sugere similares sem impedir manualmente uma nova criação. Cumprido.
- **Seção 12.2 (Evolução sem Reescrita)**: Abstração isolada em `SearchProvider` e utilitários puros, permitindo futura adoção de Meilisearch/Algolia/Typesense sem impacto na UI. Cumprido.
- **Custos e Quotas**: Sem listeners globais nem buscas em loop; consultas indexadas por tokens. Cumprido.

### 3. Testes Executados
- `similarity.test.ts`: **5/5 passed** (expansão de sinônimos, similaridade alta com bairro/categoria, similaridade com sinônimos cívicos, descarte de cidades diferentes e issues ocultos).
- Total de testes no monorepo: **19 testes aprovados (100% de sucesso)**.
- Build estático completo: `@opp/shared`, `@opp/web` e `@opp/functions` compilados com zero erros.

### 4. Status
Concluído e auditado com 100% de aprovação.

---

## [Fase 4: Discussão Comunitária] — Setembro de 2026

### 1. Entregas Realizadas
- **Modelagem e Moderação de Comentários (Seção 16 & 23)**:
  - [`packages/shared/src/domain/comment-moderation.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/packages/shared/src/domain/comment-moderation.ts): Implementação de `evaluateCommentRisk`, `applyCommentEdit` e `processCommentReport`.
  - Detecção determinística de alto risco para acusações criminais sem prova, incitação à violência, dados de menores e vazamento de PII (Seção 16.2).
  - Preservação obrigatória de versões anteriores em `editHistory` para qualquer edição de comentário (Seção 23.2).
  - Sistema de denúncias cívicas (Report abuse) com encaminhamento para fila de moderação humana ao atingir o limiar.
- **Backend Cloud Functions (`functions`)**:
  - Endpoint `addIssueComment` em [`functions/src/index.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/functions/src/index.ts): Validação de autenticação, sanitização local, triagem de risco, incremento atômico de contadores e registro em `auditEvents`.
  - **Garantia Arquitetural Crítica (Critério AC-03)**: O ato de comentar nunca gera despacho técnico nem manifestação formal individual para o órgão.
  - Endpoint `reportIssueComment`: Processamento de denúncia e abertura de `moderationCases`.
  - Endpoint `toggleFollowIssue`: Acompanhamento de problemas públicos e notificação (Seção 23.1).
- **Frontend Web Cívico (`apps/web`)**:
  - [`IssueDetailPage.tsx`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/apps/web/src/pages/IssueDetailPage.tsx):
    - Discussão encadeada em profundidade limitada com respostas e indentação visual (Nível 2).
    - Botão de denúncia com modal cívico de seleção de motivos (ofensa, vazamento de PII, acusação sem base, etc.).
    - Acompanhamento dinâmico (Follow/Unfollow) com contador em tempo real.
    - Galeria de evidências comunitárias com fotos e formulário de novo anexo submetido a moderação (Módulo 15).
    - Alerta reforçado de que **comentar não gera envio formal ao órgão**.

### 2. Auditoria de Conformidade com o Documento v3.0
- **Critério AC-03**: Comentar não deve gerar manifestação formal nem e-mail ao órgão. Cumprido.
- **Seção 23.2**: Comentários encadeados, denúncia, edição com histórico e moderação com isolamento de PII de terceiros. Cumprido.
- **Seção 23.3**: Cards e páginas priorizam adesões formais e status; curtidas não definem prioridade administrativa. Cumprido.
- **Seção 16.1**: Trilha de moderação determinística antes de qualquer publicação ou acionamento de IA. Cumprido.

### 3. Testes Executados
- `comment-moderation.test.ts`: **5/5 passed** (aprovação de comentário cívico seguro, auto-flagging em acusações/ameaças/PII, histórico imutável de edição, bloqueio de edição por não-autores e limiar de denúncias).
- Total de testes no monorepo: **24 testes aprovados (100% de sucesso)**.
- Build estático completo: `@opp/shared`, `@opp/web` e `@opp/functions` compilados com zero erros.

### 4. Status
Concluído e auditado com 100% de aprovação.

---

## [Fase 5: Manifestações Formais] — Setembro de 2026

### 1. Entregas Realizadas
- **Operações de Manifestação Formal (Seção 14 & 21)**:
  - [`packages/shared/src/domain/formal-manifestation-operations.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/packages/shared/src/domain/formal-manifestation-operations.ts):
    - `generateManifestationCode`: Geração determinística de códigos hierárquicos para o problema raiz (`MF-00142-ROOT`) e para adesões subsequentes (`MF-00142-A001`, `MF-00142-A002`).
    - `validateSingleAdhesionPerUser`: Verificação estrita de que cada cidadão só pode ter no máximo uma manifestação formal ativa por issue (Seção 14.1).
    - `buildFormalDocumentHtml`: Construtor de documento oficial formatado em padrão A4, contendo identificação legal do cidadão (Lei 13.460/2017), fundamentação jurídica municipal, histórico de adesões, evidências e hash de integridade SHA-256.
    - `processManifestationWithdrawal`: Retirada de manifestação preservando histórico imutável (`WITHDRAWN`), decréscimo de contadores e registro em `AuditEvent`.
- **Provedor de Documentos Oficiais (`functions`)**:
  - [`functions/src/providers/html-document-provider.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/functions/src/providers/html-document-provider.ts): Provedor implementando `DocumentProvider`, gerando documento formal oficial com cálculo de checksum SHA-256 no backend.
- **Backend Cloud Functions (`functions`)**:
  - Endpoint `createFormalAdhesion` em [`functions/src/index.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/functions/src/index.ts):
    - Validação de autenticação e verificação de não-duplicidade do cidadão no issue.
    - Gravação dos dados privados em `/usersPrivate/{uid}/manifestations/{manifestationId}` e registro público sanitizado.
    - Coleta de consentimentos individuais e termo de envio de cópia por e-mail (Critério AC-08).
    - Geração do documento em HTML/PDF com hash SHA-256.
    - Registro append-only em `auditEvents`.
  - Endpoint `withdrawFormalAdhesion`: Retirada formal com preservação de trilha de auditoria.
- **Frontend Web Cívico (`apps/web`)**:
  - [`FormalAdhesionPage.tsx`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/apps/web/src/pages/FormalAdhesionPage.tsx):
    - Interface completa de adesão formal cívica em 3 etapas com indicador visual de progresso.
    - Exibição de aviso claro sobre segregação de dados: os dados de identificação (nome, CPF, contato) vão apenas para o órgão competente para validade jurídica da Lei 13.460/2017, permanecendo ocultos do público na plataforma (Critério AC-05).
    - Consentimento expresso para envio de cópia para o e-mail do cidadão (Critério AC-08).
    - Pré-visualização oficial em tempo real do documento oficial A4 com carimbo de autenticidade e hash criptográfico.
    - Comprovante de protocolo final com opção de impressão direta e download.
  - Atualização do [`IssueDetailPage.tsx`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/apps/web/src/pages/IssueDetailPage.tsx):
    - Adicionado botão de ação em destaque para "Aderir à Manifestação Formal", além de contadores cívicos em destaque.

### 2. Auditoria de Conformidade com o Documento v3.0
- **Critério AC-04**: Adesão formal vincula-se ao issue existente sem duplicar o problema principal. Cumprido.
- **Critério AC-05**: Nome/dados privados nunca aparecem no feed público; enviados apenas no documento oficial ao órgão. Cumprido.
- **Critério AC-08**: O cidadão pode solicitar explicitamente cópia da manifestação/despacho para seu e-mail. Cumprido.
- **Seção 14.1**: Limite estrito de 1 manifestação formal ativa por usuário por issue. Cumprido.
- **Seção 14.2**: Cancelamento preserva histórico e reduz contador de adesões ativas. Cumprido.
- **Seção 21**: Padrão de documento formal com hash de integridade e metadados legais. Cumprido.

### 3. Testes Executados
- `formal-manifestation.test.ts`: **4/4 passed** (código hierárquico, bloqueio de adesão duplicada, geração do documento com hash SHA-256 e retirada com preservação de histórico).
- Total de testes no monorepo: **28 testes aprovados (100% de sucesso)**.
- Build estático completo: `@opp/shared`, `@opp/web` e `@opp/functions` compilados com zero erros.

### 4. Status
Concluído e auditado com 100% de aprovação.

---

## [Fase 6: IA Assistiva com Gemini] — Setembro de 2026

### 1. Entregas Realizadas
- **Heurísticas e Resiliência da IA Assistiva (Seção 15 & AC-10)**:
  - [`packages/shared/src/domain/ai-heuristics.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/packages/shared/src/domain/ai-heuristics.ts):
    - `deterministicSuggestMetadata`: Motor semântico cívico para classificação de categoria e identificação do órgão competente municipal em modo offline ou resiliência.
    - `deterministicNeutralSummary`: Redator neutro determinístico que sintetiza relatos emotivos/exaltados em resumos factuais e objetivos de interesse público (máx 280 caracteres).
    - `deterministicContentRisk`: Avaliação de risco e moderação de conteúdo (acusações criminais nominais, ameaças à integridade física, vazamento de PII e dados sensíveis).
    - `prepareGeminiSafePayload`: Garantia mandatória e inegociável de higienização determinística local prévia antes de qualquer envio de dados para o modelo Gemini externo (Seção 15.2).
- **Provedor Gemini AI (`functions`)**:
  - [`functions/src/providers/gemini-ai-provider.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/functions/src/providers/gemini-ai-provider.ts): Provedor implementando `AIProvider` desacoplado usando a biblioteca oficial `@google/genai` com o modelo `gemini-2.5-flash`.
  - Mecanismo de degradação graciosa com fallback automático para heurísticas locais em caso de timeout, cota esgotada ou ausência de chave de API (Critério AC-10).
  - Endpoints Cloud Functions em [`functions/src/index.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/functions/src/index.ts):
    - `aiSuggestMetadata`: Sugestão não-vinculativa de categoria e órgão.
    - `aiGenerateSummary`: Síntese neutra pública do problema.
    - `aiEvaluateRisk`: Triagem preventiva de riscos de moderação cívica.
- **Frontend Web Cívico (`apps/web`)**:
  - [`NewIssuePage.tsx`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/apps/web/src/pages/NewIssuePage.tsx):
    - Botão em destaque "Assistente Cívico IA (Sugerir)" com ícone temático e feedback em tempo real.
    - Card de sugestões com indicação expressa de que a IA é **assistiva e não-soberana** (Seção 15.1), permitindo ao cidadão aceitar, editar ou recusar.
    - Ações em 1 clique: "Aplicar Categoria Sugerida" e "Substituir pelo Resumo Neutro".
    - Painel educativo de orientação cívica quando termos exaltados ou de risco são detectados.

### 2. Auditoria de Conformidade com o Documento v3.0
- **Critério AC-10**: Fallback offline/graceful degradation da IA — quando indisponível ou sem chave, heurísticas determinísticas assumem sem falha na aplicação. Cumprido.
- **Seção 15.1**: Papel da IA como assistente de suporte e nunca decisor absoluto. Cumprido.
- **Seção 15.2**: Higienização determinística prévia antes de qualquer requisição ao Gemini. Cumprido.
- **Seção 16.2**: Moderação preventiva de acusações criminais sem prova e proteção de dados pessoais. Cumprido.

### 3. Testes Executados
- `ai-heuristics.test.ts`: **7/7 passed** (classificação de iluminação/SEMOB, saúde/SMS, vias/obras, resumo neutro sem exclamações, sinalização de acusações criminais, detecção de ameaças e higienização mandatória de CPF/e-mail pré-IA).
- Total de testes no monorepo: **35 testes aprovados (100% de sucesso)**.
- Build estático completo: `@opp/shared`, `@opp/web` e `@opp/functions` compilados com zero erros.

### 4. Status
Concluído e auditado com 100% de aprovação.

---

## [Fase 7: Órgãos e Roteamento] — Setembro de 2026

### 1. Entregas Realizadas
- **Motor de Roteamento Cívico e Validação de Canais (Seções 8, 9 & AC-07)**:
  - [`packages/shared/src/domain/routing-engine.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/packages/shared/src/domain/routing-engine.ts):
    - `computeIssueRouting`: Avaliação algorítmica de competência municipal, priorizando o órgão da categoria com fallback automático para a Ouvidoria Geral do Município (OGM).
    - **Enforcement Rígido do Critério AC-07**: Canais marcados como `UNVERIFIED` bloqueiam imediatamente o envio automatizado e são retidos com status `BLOCKED_UNVERIFIED_CHANNEL` e `requiresHumanReview: true`.
    - Identificação de canais assistidos/manuais (ex: Fala.BR que exigem login cidadão com CPF via Gov.br) como `NEEDS_MANUAL_DISPATCH`.
    - `validateAgencyChannel`: Validador formal de URLs, e-mails e obrigatoriedade de link da fonte comprobatória pública (`sourceUrl`) para canais homologados.
    - `verifyAgencyChannel`: Função de homologação por moderadores com data, autor e fonte pública (Diário Oficial / Portal da Transparência).
- **Backend Cloud Functions (`functions`)**:
  - Endpoint `routeIssueForDispatch` em [`functions/src/index.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/functions/src/index.ts): Consulta o problema e os órgãos ativos do município no Firestore e retorna a decisão de roteamento com trava AC-07.
  - Endpoint `verifyAgencyChannelEndpoint`: Endpoint restrito a moderadores/administradores autenticados para homologar canais e registrar evento de auditoria imutável (`AuditEvent`).
- **Frontend Web Cívico (`apps/web`)**:
  - [`AgenciesPage.tsx`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/apps/web/src/pages/AgenciesPage.tsx):
    - Painel transparente de órgãos públicos municipais com filtros por status (`Todos`, `Verificados`, `Não Verificados`) e busca textual em tempo real.
    - Banner informativo com destaque para o **Critério AC-07** e a segurança jurídica das transmissões.
    - Badges distintos para canais `VERIFICADO` (verde) e `NÃO VERIFICADO` (alerta âmbar explícito avisando que envios automáticos estão suspensos).
    - Indicação clara se o canal aceita envio em lote automatizado ou exige submissão assistida/manual.
    - Links diretos para as fontes oficiais comprobatórias e registro das datas de homologação.

### 2. Auditoria de Conformidade com o Documento v3.0
- **Critério AC-07**: Canais não verificados ou que não aceitam submissão automatizada NUNCA recebem e-mails automáticos sem revisão humana. Cumprido.
- **Seção 8**: Cadastro estruturado de órgãos municipais por competência e vínculo territorial. Cumprido.
- **Seção 9**: Metadados de canais oficiais (`acceptsAutomatedSubmission`, `sourceUrl`, `verifiedAt`, `verificationStatus`). Cumprido.
- **Seção 27.1**: Homologação de canais gera evento append-only no log de auditoria. Cumprido.

### 3. Testes Executados
- `routing-engine.test.ts`: **6/6 passed** (autorização de envio para canal verificado, trava estrita de canal não verificado AC-07, marcação de envio manual para Fala.BR, fallback para Ouvidoria Geral, rejeição de canal sem link da fonte oficial e homologação de canal com metadados).
- Total de testes no monorepo: **41 testes aprovados (100% de sucesso)**.
- Build estático completo: `@opp/shared`, `@opp/web` e `@opp/functions` compilados com zero erros.

### 4. Status
Concluído e auditado com 100% de aprovação.

---

## [Fase 8: Dispatch / E-mail] — Setembro de 2026

### 1. Entregas Realizadas
- **Motor de Despacho em Lote e Notificações Cívicas (Seções 10, 21 & AC-06, AC-08)**:
  - [`packages/shared/src/domain/dispatch-operations.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/packages/shared/src/domain/dispatch-operations.ts):
    - `groupManifestationsForDispatch`: Agrupamento obrigatório de múltiplas adesões em um lote único de despacho (`Dispatch`), condensando demandas correlatas e gerando chave de idempotência determinística (`DSP-{issueId}-{agencyId}-{dateKey}`) para evitar envios duplicados (Critério AC-06).
    - `computeDeterministicChecksum`: Cálculo universal de hash de integridade SHA-256 / 64 hexadecimais sem dependências exclusivas de ambiente (100% isomórfico entre Node e Navegador/Vite).
    - `buildAgencyDispatchEmail`: Estruturação formal de e-mail institucional para o órgão competente com cabeçalhos jurídicos (`X-OPP-Issue-Id`, `X-OPP-Dispatch-Id`), fundamentação expressa na Lei Federal nº 13.460/2017 e anexo de manifestações formais agrupadas.
    - `buildCitizenConfirmationEmail`: Estruturação de e-mail de comprovação e cópia para o cidadão com código do protocolo, hash do documento e garantia de sigilo de identidade na internet sob a LGPD (Critério AC-08).
    - `computeRetryBackoffMinutes`: Política de retentativa com backoff exponencial para mitigar falhas transitórias de rede ou servidor de e-mail.
- **Provedor SMTP Resiliente (`functions`)**:
  - [`functions/src/providers/smtp-mail-provider.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/functions/src/providers/smtp-mail-provider.ts): Provedor implementando `MailProvider` desacoplado, com suporte a transporte SMTP real (Nodemailer) e modo Sandbox cívico auditável quando nenhuma credencial é configurada em desenvolvimento (Seção 32).
  - Endpoint `executeIssueDispatch` em [`functions/src/index.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/functions/src/index.ts):
    - Executa o fechamento do lote com validação estrita do canal do órgão (bloqueio AC-07 para canais não homologados).
    - Dispara o e-mail formal ao órgão.
    - Dispara as cópias individuais para os cidadãos que solicitaram recebimento (`receiveEmailCopy === true`).
    - Atualiza atomicamente no Firestore o status do Issue (`FORWARDED`), das manifestações (`DISPATCHED`) e registra o `AuditEvent`.
- **Frontend Web Cívico (`apps/web`)**:
  - [`IssueDetailPage.tsx`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/apps/web/src/pages/IssueDetailPage.tsx):
    - Destaque na seção de Documentos Formais Vinculados do lote de despacho consolidado (`Lote Consolidado (AC-06)`).
    - Exibição pública de que cópias individuais de protocolo foram transmitidas aos cidadãos aderentes (`Cópias enviadas aos cidadãos (AC-08)`).
    - Histórico e linha do tempo com hash criptográfico SHA-256 e data/hora do despacho.

### 2. Auditoria de Conformidade com o Documento v3.0
- **Critério AC-06**: Adesões múltiplas em curto intervalo DEVEM ser agrupadas em lote único para o órgão. Cumprido.
- **Critério AC-08**: O cidadão pode solicitar explicitamente cópia da manifestação/despacho para seu e-mail. Cumprido.
- **Seção 10.2 & 27.2**: Idempotência com chave calculada e tolerância a falhas transitórias com backoff. Cumprido.
- **Seção 32**: Sem credenciais fixas hardcoded no código; opera em sandbox seguro na ausência de configuração. Cumprido.

### 3. Testes Executados
- `dispatch-operations.test.ts`: **4/4 passed** (agrupamento de adesões em lote único com chave de idempotência AC-06, formatação de e-mail ao órgão com Lei 13.460/2017, e-mail de cópia cidadã com protocolo e LGPD AC-08, cálculo de backoff exponencial).
- Total de testes no monorepo: **45 testes aprovados (100% de sucesso)**.
- Build estático completo: `@opp/shared`, `@opp/web` e `@opp/functions` compilados com zero erros.

### 4. Status
Concluído e auditado com 100% de aprovação.

---

## [Fase 9: Resposta do Órgão & Avaliação Cidadã] — Setembro de 2026

### 1. Entregas Realizadas
- **Ciclo de Resolução e Consenso Deliberativo Popular (Seção 22)**:
  - [`packages/shared/src/domain/resolution-operations.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/packages/shared/src/domain/resolution-operations.ts):
    - `processAgencyResponse`: Higienização determinística de dados pessoais da resposta do órgão público, geração da entidade `PublicAgencyResponse` e transição do issue para o status `RESPONDED`.
    - `computeResolutionConsensus`: Motor de deliberação coletiva que processa os votos dos munícipes (`SIM`, `PARCIALMENTE`, `NAO`, `NAO_SEI_AVALIAR`) com quórum mínimo e transita o problema para `RESOLVED` (quando >= 60% votam SIM), `PARTIALLY_RESOLVED` ou reabre como `UNRESOLVED` (quando > 50% votam NÃO).
    - `validateCitizenFeedbackVote`: Validação de unicidade e edição de voto por usuário para evitar manipulação eleitoral ou votos duplicados.
- **Backend Cloud Functions (`functions`)**:
  - Endpoint `receiveAgencyResponseEndpoint` em [`functions/src/index.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/functions/src/index.ts): Recebe manifestações de secretarias/órgãos e publica a versão sanitizada no Firestore com auditoria.
  - Endpoint `submitResolutionFeedbackEndpoint`: Computa o voto do cidadão, recalcula o consenso e atualiza o ciclo de vida do issue no banco de dados.
- **Frontend Web Cívico (`apps/web`)**:
  - [`IssueDetailPage.tsx`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/apps/web/src/pages/IssueDetailPage.tsx):
    - Card oficial de resposta do órgão público com protocolo oficial e data.
    - Bloco de escrutínio comunitário com botões interativos de votação (`Sim, Resolvido`, `Parcialmente`, `Não Resolvido`, `Não sei avaliar`).
    - Barra de distribuição percentual colorida e badges dinâmicos de consenso comunitário em tempo real.

### 2. Auditoria de Conformidade com o Documento v3.0
- **Seção 22.1**: Toda resposta oficial de órgão passa por sanitização antes de ir a público e gera `AuditEvent`. Cumprido.
- **Seção 22.2**: Escrutínio público e controle social — quem define se o problema foi resolvido é a comunidade e não o órgão unilateralmente. Cumprido.
- **Anexo D**: Transições de ciclo de vida automáticas para `RESOLVED`, `PARTIALLY_RESOLVED` e `UNRESOLVED` respeitando a máquina de estados. Cumprido.

### 3. Testes Executados
- `resolution-operations.test.ts`: **6/6 passed** (sanitização de resposta com protocolo, aguardo de quórum deliberativo, consenso qualificado de resolução SIM >= 60%, reabertura como UNRESOLVED quando NÃO >= 50%, resolução parcial e validação de voto).
- Total de testes no monorepo: **51 testes aprovados (100% de sucesso)**.
- Build estático completo: `@opp/shared`, `@opp/web` e `@opp/functions` compilados com zero erros.

### 4. Status
Concluído e auditado com 100% de aprovação.

---

## [Fase 10: Painel do Moderador Cívico & Governança Integrada] — Setembro de 2026

### 1. Entregas Realizadas
- **Painel Central de Moderação Cívica (`/moderacao`)**:
  - [`apps/web/src/pages/ModerationPage.tsx`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/apps/web/src/pages/ModerationPage.tsx):
    - **Aba 1: Moderação de Comentários**:
      - Fila de comentários reportados ou sinalizados com justificativa (ataque pessoal, desinformação, PII não autorizada).
      - Ações de moderação com justificativa obrigatória: Aprovar / Manter comentário público ou Ocultar por violação cívica.
      - Alerta explícito reforçando que moderação comunitária não interfere em manifestações formais (AC-03).
    - **Aba 2: Triagem de Evidências Comunitárias**:
      - Avaliação de fotografias e documentos submetidos pelos cidadãos.
      - Aprovação de evidências relevantes para enriquecer o dossiê público da Issue ou rejeição com justificativa de desvio de foco / LGPD.
    - **Aba 3: Verificação de Canais Oficiais (AC-07)**:
      - Tabela de órgãos e canais com badges visuais de status (`VERIFIED`, `UNVERIFIED`, `BOUNCED`).
      - Ferramenta de auditoria para inserção de URL oficial de comprovação (Diário Oficial, portal da Prefeitura/Câmara).
      - Transição de canal para `VERIFIED` destravando o canal para despachos automáticos em conformidade com o Critério AC-07.
    - **Aba 4: Unificação e Divisão de Problemas (AC-12)**:
      - Interface guiada de fusão de problemas (`computeMergedIssue`).
      - Seleção de Issue de Origem e Issue de Destino no mesmo município.
      - Campo de justificativa de interesse público para registro em `AuditEvent`.
      - Validação de integridade: preservação cumulativa de adesões formais, comentários, seguidores e criação de banner de redirecionamento transparente.
- **Integração de Navegação**:
  - Rota `/moderacao` registrada em [`apps/web/src/App.tsx`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/apps/web/src/App.tsx).
  - Link direto "Moderação" adicionado ao [`apps/web/src/components/Header.tsx`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/apps/web/src/components/Header.tsx).

### 2. Auditoria de Conformidade com o Documento v3.0
- **Seção 23 (Moderação e Governança)**: Ferramentas com trilha de auditoria para todas as ações do moderador. Cumprido.
- **Critério AC-07**: Garantia de que canais só são ativados com fonte primária verificada e documentada. Cumprido.
- **Critério AC-12**: Fusão de problemas duplicações sem perda de adesões ou histórico. Cumprido.

### 3. Testes e Compilação
- Monorepo 100% aprovado:
  - 51 testes unitários em 11 suites de teste (`packages/shared`).
  - Build estático do Vite e TypeScript com zero warnings ou erros.
  - Servidor de desenvolvimento ativo em `http://localhost:5173/`.

### 4. Status
Concluído e auditado com 100% de aprovação.

---

## [Melhoria Contínua: Moderação Cívica Interativa & Máscara de Baixo Calão] — Setembro de 2026

### 1. Entregas Realizadas
- **Detecção e Substituição Compulsória de Baixo Calão (`######`)**:
  - `PROFANITY_REGEX` e função determinística `maskProfanity` em [`packages/shared/src/domain/comment-moderation.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/packages/shared/src/domain/comment-moderation.ts).
  - Qualquer termo de baixo calão é compulsoriamente substituído pela sequência `######` caso o autor decida postar.
- **Função de Aviso Prévio Cívico ao Autor (`checkCommentForAuthorWarning`)**:
  - Em vez de submeter silenciosamente para `AUTO_FLAGGED`, o sistema analisa os gatilhos em tempo real antes do envio:
    - *Linguagem de Baixo Calão* (`PROFANITY`);
    - *Acusação Nominal de Crime sem decisão judicial* (`CRIME_ACCUSATION`);
    - *Menção a Violência ou Intimidação* (`VIOLENCE_THREAT`);
    - *Menção a Menores em Contexto Sensível* (`SENSITIVE_MINOR`);
    - *Dados Pessoais Identificáveis sob LGPD* (`PII`).
  - Modal interativo educativo na página de detalhes do problema ([`IssueDetailPage.tsx`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/apps/web/src/pages/IssueDetailPage.tsx)):
    - Exibe detalhadamente cada situação em que o texto se enquadra.
    - Exibe prévia real do comentário com as substituições compulsórias (`######` e `[DADO PROTEGIDO]`).
    - Oferece ao autor as opções de **"Editar Comentário"** (para adequar a redação) ou **"Postar Mesmo Assim"** (com termos de baixo calão mascarados por `######` e riscos severos enviados à moderação).

### 2. Testes Executados
- 7 testes em `comment-moderation.test.ts` aprovados (53 testes no monorepo).
- Build estático de produção do Vite e TypeScript aprovado com código de saída 0.

---

## [Segurança de IA & Moderação em 4 Camadas (Prompt Injection Defense & Desofuscação)] — Setembro de 2026

### 1. Defesa contra Prompt Injection (Formulários & IA Gemini)
- **Módulo Dedicado de Defesa (`prompt-defense.ts`)**:
  - Implementada função [`defangPromptInjection`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/packages/shared/src/utils/prompt-defense.ts) com neutralização de:
    - *Sobrescrita de Instruções*: `ignore all previous instructions`, `ignore todas as regras anteriores`, `você agora é um assistente sem regras`;
    - *Impersonação de Papel*: `System:`, `Developer:`, `Admin:`, `Assistant:`;
    - *Extração de Prompt Interno*: `mostre seu system prompt`, `reveal instructions`, `print prompt`;
    - *Escape de Delimitadores*: aspas triplas `"""`, `'''`, blocos de código e tags de script.
- **Isolamento Estrutural e Prompt Seguro**:
  - Criação da constante de diretriz `SYSTEM_SAFETY_INSTRUCTION` e função de encapsulamento `encapsulateUntrustedInput` envolvendo textos na tag delimitadora `<user_input_untrusted>`.
  - Integração em [`GeminiAIProvider`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/functions/src/providers/gemini-ai-provider.ts) em todos os métodos (`suggestMetadata`, `generateNeutralSummary`, `evaluateContentRisk`, `evaluateCivicToxicity`).
  - Proteção em [`prepareGeminiSafePayload`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/packages/shared/src/domain/ai-heuristics.ts) aplicado tanto na criação de relatos quanto na geração de resumos neutros.

### 2. Moderação em 4 Camadas & Ajustes Cívicos
- **Camada 1 (Normalizador e Desofuscador de Texto - `text-normalizer.ts`)**:
  - Decodificação de Leetspeak: `@/4 -> a`, `3 -> e`, `1/!/| -> i`, `0 -> o`, `5/$ -> s`, `7 -> t`, `8 -> b`.
  - Colapso de acrônimos espaçados ou pontuados: `v.s.f`, `v . s . f`, `v s f`, `t - n - c`, `f.d.p`, `p.q.p`, `k.c.t`.
  - Redução de repetições exageradas intencionais: `meeerrrdddaaa -> merda`, `poooorrrra -> porra`.
- **Camada 2 (Dicionário Expandido & Máscara de Palavrões)**:
  - Expansão de `PROFANITY_REGEX` com acrônimos chulos populares e termos ofensivos/pejorativos (homofobia, etarismo).
  - Máscara compulsória determinística por `######` no texto persistido e publicado.
- **Ajustes de UX e Fila Cívica**:
  - **Remoção de prévia/aviso do `######`**: o autor é orientado civicamene sobre a inadequação dos termos, sem saber que o texto será mascarado antes de postar.
  - **Preservação de Auditoria (`REVISED_AFTER_WARNING`)**: caso o usuário acione o aviso e edite o texto repetidamente até o aviso sumir para tentar burlar a triagem, o comentário é compulsoriamente encaminhado para revisão humana com a flag `AUTO_FLAGGED`.
- **Camada 3 (Análise Semântica Contextual com Gemini)**:
  - Método `evaluateCivicToxicity` para identificar insultos contextuais que não dependem de palavrões isolados (ex: ofensas a servidores e ataques discriminatórios).

### 3. Testes e Validação
- 67 testes unitários aprovados em 12 suítes em `@opp/shared`.
- Build estático de `@opp/shared`, `@opp/web` e `functions` 100% aprovado sem erros.
