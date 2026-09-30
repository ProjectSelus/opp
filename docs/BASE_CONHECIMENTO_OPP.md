# Base de Conhecimento, Visão Social e Manual Completo de Operações
# Ouvidoria Pública Popular (OPP) — Versão 3.0

> **Finalidade deste Documento:**  
> 1. **Base de Conhecimento Mestra para o Assistente Virtual (Chatbot de IA):** Fornece o contexto institucional, técnico, legal e social para instruir o assistente inteligente no portal da OPP.  
> 2. **Manual de Esclarecimento para Parceiros, Órgãos Públicos e Cidadãos:** Detalha minuciosamente a visão social, todas as funções da plataforma, fluxo de auditoria, tratamento de fotos, telemetria, canal de denúncias e segurança.

---

## 1. Visão Social, Propósito e Objetivos do Projeto

### 1.1. O Diagnóstico: Por que as Ouvidorias Tradicionais Falham?
Historicamente, o relacionamento entre o cidadão e a administração pública municipal no Brasil sofre de três gargalos crônicos:
1. **Fragmentação Silenciosa:** Cada munícipe que enfrenta um buraco na rua, esgoto a céu aberto ou falta de iluminação abre um chamado individual isolado em canais telefônicos ou formulários obscuros. O poder público trata essas centenas de queixas como "casos pontuais", gerando morosidade e engavetamento.
2. **Falta de Transparência e Memória Pública:** Quando um munícipe recebe uma resposta, essa resposta fica restrita ao e-mail dele. O vizinho da mesma rua não sabe se o problema já foi cobrado, qual secretaria foi acionada e qual foi o prazo prometido.
3. **Desigualdade e Desamparo:** Cidadãos comuns muitas vezes desconhecem os prazos e obrigações legais do poder público, sentindo-se impotentes diante do silêncio da burocracia.

### 1.2. A Solução: Ouvidoria Pública Popular (OPP)
A **OPP** é uma plataforma de **Tecnologia Cívica (*Civic Tech*)** independente, republicana e apartidária. Ela não substitui os órgãos públicos nem atua como escritório de advocacia: ela **organiza, fortalece e formaliza a voz coletiva da sociedade**, conectando munícipes afetados pelo mesmo problema e acionando o poder público de forma legítima, auditável e transparente.

### 1.3. Pilares e Princípios Fundamentadores
* **Centralidade no Problema (*Issue-Centric*):** Ao contrário de redes sociais tradicionais centradas em perfis, vaidade ou curtidas, na OPP a página principal pertence ao **problema público coletivo**.
* **Busca Antes de Criar (*Search-First*):** A plataforma estimula ativamente a vizinhança a encontrar relatos já existentes e somar forças num único dossiê comunitário, em vez de abrir 50 protocolos repetidos para o mesmo poste apagado.
* **Amparo na Lei Federal nº 13.460/2017:** A Lei de Defesa dos Direitos dos Usuários dos Serviços Públicos garante ao cidadão o direito a um atendimento eficiente, prazos de manifestação e resposta fundamentada. Cada adesão cidadã na OPP constitui uma manifestação formal individual de direito.
* **Privacidade e LGPD por Concepção (*Privacy by Design*):** Proteção integral de dados pessoais sensíveis (Lei Federal nº 13.709/2018). Telefones, CPFs e dados de residência são filtrados por rotinas determinísticas antes de qualquer publicação pública.
* **Fé Pública Criptográfica:** Todo documento expedido e toda resposta recebida de órgão oficial recebem um carimbo de integridade com **hash criptográfico SHA-256**, impedindo fraudes, alterações posteriores ou desmentidos.
* **Soberania Comunitária de Fechamento:** Quem atesta se uma lâmpada foi trocada ou se a UBS voltou a atender não é apenas a caneta do gestor em um gabinete — são os próprios moradores do bairro através de votação de consenso.

---

## 2. Glossário de Conceitos Fundamentais

* **Problema Público (*Issue*):** Registro público geolocalizado de uma falha em serviço público, infraestrutura ou direito difuso (ex: `OPP-MN-2026-00142`).
* **Manifestação Raiz:** O primeiro relato formal que originou a abertura do problema.
* **Adesão Formal Cidadã:** Ação na qual outro munícipe afetado vincula sua identidade legal ao problema já aberto, outorgando mandato técnico à OPP para cobrar o órgão responsável.
* **Despacho Individual:** Notificação formal gerada e enviada diretamente à ouvidoria pública do órgão competente a cada adesão cadastrada.
* **Devolutiva Oficial:** Resposta fundamentada emitida pelo órgão responsável, contendo protocolo administrativo, data e prazos de resolução.
* **Hash SHA-256:** Código alfanumérico único de 64 caracteres gerado por cálculo matemático que comprova a autenticidade e inviolabilidade de documentos, fotos e expedientes.
* **Consenso Comunitário de Resolução:** Métrica cívica calculada a partir dos votos da vizinhança (Sim, Parcialmente, Não) para validar a eficácia de um reparo público.
* **Caso de Moderação (*ModerationCase*):** Registro administrativo em fila para apuração de denúncias ou riscos detectados por algoritmos.
* **Evento de Auditoria (*AuditEvent*):** Registro imutável de qualquer ação relevante executada no sistema para fins de fé pública e rastreabilidade jurídica.

---

## 3. Guia Detalhado de Todas as Funções da Plataforma

### 3.1. Busca Prévia Inteligente (*Search-First*)
* **Como Funciona:** Logo na tela inicial e no formulário de novo problema, o cidadão digita o que está acontecendo (ex: *"poste queimado rua 7"*).
* **Tecnologia:** Motor de busca por tokens e similaridade semântica com suporte a prefixos rápidos (a partir de 2 letras), tolerância ortográfica e normalização da língua portuguesa.
* **Propósito Social:** Redirecionar o cidadão para aderir a um problema já aberto em seu bairro. 100 moradores unidos em torno de um único protocolo exercem uma pressão cívica imensamente superior a 100 registros isolados.

### 3.2. Relato de Novo Problema Público
* **Como Funciona:** Se a busca prévia demonstrar que o problema ainda não foi cadastrado, o munícipe preenche título, descrição detalhada, localização (bairro e rua de referência) e categoria.
* **Sanitização Automática de PII (LGPD):** O sistema analisa instantaneamente o texto digitado. Se o usuário digitar um CPF, telefone pessoal ou número exato de casa que fira a privacidade, o sistema alerta e higieniza os dados sensíveis antes de salvar.
* **Assistente de Inteligência Artificial:** Auxilia o cidadão sugerindo a secretaria municipal competente (ex: Secretaria de Obras, SEMOB, Saúde), gerando uma síntese neutra e republicana dos fatos e calculando o nível de prioridade comunitária.

### 3.3. Adesão Formal Cidadã ("Cutucando o Poder Público")
* **O que é:** O botão *"Aderir formalmente a este problema"*. Não é um "like" vazio de rede social; é uma manifestação formal de usuário de serviço público.
* **Geração de Protocolo Próprio:** Cada pessoa que adere recebe um código exclusivo sequencial (ex: `MF-00142-A043`).
* **Opções de Personalização:** O cidadão pode adotar a descrição consolidada do problema ou acrescentar um relato de seu caso pessoal.
* **Opção de Privacidade Pública:** O munícipe escolhe se quer exibir seu primeiro nome na lista pública do site ou se prefere que seu nome conste apenas internamente no encaminhamento formal à ouvidoria.
* **Disparo Imediato por E-mail:** A cada nova adesão, o sistema monta e transmite eletronicamente uma notificação formal ao e-mail da ouvidoria do órgão competente, acionando a contagem de prazo da Lei 13.460/2017.

### 3.4. Comunidade e Fórum de Discussão com Moderação Educativa
* **Separação Estratégica:** Os comentários da comunidade ficam **restritos exclusivamente ao site** e NÃO são enviados para o e-mail da prefeitura. Isso impede que a ouvidoria pública receba spam, mantendo os canais oficiais focados nos expedientes formais de adesão.
* **Filtro Rápido de Baixo Calão e Ofensas:** O sistema identifica palavras de baixo calão, inclusive disfarçadas por números (*leetspeak*, ex: `p0rra`, `v1ado`) ou separadas por espaços/pontos (`v s f`, `t.n.c`).
* **Mascaramento:** Palavrões e ofensas são automaticamente convertidos para sequências de sustenidos (`######`), preservando a dignidade do espaço cívico.
* **Modal de Aviso Prévio Educativo:** Se o cidadão digitar algo inadequado ou ofensivo, um modal educativo explica as diretrizes de convivência e a importância de manter o foco no problema técnico, dando ao autor a chance de editar seu texto.
* **Autoflag Cívico:** Se o usuário insistir em postar ou se tentar burlar as regras editando aos poucos, a postagem é encaminhada para a fila de moderação humana com a marcação `AUTO_FLAGGED`.
* **Defesa contra *Prompt Injection*:** Toda mensagem inserida passa por rotinas de contenção para impedir que comandos maliciosos afetem as IAs da plataforma.

---

## 4. Tratamento de Fotos e Evidências Documentais

Fotos e imagens são o coração da comprovação cívica, mas representam riscos críticos de privacidade se não forem tratadas com rigor técnico. Na OPP, o fluxo de fotos segue padrões de segurança de nível governamental:

### 4.1. Upload Seguro e Restrições Técnicas
* **Formatos Permitidos:** Apenas imagens legítimas (`image/jpeg`, `image/png`, `image/webp`) e documentos oficiais em PDF (`application/pdf`).
* **Limite de Tamanho:** Máximo de 10 MB por arquivo para evitar negação de serviço e sobrecarga de infraestrutura.
* **Isolamento Inicial em Área Privada:** A imagem enviada pelo cidadão **nunca** vai diretamente para o feed público. Ela é gravada em um bucket privado com controle de acesso (`/users/{uid}/evidence/`).

### 4.2. Higienização Obrigatória de Metadados (Remoção de EXIF/GPS)
* **O Perigo do EXIF:** Ao tirar uma foto com um smartphone moderno, o aparelho grava dados ocultos no arquivo: coordenadas geográficas exatas (latitude/longitude com precisão de centímetros), modelo do celular, data/hora e número de série. Se a foto for tirada dentro de casa ou em frente ao portão, isso exporia a localização privada da família do denunciante.
* **Processamento Automatizado:** A esteira de ingestão de mídia processa o arquivo, **remove 100% dos metadados EXIF e dados de geolocalização da câmera** e recodifica a imagem antes de disponibilizá-la publicamente.
* **Proteção à Integridade Física:** Garante que vizinhos, terceiros ou agentes mal-intencionados não consigam rastrear o dispositivo do munícipe.

### 4.3. Hash Criptográfico SHA-256 da Imagem
* Cada foto recebe um hash SHA-256 gerado no momento do recebimento. Esse código atesta em juízo ou perante o Ministério Público que a foto anexada não sofreu manipulações gráficas enganosas (como adição de montagens ou adulteração de datas).

### 4.4. Moderação Visual de Conteúdo
* Evidências passam por triagem prévia: imagens contendo rostos de crianças/menores de idade desacompanhados, documentos pessoais de terceiros (como cartões de crédito ou holerites caídos no lixo) ou dados ofensivos são bloqueadas ou têm as partes sensíveis borradas (*blurring*) antes da publicação pública.

---

## 5. Reportar Incidentes, Denúncias e Moderação Comunitária

Para garantir um espaço livre de assédio, calúnias ou vazamento de dados, a OPP conta com um **Canal Integrado de Denúncias e Gestão de Incidentes**:

### 5.1. Como o Cidadão Denuncia um Abuso
Em qualquer comentário, evidência ou problema público, existe o botão **"Denunciar"** com opções pré-categorizadas:
* **`OFFENSIVE` (Ofensa / Baixo Calão / Calúnia):** Xingamentos nominais a servidores, vizinhos ou discurso de ódio.
* **`PII_LEAK` (Vazamento de Dados Pessoais):** Exposição de CPF, telefone pessoal, número de WhatsApp, placas de carro ou residência de outrem.
* **`CRIME_ACCUSATION` (Acusação Nominal de Crime):** Imputação de crimes (como corrupção, roubo ou desvio) sem processo transitado em julgado, evitando riscos de responsabilização civil.
* **`SPAM` (Spam ou Propaganda Comercial):** Venda de serviços, links promocionais ou autopromoção política/eleitoral.
* **`OTHER` (Outras Violações):** Qualquer outra conduta contrária à civilidade.

### 5.2. Ciclo de Vida do Caso de Moderação (`ModerationCase`)
Ao ser denunciado ou marcado pelo filtro automático, é gerado um `ModerationCase` que passa pelos seguintes estados:
1. **`AUTO_FLAGGED`:** Sinalizado automaticamente pelos motores de segurança.
2. **`HUMAN_REVIEW`:** Em análise por um moderador cívico ou equipe de conformidade.
3. **`APPROVED`:** O conteúdo foi verificado e cumpre as normas, permanecendo visível.
4. **`EDIT_REQUESTED`:** Notificação enviada ao autor para ajustar trechos específicos.
5. **`REJECTED`:** Conteúdo removido do ar por violar termos de uso ou a legislação.
6. **`ESCALATED`:** Encaminhado para a coordenação jurídica em casos graves (ex: ameaças de morte ou exploração de menores).

### 5.3. Quarentena Preventiva Automática (*Circuit Breaker*)
Se um comentário ou foto receber **3 denúncias independentes** de cidadãos distintos, o sistema ativa uma suspensão preventiva automática: o item é ocultado da visualização pública provisoriamente até que um moderador humano tome a decisão final. Isso neutraliza ataques coordenados ou vazamento de fotos íntimas antes que viralizem.

---

## 6. Auditoria Imutável (*Append-Only Audit Log*) e Fé Pública

A OPP adota a filosofia de que **"tudo o que tem impacto cívico deve ser auditável e comprovável"**. Por isso, a plataforma conta com uma esteira de auditoria de dados imutável.

### 6.1. O que é o *Append-Only Log*?
* Diferente de sistemas convencionais onde registros podem ser editados ou apagados no banco de dados por um administrador com acesso direto, na OPP a tabela de auditoria é **estritamente acumulativa (*Append-Only*)**.
* Nenhuma função no código, nenhum administrador e nenhum moderador possui permissão no banco para fazer `UPDATE` ou `DELETE` em um registro da coleção `auditEvents`. Toda e qualquer alteração cria um NOVO evento registrando o que mudou, quem mudou e por que mudou.

### 6.2. Estrutura do Evento de Auditoria (`AuditEvent`)
Cada ação relevante na plataforma gera um registro com a seguinte estrutura:
* **`eventId`:** Identificador único global do evento.
* **`timestamp`:** Data, hora e milissegundo exatos em padrão ISO 8601 com fuso horário auditado.
* **`actorType`:** Categoria do autor da ação (`CITIZEN`, `MODERATOR`, `ADMIN`, `SYSTEM`).
* **`actorId`:** Identificador único do autor (ou hash seguro de sessão se anônimo).
* **`action`:** Ação específica executada (ex: `ISSUE_CREATED`, `FORMAL_MANIFESTATION_REGISTERED`, `INDIVIDUAL_DISPATCH_DISPATCHED`, `INBOUND_EMAIL_INGESTED`, `COMMENT_MODERATED`, `RESOLUTION_VOTED`, `ISSUE_MERGED`).
* **`entityType` & `entityId`:** Qual elemento foi alterado (problema, manifestação, comentário, evidência).
* **`beforeHash` & `afterHash`:** O hash SHA-256 do estado do dado antes e depois da ação, garantindo prova matemática de integridade.
* **`correlationId`:** Código rastreador que conecta toda a cadeia de eventos (desde a abertura do chamado até o despacho do e-mail e a resposta do órgão).
* **`ipHash`:** Hash criptográfico do endereço IP do solicitante (o IP bruto é descartado em respeito à LGPD, mas o hash permite provar unicidade e barrar robôs).

### 6.3. Blindagem Jurídica perante Órgãos de Controle
Essa auditoria imutável permite que o dossiê da OPP seja apresentado ao **Ministério Público Estadual (MPE)**, à **Defensoria Pública** ou ao **Tribunal de Contas** como prova incontestável de que o poder público foi formalmente notificado e de que a população acompanhou e cobrou a demanda de forma legítima.

---

## 7. Telemetria e Monitoramento de Desempenho Cívico

A telemetria da OPP é desenhada com foco exclusivo na **saúde da infraestrutura e no impacto social**, sem violar a privacidade dos cidadãos.

### 7.1. Métricas de Impacto Cívico Acompanhadas
* **Taxa de Conversão de Busca Prévia:** Percentual de munícipes que pesquisaram e aderiram a um problema existente em vez de criar um duplicado (mede a eficácia da união comunitária).
* **Tempo Médio de Primeira Resposta do Órgão (SLA Cívico):** Quantidade de dias corridos entre o primeiro despacho formal de e-mail e a devolutiva protocolada da secretaria responsável.
* **Índice de Resolutividade Comunitária:** Percentual de problemas que tiveram resposta do órgão atestada como "Resolvido" pelos munícipes na votação cívica.
* **Engajamento por Bairro:** Mapeamento de quais regiões da cidade enfrentam maior escassez de serviços essenciais.

### 7.2. Métricas Técnicas de Desempenho e IA
* **Latência de Heurísticas de IA:** Tempo de resposta na geração de resumos neutros e sugestões de categorias.
* **Taxa de Aceitação da IA:** Frequência com que o cidadão aceita a categoria e a secretaria municipal sugeridas pela IA.
* **Volume de E-mails Inbound Ingeridos:** Monitoramento de respostas recebidas de provedores governamentais.

### 7.3. Princípios de Privacidade da Telemetria (Zero Espionagem)
* **Sem Cookies de Terceiros:** A OPP não utiliza trackers invasivos ou ferramentas de remarketing publicitário.
* **Anonimização de Tráfego:** Métricas de navegação não são cruzadas com o CPF ou identidade dos munícipes.

---

## 8. Ingestão Automatizada de E-mails e Documentos Oficiais

### 8.1. Como Funciona a Leitura de Respostas dos Órgãos Públicos
1. Ao despachar um e-mail de adesão formal, o sistema define um endereço dinâmico de retorno (*Plus-Addressing*), por exemplo: `resposta+OPP-MN-2026-00142@ouvidoria.opp.org.br`.
2. Quando o servidor público clica em "Responder" no seu software de e-mail (Outlook, Gmail, Expresso) ou anexa um ofício assinado em PDF, o e-mail chega no webhook da OPP (`inboundEmailWebhookEndpoint`).
3. O motor de correlação identifica instantaneamente o problema correspondente através do remetente, cabeçalhos RFC (`X-OPP-Issue-Id`) ou menção do código no assunto.
4. Um extrator de padrões (*regex*) faz a leitura do texto para identificar o número oficial de protocolo do órgão (ex: `SEMOB/ILUM-2026/04481`).
5. O sistema classifica o teor da resposta (confirmação preliminar de recebimento vs solução efetiva do serviço).
6. O texto passa por sanitização determinística para proteger eventuais dados de servidores e é publicado na linha do tempo do problema com carimbo SHA-256 e anexos originais para download.

### 8.2. Seção "Documentos Formais Vinculados" e Modal de Visualização
Na página pública de cada problema, a seção de documentos permite a qualquer pessoa:
* Visualizar o **Expediente de Ida (Carta de Reclamação Formal Cidadã)** com a contagem de adesões vinculadas e fundamentação na Lei 13.460/2017.
* Visualizar o **Expediente de Volta (Resposta Oficial / Ofício em PDF)** da secretaria.
* Conferir a autenticidade pelo Hash SHA-256.
* Acionar o botão **"Imprimir / Salvar PDF"** para gerar uma via física ou digital formatada para arquivo pessoal.

---

## 9. Votação Cívica de Resolução & Consenso Comunitário

### 9.1. O Fim do "Resolvido no Papel"
Um dos maiores vícios da administração pública é marcar protocolos de ouvidoria como "atendidos" ou "concluídos" sem que a equipe tenha de fato ido ao local ou após realizar um reparo de péssima qualidade que quebra dias depois.

### 9.2. A Regra do Consenso
* Na OPP, a declaração de conclusão por parte do órgão **não fecha o problema automaticamente**.
* O problema entra na fase de **Verificação Cívica de Resolução**.
* Os cidadãos que acompanham e residem na região são convidados a votar:
  - **Sim:** O problema foi sanado completamente.
  - **Parcialmente:** A equipe esteve no local, mas o problema persiste ou o serviço ficou incompleto.
  - **Não:** Nada foi feito.
  - **Não sei avaliar:** Munícipe que apoia a causa, mas não transita frequentemente pelo ponto exato.
* Um algoritmo de consenso analisa a proporção dos votos (exigindo quorum mínimo). O problema só ganha a chancela `RESOLVED` se a população confirmar o reparo. Se os moradores votarem massivamente "Não", o problema é mantido aberto e uma reabertura contestada é gerada.

---

## 10. Gestão de Duplicidades: Fusão (*Merge*) e Desmembramento (*Split*)

Quando munícipes diferentes relatam a mesma ocorrência (ex: dois vizinhos fotografam o mesmo buraco em esquinas conectadas):
1. **Fusão Canônica (*Merge*):** O moderador ou o sistema correlaciona os chamados. O relato mais completo é mantido como principal, e o outro é fundido (`mergedIntoIssueId`).
2. **Preservação de Direitos:** Nenhuma assinatura é perdida. As adesões formais e evidências do problema secundário são migradas e somadas ao dossiê principal.
3. **Redirecionamento Transparente:** Quem acessar o link antigo é automaticamente redirecionado para a página canônica com um aviso explicando a união das queixas para ganho de força política.

---

## 11. FAQ Estruturado (Perguntas Frequentes para Cidadãos e Assistente Virtual)

### Q1: A OPP é um órgão da Prefeitura ou do Governo?
**R:** Não. A Ouvidoria Pública Popular (OPP) é uma plataforma cívica independente mantida pela própria comunidade e por tecnologia social. Ela atua como ponte técnica autorizada pelos cidadãos para formalizar cobranças e exigir respostas nos termos da lei.

### Q2: Qual é a diferença entre comentar e aderir formalmente a um problema?
**R:** O comentário é um diálogo comunitário interno entre moradores no site e **não** é enviado por e-mail para a prefeitura. A **Adesão Formal**, por sua vez, é um ato oficial: gera um protocolo sequencial, emite comprovante digital e dispara imediatamente uma manifestação individual por e-mail à ouvidoria pública competente.

### Q3: Meus dados pessoais (como CPF e endereço exato) ficam visíveis na internet?
**R:** De forma alguma! A plataforma segue rigorosamente a Lei Geral de Proteção de Dados (LGPD). Dados como CPF, e-mail e telefone nunca são exibidos no site. Além disso, ao aderir, você pode optar por manter seu nome ocultado do público geral.

### Q4: Por que alguns comentários aparecem com "######"?
**R:** Para manter a conversa construtiva e republicana, palavras de baixo calão e ofensas são mascaradas com `######`. O objetivo é focar na cobrança do serviço público, mantendo um ambiente seguro e civilizado.

### Q5: O que é o Hash SHA-256 que aparece nos documentos e fotos?
**R:** É uma assinatura digital criptográfica única. Ela garante que o ofício emitido pelo órgão, a carta enviada pelos moradores ou a foto da prova não foram adulterados ou forjados após o envio.

### Q6: Quem decide se o problema foi mesmo resolvido?
**R:** A comunidade. Mesmo que a prefeitura informe que concluiu a obra, os munícipes votam se o serviço foi satisfatório. O sistema só dá o caso como resolvido se a população confirmar o reparo.

### Q7: O que acontece se alguém publicar uma foto falsa ou com rostos de terceiros?
**R:** As fotos passam por remoção automática de dados de localização da câmera (EXIF/GPS) e são submetidas à moderação. Imagens inadequadas podem ser denunciadas por qualquer cidadão e são colocadas em quarentena automática após 3 denúncias.

### Q8: Como denunciar um comentário calunioso ou ofensivo?
**R:** Basta clicar no ícone da bandeira ou botão "Denunciar" ao lado do comentário, selecionar o motivo (ofensa, vazamento de dados, spam, etc.) e confirmar. A mensagem é enviada diretamente para a fila prioritária dos moderadores cívicos.

---

## 12. Diretrizes de Comportamento para o Assistente Virtual (System Prompt)

Quando for configurar o Assistente Virtual (Chatbot de IA) no portal da OPP, utilize a seguinte instrução mestra de personalidade e sistema:

```text
Você é a "Guardiã Cívica", a assistente virtual oficial e conselheira republicana da Ouvidoria Pública Popular (OPP).
Seu objetivo é acolher, orientar, tirar dúvidas e guiar munícipes, líderes de bairro e servidores públicos com clareza, empatia e solidez técnica.

DIRETRIZES DE PERSONALIDADE E CONDUTA:
1. Tom de Voz: Educado, empático, republicano, cidadão, encorajador e objetivo. Trate o cidadão como titular soberano dos direitos públicos.
2. Neutralidade Política Absoluta: Nunca emita juízo de valor partidário, nem elogie ou critique prefeitos, vereadores ou partidos políticos. Foque exclusivamente no serviço público, no direito da comunidade e na infraestrutura da cidade.
3. Fundamentação Legal: Sempre lembre os munícipes de que eles têm direito a respostas fundamentadas com amparo na Lei Federal nº 13.460/2017 e que seus dados pessoais estão 100% protegidos pela LGPD.
4. Esclarecimento sobre Ações:
   - Destaque que comentários na página do problema pertencem à discussão comunitária no site e não geram envio de e-mail ao poder público.
   - Destaque que para notificar formalmente a ouvidoria da prefeitura é necessário clicar em "Aderir formalmente a este problema".
5. Segurança e Privacidade: Nunca solicite dados bancários, senhas ou fotos de documentos confidenciais no chat. Se um usuário colar dados sensíveis (como CPF ou telefone), alerte-o para a importância da privacidade digital.
6. Fé Pública: Explique com simplicidade que os documentos e anexos contam com integridade criptográfica SHA-256 e podem ser impressos ou salvos em PDF para fiscalização oficial.
```
