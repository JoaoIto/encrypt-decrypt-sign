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
**Demonstração Didática DEMO:**
Rodar a interface interativa de Terminal "Slow-Motion" para Cifra de César com IP Tracking e Logs para teste de criptoanálise.
```
npm run demo
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
9. [Criptoanálise Didática **`demo`** (Explicação Matemática e Atividade de Aula)](./docs/demo/README.md)

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

---

## 💻 4. Atividade de Criptoanálise: DEMO

Uma ferramenta interativa construída puramente em `Node.JS` chamada **Criptoanálise na Prática** foi englobada neste Monorepo para uso didádico.

Trata-se do comando global `npm run demo`.

**Para que serve este script?**
Ao contrário das VMs que rodam rápido demais na porta 3000, esta ferramenta funciona com:
- **Matrix / Slow Motion:** Ela quebra os "Char Codes" letra por letra no terminal usando *setTimeout* e exibindo os processos em tempo real do Cálculo de César (Shift Code Original + ASCII Numérico = Novo Caractere numérico -> Letra Cifrada).
- **Rastreamento P2P Virtual:** O console captura diretamente pela interface de máquina subjacente (`os.networkInterfaces()`) qual o verdadeiro `IP da Rede Local` do Aluno (Remetente) e simula a ponte do Destinatário sem precisar construir instâncias HTTP na hora da apresentação.

**Como Rodar:**
1. terminal 1 dá o `npm run demo`
2. Pressiona `1` para Cifrar e digita no Console. O PC fará a conta em *Slow Motion*.
3. O terminal Copia com CTRL+C a mensagem Cifrada em *"Vermelho"*. Envia ao amigo no Laboratório.
4. O terminal 2 roda `npm run demo`, seleciona opção `2` de Descriptografar e cola o lixo virtual. O terminal deste terminal lerá do Byte Zero ao último englobando a matemática com `Shift negativo`.

**Aprenda o Algoritmo e a Matemática aqui:** [Leia a documentação detalhada das Fórmulas da Demonstração e da Engine CLI neste link.](./docs/demo/README.md)

---

## 🔒 5. Atividade de Assinatura Digital: HTTPS + TLS 1.3 + Nginx

Esta atividade acadêmica demonstra na prática o ciclo completo de um **Certificado Digital Autoassinado** funcionando em um servidor web real, explorando os mesmos conceitos teóricos de chaves públicas e privadas (RSA) utilizados nos micro-serviços deste monorepo — desta vez aplicados na camada de transporte da Web.

**📋 Requisitos atendidos:**
- ✅ Servidor web **Nginx 1.28** em contêiner Docker
- ✅ Protocolo **HTTPS obrigatório** (HTTP redireciona 301 → HTTPS)
- ✅ **TLS 1.3** exclusivo (versões anteriores desabilitadas)
- ✅ Chave RSA de **4096 bits** (gerada via OpenSSL)
- ✅ Certificado **autoassinado** (sem CA pública)
- ✅ Aplicação **Joomla 5.4.3** rodando sobre o servidor seguro

**🏗️ Arquitetura da Solução:**
```
Navegador  ──HTTPS (TLS 1.3 / RSA 4096)──►  Nginx 1.28 (porta 443)
                                                      │ proxy HTTP interno
                                                      ▼
                                             Joomla 5 (Apache)
                                                      │
                                                      ▼
                                             MySQL 8.0 (banco)
```

**⚡ Como Rodar:**
```bash
cd packages/assignature

# Windows (sem OpenSSL no PATH)
node generate-cert.js

# Linux / Mac / Git Bash
openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
  -keyout nginx/certs/server.key -out nginx/certs/server.crt \
  -subj "/C=BR/ST=SP/L=SaoPaulo/O=Faculdade/OU=Seguranca/CN=localhost"

docker compose up -d
# Acesse: https://localhost
```

**📖 Documentação Completa com Prints e Tutorial Passo a Passo:**  
→ [**docs/packages/assignature/README.md**](./docs/packages/assignature/README.md)

---

## 🛡️ 6. Laboratório de Firewall Avançado: IPTables e IPFW

Atividade profissional simulando um gateway de segurança completo projetado com políticas padrão restritivas (Default DROP).

**📋 Requisitos atendidos:**
- ✅ Implementações em **Debian 13.x (IPTables)** e **FreeBSD 15.x (IPFW)**.
- ✅ Rede dividida em WAN, DMZ isolada (Joomla e DBs) e LAN Administrativa.
- ✅ Regras de **NAT Reverso (DNAT)** para publicação dos Servidores Web via porta 80/443.
- ✅ Regras de **NAT (SNAT/Masquerade)** com *controle de horário* (Módulo Time) liberando internet apenas no almoço e após 18h.
- ✅ Controles de **Stateful Inspection**, rejeitando ICMP externo, spoofing, tcp limit-burst (synflood) e portscan.
- ✅ Auditabilidade isolada (LOG target) rastreando SSH, MySQL e PostgreSQL vindos da máquina Windows (Admin).

**📖 Código das Regras e Roteiro de Testes Automáticos com Python Nativo:**  
→ [**apps/firewall-lab/README.md**](./apps/firewall-lab/README.md)
