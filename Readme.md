# 🔐 Crypto Visualizer (The Monorepo)

Bem-vindo ao **Crypto Visualizer**, um ecossistema projetado para simular, validar e estudar algoritmos essenciais de criptografia sob uma interface visual dinâmica. 

![Dashboard Print](https://github.com/JoaoIto/encrypt-decrypt-sign/blob/feat/encrypt-decrypt-v2/docs/assets/dashboard.png?raw=true)

O projeto adota uma arquitetura em **Monorepo** (gerenciada por `TurboRepo` + `npm workspaces`), permitindo que a lógica "crua" e matemática seja desemparelhada das APIs Serverless e consertada em tempo real pelo Front-end Next.js.

---

## 📖 1. Sumário do Monorepo & Base de Conhecimento

Criamos explicações técnicas e guias detalhados (Deep Research) para **cada** peça deste ecossistema. Utilize o sumário numérico abaixo para navegar na arquitetura completa:

### 1.1 🏛️ O Coração da Arquitetura
Entenda o fluxo completo de como as VMs operam, a orquestração do frontend, e como o monorepo foi construído. Este é o ponto de partida recomendado:
- [📄 `architecture.md` (Visão Geral de Arquitetura e Vida das VMs)](./docs/architecture.md)

### 1.2 🛠️ Bibliotecas Base (Packages)
As lógicas brutas isoladas compartilhadas pelos microserviços:
- [📦 \`crypto-core\` (Deep Research: Lógica Matemática)](./docs/packages/crypto-core/README.md)
- [📝 \`logger\` (Deep Research: Telemetria em Memória)](./docs/packages/logger/README.md)

### 1.3 🖥️ Micro-serviços de Criptografia (Apps)
As "Virtual Machines" (APIs Fastify) que envelopam a matemática:
- [🔒 \`sym-crypto-service\` (Mergulho no AES-256-CBC)](./docs/apps/sym-crypto-service/README.md)
- [🔑 \`asym-crypto-service\` (Mergulho no RSA 2048 Público/Privado)](./docs/apps/asym-crypto-service/README.md)
- [🛡️ \`hash-service\` (Mergulho no Scrypt + Salt Dinâmico)](./docs/apps/hash-service/README.md)
- [🏛️ \`cipher-service\` (Mergulho na Cifra Elementar de César)](./docs/apps/cipher-service/README.md)

### 1.4 🌐 O Painel Orquestrador (Front-end)
O cérebro gráfico que manipula todo o sistema:
- [✨ \`web\` (Deep Research: Next.js + React Flow)](./docs/apps/web/README.md)

---

## ⚡ 2. Guia Plug & Play

Esta aplicação foi polida para funcionar perfeitamente sem necessidade de o desenvolvedor decorar o ambiente inteiro. 

### 1. Inicializando as Dependências:
Sempre use apenas o **NPM**. Na raiz do projeto, instale *tudo* de uma vez só:
\`\`\`bash
npm install
\`\`\`

### 2. Rodando o Ambiente Visual Master (Next.js Dashboard)
Para entrar direto no painel gráfico sem precisar se preocupar com serviços backend:
\`\`\`bash
npm run dev:web
\`\`\`
*(O front-end possui um mecanismo que detecta se uma VM de criptografia estiver offline e fará um **Autostart no Background do Node** para você quando você apertar o botão Testar).*

### 3. Subindo o Front com Específicas "Virtual Machines" Atrás
Se você quiser desenvolver a matemática AES e já quiser subir o React ouvindo as alterações do seu backend em modo Dev (Hot-Reloading), temos scripts acoplados em Turborepo:

* \`npm run dev:sym\` -> Sobe o Dashboard + VM Simétrica AES
* \`npm run dev:asym\` -> Sobe o Dashboard + VM Assimétrica RSA
* \`npm run dev:hash\` -> Sobe o Dashboard + VM de Hashing Scrypt
* \`npm run dev:cipher\` -> Sobe o Dashboard + VM da Cifra de César
* \`npm run dev\` -> ⚠️ **Perigo:** Turborepo subirá **TODOS** os micro-serviços, front+backend simultaneamente em paralelismo máximo de CPU. (Pode exigir hardware pesado).

---

## 🔍 Entendendo a Arquitetura 

Toda vez que você aperta o botão *"Testar VM"* no Painel:
1. O Front-end Next.js bate no Terminal via `child_process` e checa se a Porta da VM alvo está aberta localmente. Se sim, ele prossegue.
2. O React dispara o Payload puro como *"Sua Mensagem Secreta"*.
3. O Backend Fastify recebe a requisição de `/encrypt`, puxa a função pura residente no `crypto-core`, processa a encriptação e "salva" as linhas de log em RAM na lib genérica `logger`.
4. O Backend responde em HEX ao painel a Cifra ofuscada.
5. O Next.js exibe visualmente as linhas na interface React Flow até a "Máquina".
6. Em menos de 1000ms a aplicação Web devolve a cifra para a Rota `/decrypt` da respectiva máquina.
7. A máquina destranca e retorna o conteúdo validado.
8. Ao longo desse ciclo de 3 segundos, o Painel Lateral faz requisições a cada 1000ms pingando a rota interna de `/logs` da Fastify, pintando os resultados nativos como se fosse o seu Terminal Bash!
