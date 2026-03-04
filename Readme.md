# 🔐 Crypto Visualizer (The Monorepo)

Bem-vindo ao **Crypto Visualizer**, um ecossistema projetado para simular, validar e estudar algoritmos essenciais de criptografia sob uma interface visual dinâmica. 

![Dashboard Print](https://github.com/JoaoIto/encrypt-decrypt-sign/blob/feat/encrypt-decrypt-v2/docs/assets/dashboard.png?raw=true)

O projeto adota uma arquitetura em **Monorepo** (gerenciada por `TurboRepo` + `npm workspaces`), permitindo que a lógica "crua" e matemática seja desemparelhada das APIs Serverless e consertada em tempo real pelo Front-end Next.js.

---

## ⚡ 1. Guia Rápido (Comandos de Execução)

Abaixo estão os comandos essenciais para você rodar rapidamente qualquer parte da arquitetura:

**Instalação Global:**
```
npm install
```

**Testes de Segurança:**
```
npm run test
```

**Rodar a Interface Web Master (Com Auto-Start de VMs):**
```
npm run dev:web
```

**Rodar Interface + Máquinas Virtuais Específicas Simultaneamente:**
- `npm run dev:sym` (Sobe Core Web + API Simétrica AES)
- `npm run dev:asym` (Sobe Core Web + API Assimétrica RSA)
- `npm run dev:hash` (Sobe Core Web + API Hash Scrypt)
- `npm run dev:cipher` (Sobe Core Web + API Cifra de César)

---

## 📖 2. Estrutura e Documentação Profunda

Acesse os links abaixo para aprender a arquitetura técnica, as rotas e o código de cada parte separada do sistema:

1. [Visão Geral de Arquitetura e Vida das ATMs (Recomendado)](./docs/architecture.md)
2. [Biblioteca **`crypto-core`** (Motor Matemático Aes, Rsa, Scrypt)](./docs/packages/crypto-core/README.md)
3. [Biblioteca **`logger`** (Motor de Telemetria de Memória e Logs)](./docs/packages/logger/README.md)
4. [Micro-Serviço **`sym-crypto-service`** (AES-256-CBC)](./docs/apps/sym-crypto-service/README.md)
5. [Micro-Serviço **`asym-crypto-service`** (RSA 2048 Público/Privado)](./docs/apps/asym-crypto-service/README.md)
6. [Micro-Serviço **`hash-service`** (Scrypt + Salt Dinâmico)](./docs/apps/hash-service/README.md)
7. [Micro-Serviço **`cipher-service`** (Cifra Didática de César)](./docs/apps/cipher-service/README.md)
8. [Painel **`web`** (Interface Next.js e Gráficos React Flow)](./docs/apps/web/README.md)

---

## 🔍 3. Entendendo a Arquitetura End-to-End

Toda vez que você aperta o botão *"Testar VM"* no Painel:
1. O Front-end bate no Terminal via Node `child_process` e checa se a Porta da VM alvo está aberta localmente. Se sim, prossegue.
2. O React dispara o Payload puro como *"Sua Mensagem Secreta"*.
3. O Backend recebe em `/encrypt`, puxa a função pura residente no pacote isolado `crypto-core`, processa a matemática pura e "salva" a linha no Array de RAM `logger`.
4. A resposta ofuscada é devolvida ao painel.
5. O Next.js pinta uma linha animada na interface React Flow até o "Nó de Destino".
6. Pausa-se 1 segundo e a aplicação devolve de volta a cifra para `/decrypt`.
7. A máquina destranca e retorna o conteúdo validado para o Receptor.
8. Enquanto a UI brilha, em *background*, requests de telemetria caem a cada 1000ms puxando a Rota `/logs` da Fastify e preenchendo o terminal visual nativamente na UI Hacker.
