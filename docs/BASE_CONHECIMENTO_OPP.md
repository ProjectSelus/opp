# Base de Conhecimento, Visão Social e Manual de Funções
# Ouvidoria Pública Popular (OPP) — Versão 3.0

> **Finalidade deste Documento:**  
> 1. Servir como **base de contexto e conhecimento oficial** para alimentar o **Assistente Virtual de Inteligência Artificial** integrado ao site da OPP.  
> 2. Fornecer aos fundadores, parceiros, órgãos públicos e cidadãos uma visão clara, técnica e humanizada sobre o propósito, impacto social e funcionamento de todas as ferramentas da plataforma.

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
* **Hash SHA-256:** Código alfanumérico único de 64 caracteres gerado por cálculo matemático que comprova a autenticidade e inviolabilidade do documento.
* **Consenso Comunitário de Resolução:** Métrica cívica calculada a partir dos votos da vizinhança (Sim, Parcialmente, Não) para validar a eficácia de um reparo público.

---

## 3. Guia Detalhado de Todas as Funções da Plataforma

### 3.1. Busca Prévia Inteligente (*Search-First*)
* **Como Funciona:** Logo na tela inicial e no formulário de novo problema, o cidadão digita o que está acontecendo (ex: *"poste queimado rua 7"*).
* **Tecnologia:** Motor de busca por tokens e similaridade semântica com suporte a prefixos, tolerância ortográfica e normalização da língua portuguesa.
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

### 3.5. Galeria de Evidências Fotográficas e Documentais
* **Como Funciona:** Moradores podem anexar fotos de postes, buracos, vazamentos ou documentos públicos.
* **Isolamento e Segurança:** As imagens são enviadas para uma área privada de validação onde os metadados sensíveis (como coordenadas GPS da câmera pessoal) são removidos antes da exposição pública, protegendo os moradores de qualquer risco de exposição.

### 3.6. Ingestão Automatizada de E-mails do Poder Público
* **Como Funciona:** Quando a ouvidoria pública da prefeitura ou secretaria responde ao e-mail de notificação (ou envia um ofício em PDF anexado), o webhook de ingestão da OPP entra em ação.
* **Correlação Automática:** O sistema identifica a qual problema aquela resposta pertence através do remetente dinâmico (*Plus Addressing*, ex: `resposta+OPP-MN-2026-00142@ouvidoria.opp.org.br`) ou pelo número do protocolo no assunto/corpo.
* **Extração de Protocolo do Órgão:** Um algoritmo de leitura identifica códigos como `SEMOB/ILUM-2026/04481` ou `99881/2026`.
* **Classificação de Teor:** O sistema distingue se é apenas uma mensagem automática de recebimento (*Acknowledgment*) ou uma resposta conclusiva com solução dos trabalhos.
* **Publicação com Hash SHA-256:** A resposta oficial e seus anexos originais em PDF são disponibilizados publicamente para consulta de todos os munícipes na página do problema.

### 3.7. Seção "Documentos Formais Vinculados" e Modal de Visualização
* **Acesso Público Irrestrito:** Qualquer cidadão pode ler na íntegra a Carta Cidadã enviada e o Ofício Oficial respondido pelo órgão.
* **Comprovação de Fé Pública:** O modal exibe a data exata do registro, o número do protocolo do órgão, o hash criptográfico SHA-256 de autenticidade e um botão de **"Imprimir / Salvar PDF"**.

### 3.8. Votação Cívica de Resolução & Consenso
* **O Problema Resolvido:** Muitas vezes o poder público encerra um chamado como "concluído", mas a equipe apenas passou pelo local ou fez um conserto precário.
* **Como Funciona:** Moradores autenticados que acompanham o problema votam:
  - *Sim, resolvido totalmente*
  - *Parcialmente resolvido*
  - *Não resolvido*
  - *Não sei avaliar*
* **Algoritmo de Consenso:** O problema só transiciona para o status `RESOLVED` no sistema se atingir a margem de concordância da população local. Caso contrário, permanece com status de contestação ou reabertura comunitária.

### 3.9. Painel de Transparência e Estatísticas Abertas
* **Dados Públicos Abertos:** Relatórios mensais e gráficos demonstrando:
  - Tempo médio de resposta de cada secretaria;
  - Secretarias mais atenciosas e secretarias reincidentes em silêncio;
  - Volume de adesões formais atendidas por bairro;
  - Dossiês de problemas históricos pendentes há mais de 30 dias.

---

## 4. Perguntas Frequentes (FAQ Estruturado para o Assistente Virtual)

### Q1: A OPP é um órgão da Prefeitura ou do Governo?
**R:** Não. A Ouvidoria Pública Popular (OPP) é uma plataforma cívica independente mantida pela própria comunidade e por tecnologia social. Ela atua como ponte técnica autorizada pelos cidadãos para formalizar cobranças e exigir respostas nos termos da lei.

### Q2: Qual é a diferença entre comentar e aderir formalmente a um problema?
**R:** O comentário é um diálogo comunitário interno entre moradores no site e **não** é enviado por e-mail para a prefeitura. A **Adesão Formal**, por sua vez, é um ato oficial: gera um protocolo sequencial, emite comprovante digital e dispara imediatamente uma manifestação individual por e-mail à ouvidoria pública competente.

### Q3: Meus dados pessoais (como CPF e endereço exato) ficam visíveis na internet?
**R:** De forma alguma! A plataforma segue rigorosamente a Lei Geral de Proteção de Dados (LGPD). Dados como CPF, e-mail e telefone nunca são exibidos no site. Além disso, ao aderir, você pode optar por manter seu nome ocultado do público geral.

### Q4: Por que alguns comentários aparecem com "######"?
**R:** Para manter a conversa construtiva e republicana, palavras de baixo calão e ofensas são mascaradas com `######`. O objetivo é focar na cobrança do serviço público, mantendo um ambiente seguro e civilizado.

### Q5: O que é o Hash SHA-256 que aparece nos documentos?
**R:** É uma assinatura digital criptográfica única. Ela garante que o ofício emitido pelo órgão ou a carta enviada pelos moradores não foram adulterados ou falsificados. Qualquer pessoa pode conferir a integridade do arquivo.

### Q6: Quem decide se o problema foi mesmo resolvido?
**R:** A comunidade. Mesmo que a prefeitura informe que concluiu a obra, os munícipes votam se o serviço foi satisfatório. O sistema só dá o caso como resolvido se a população confirmar o reparo.

---

## 5. Diretrizes de Comportamento para o Assistente Virtual (System Prompt)

Quando utilizar esta base de conhecimento para configurar o Assistente Virtual (Chatbot de IA) no portal, utilize as seguintes instruções mestras:

```text
Você é a "Guardiã Cívica", assistente virtual oficial da Ouvidoria Pública Popular (OPP).
Seu objetivo é acolher, tirar dúvidas e guiar munícipes, lideranças comunitárias e gestores públicos sobre o funcionamento da plataforma e sobre seus direitos cívicos.

DIRETRIZES DE PERSONALIDADE E CONDUTA:
1. Tom de Voz: Empático, republicano, acessível, cidadão e esclarecedor. Trate o munícipe com respeito e clareza.
2. Neutralidade Política: Nunca apoie, critique ou promova partidos, vereadores ou prefeitos. O foco absoluto é a qualidade do serviço público e a solução dos problemas da cidade.
3. Fundamentação Legal: Sempre que oportuno, lembre os munícipes de que eles estão respaldados pela Lei Federal nº 13.460/2017 (Código de Defesa dos Direitos dos Usuários de Serviços Públicos) e que seus dados estão seguros sob a LGPD.
4. Esclarecimento sobre Adesões vs Comentários: Explique sempre que comentários ficam na comunidade e que a cobrança oficial ao órgão público acontece através do botão "Aderir formalmente".
5. Segurança: Nunca solicite dados bancários, senhas ou documentos confidenciais do usuário. Se o usuário digitar dados sensíveis no chat, oriente-o a não compartilhar informações pessoais em áreas públicas.
```
