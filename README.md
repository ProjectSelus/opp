# Ouvidoria Pública Popular (OPP)

> **Tecnologia Social Digital Cívica** • Arquitetura Firebase Issue-Centric • Versão 3.0

A Ouvidoria Pública Popular é uma plataforma cívica em que problemas públicos são descobertos, discutidos, documentados e transformados em manifestações formais individuais ou coletivamente consolidadas, com encaminhamento e acompanhamento transparentes.

---

## 🏛️ Princípios Centrais

1. **Problema Público como Aggregate Root**: A unidade central não é a reclamação individual, mas a situação pública coletiva (Issue).
2. **Busca Antes de Criar (P01)**: A experiência do cidadão prioriza encontrar problemas existentes e fortalecer a demanda coletiva com adesões formais.
3. **Discussão ≠ Manifestação Formal**: Comentários na comunidade enriquecem o debate, mas apenas a *Adesão Formal* gera encaminhamento institucional com consentimento individual auditável.
4. **Transmissão Técnica Autorizada**: A plataforma transmite eletronicamente a manifestação mediante autorização do cidadão, nunca falsificando remetente do cidadão nem fingindo representação jurídica.
5. **Privacidade e LGPD por Padrão**: Dados pessoais nunca entram no feed público nem são enviados à IA sem sanitização determinística local prévia.
6. **IA Assistiva e Desacoplada**: A API Gemini é utilizada exclusivamente no backend para suporte (classificação, resumo, risk flags); falhas de IA nunca bloqueiam o fluxo operacional humano básico.

---

## 📁 Estrutura do Repositório

```text
opp/
├── apps/
│   └── web/                   # Frontend React + TypeScript + Vite + Tailwind CSS
├── functions/                 # Cloud Functions for Firebase 2nd Gen (Backend)
│   └── src/
│       ├── domain/            # Regras e invariantes de domínio
│       ├── application/       # Orquestração e endpoints
│       ├── providers/         # SearchProvider, AIProvider, MailProvider
│       └── repositories/      # Repositórios Firestore desacoplados
├── packages/
│   └── shared/                # Entidades, máquinas de estado, sanitização e contratos
├── firebase/
│   ├── firestore.rules        # Regras de segurança e privacidade LGPD
│   ├── storage.rules          # Regras de isolamento de anexos e evidências
│   └── firestore.indexes.json # Índices compostos otimizados
├── docs/
│   └── CHANGELOG.md           # Auditoria contínua por fase
└── firebase.json              # Configuração completa do Firebase Emulator Suite
```

---

## 🚀 Como Executar Localmente

### 1. Instalar Dependências
```bash
npm install
```

### 2. Rodar os Testes Unitários
```bash
npm test
```

### 3. Iniciar o Frontend Web
```bash
npm run web:dev
```
Acesse: [http://localhost:5173](http://localhost:5173)

### 4. Iniciar os Emuladores do Firebase
```bash
npm run emulators:start
```
Painel do Emulator Suite: [http://localhost:4000](http://localhost:4000)
- Auth: porta 9099
- Firestore: porta 8080
- Functions: porta 5001
- Storage: porta 9199
- Hosting: porta 5000

---

## 📜 Licença e Marco Normativo

- **Licença**: Apache 2.0 (Tecnologia Social Aberta e Replicável)
- **Marco Legal**: Lei nº 13.460/2017 (Proteção e Defesa do Usuário de Serviços Públicos) e Lei nº 13.709/2018 (LGPD).
