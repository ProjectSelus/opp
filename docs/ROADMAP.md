# 🗺️ Roadmap de Evolução Cívica & Melhorias Futuras (OPP)

Este documento registra oportunidades e propostas avaliadas e priorizadas para implementação em etapas posteriores do projeto, sem impacto no código e na arquitetura funcional atual.

---

## 🛡️ Moderação & Integridade de Conteúdo

### 1. Enriquecimento do Dicionário com `palavroes-pt-br`
- **Origem / Referência**: Repositório aberto [`moraispgp/palavroes-pt-br`](https://github.com/moraispgp/palavroes-pt-br).
- **Objetivo**: Expandir o dicionário regex de termos de baixo calão e palavras chulas com curadoria contínua da comunidade brasileira (gírias regionais, variações fonéticas e expressões coloquiais).
- **Vantagens**:
  - **Custo Zero**: Não requer pacotes extras, servidores ou chamadas de rede adicionais.
  - **Desempenho Instantâneo**: Mantém a latência de verificação em ~0.1 ms diretamente no navegador do cidadão.
  - **Compatibilidade Nativa**: Alimenta diretamente o array e regex existentes em [`packages/shared/src/domain/comment-moderation.ts`](file:///C:/Users/User/.gemini/antigravity/scratch/opp/packages/shared/src/domain/comment-moderation.ts).
- **Quando implementar**: Conforme surgirem termos ofensivos regionais específicos identificados pelos moderadores ou pela comunidade piloto.

---

### 2. Integração Opcional com a Google/Jigsaw Perspective API
- **Origem / Referência**: [Perspective API (Jigsaw / Google)](https://perspectiveapi.com/) — Pacote `@google/perspective-api-client` ou REST API.
- **Objetivo**: Adicionar um motor especializado em análise de discurso de ódio e toxicidade cívica para desonerar ou complementar a IA generativa (Gemini Flash).
- **Atributos Analisados**:
  - `TOXICITY` (Toxicidade geral de 0 a 1)
  - `SEVERE_TOXICITY` (Toxicidade severa / ódio explícito)
  - `INSULT` (Insulto e desrespeito direto)
  - `IDENTITY_ATTACK` (Ataques a raça, etnia, gênero, religião, orientação sexual ou idade)
  - `PROFANITY` (Baixo calão contextual)
- **Vantagens**:
  - **100% Gratuita**: Sem custos de infraestrutura ou licenciamento para iniciativas de utilidade pública e debate cívico.
  - **Especializada para Ouvidorias**: Desenvolvida especificamente para caixas de comentários públicos, jornais e fóruns cívicos.
  - **Nativa para Português Brasileiro**: Calibrada especificamente para nuances da língua portuguesa falada no Brasil.
  - **Ecossistema Google Unificado**: Chave de API habilitada no mesmo projeto do Google Cloud Platform (GCP) já utilizado pelo Firebase.
- **Quando implementar**: Quando o volume de interações e comentários crescer significativamente e for interessante desacoplar a análise de toxicidade das cotas do Gemini.
