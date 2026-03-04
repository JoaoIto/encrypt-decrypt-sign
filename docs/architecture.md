# Plano Arquitetural Detalhado - Crypto Visualizer

## Introdução
O objetivo original era modernizar scripts de criptografia (criados inicialmente no formato CommonJS/ESM "soltos") e transformá-los em aplicações encapsuladas (VMs/Microserviços) fáceis de estudar, testar e publicar. O trunfo desta reestruturação é o **Monorepo (Turborepo)** e o Frontend de Orquestração Visões (Next.js).

---

## Fases de Implementação

### 1. Migração de Scripts para NPM Workspaces (Concluído)
- **Desafio:** Manter vários projetos em um repositório sem complicar o uso e sem gastar muito tempo/processamento com bibliotecas (`node_modules`) duplicadas.
- **Ação Técnica:** O repositório base (`token_nodejs`) foi modificado para utilizar o conceito moderno de "workspaces" do NPM de forma a centralizar todos os pacotes.

### 2. Microserviços de Alta Performance com Fastify (Concluído)
- **Desafio:** Scripts Node puros que lidam com requisições HTTP dão trabalho desnecessário para lidar com CORS e headers. O Express seria a saída clássica, mas tem baixo desempenho.
- **Ação Técnica:** Criamos uma pasta `apps/`. Dentro dela, cada antigo algoritmo de criptografia ganhou sua própria API REST (sua máquina - VM) turbinada com o framework **Fastify** (referência em escalabilidade em Node.js hoje).
    - `cipher-service`: Ponto de extremidade focado em transposição de caracteres.
    - `hash-service`: Dedicado exclusivamente à funções de via única e senhas baseadas no `scrypt`.
    - `sym-crypto-service`: Criptografa strings utilizando `aes-256-cbc`.
    - `asym-crypto-service`: Emprega o `crypto` nativo para troca pública-privada baseada em RSA clássico de longa bitagem (2048) nativo.
    - `jwt-service`: Exclusivo para empacotar hashes usando tokens baseados em tempo de expiração `jsonwebtoken`.

### 3. Orquestrador Visual - Dashboard NextJS + Animado (Concluído)
- **Desafio:** A criptografia em textos é opaca e difícil de "debugar" mentalmente (é "caixa-preta").
- **Ação Técnica:** Construindo o projeto web em `/apps/web` através do Next.js (App Router), projetou-se uma UI (Interface de Usuário) limpa que consome as APIs. Mais que botões, aplicamos a tecnologia do `@xyflow/react` para plotar geograficamente os serviços. A injeção de classes CSS "Glassmorphism" dá o apelo tátil moderno. 
O Front-End interage enviando pacotes HTML locais (fetch) por portas reservadas do microserviço e renderiza a saída num console integrado interno.

### 4. A Abstração Universal: \`crypto-core\`
- **O Design:** A fim de proteger a inteligência sistêmica e ser publicável (Ex: NPM), toda a lógica criptográfica pesada (Chaves RSA PEM, AES-CBC-256, e o framework de Scrypt Salted) residem pura e isoladamente na sub-biblioteca interna \`packages/crypto-core\`.
- **Uso Comum:** As VMs do projeto (Cifra, Simétrica, Assimétrica, Hashing) apenas *importam* do pacote mestre as funções pré-compiladas, aplicando-as em rotas HTTPS RestFul. Isso limpa drasticamente o código de backend.

---

## ⚙️ Fluxo Operacional: Como o Sistema Respira?

O ápice desta reestruturação se provou na **Orquestração Automática de Containers Virtuais (VMs)** gerenciada diretamente por uma interface web intuitiva.

### A. O Ciclo de Vida dos Comandos (Turborepo)
Em monorepos normais lidar com diferentes portas e aplicações em paralelo consumia múltiplos Bash Terminais para o Cientista de Dados/Dev. 
Resolvemos orquestrando **Comandos Turbo Paralelos** em `package.json`. 
Exemplo: ao rodar \`npm run dev:cipher\`, a CLI do Turborepo inteligentemente rastreia o filtro \`--filter=web\` e \`--filter=cipher-service\`. Utilizando threads baseadas no poder do seu CPU, ambas aplicações sobem paralelamente com output unificado colorido (o Front em 3000, e a VM Cifra em 3001) em menos de 1 segundo utilizando Cache Hits.

### B. Auto-Wake Híbrido (O Despertar da VM)
*"O que acontece se eu rodar **apenas** o front-end e não ativar os backends e pedir pra visualmente encriptar algo?"*
Foi adicionada inteligência nativa Next.js Node (Sub-Process) no App web.
1. O Front bate de frente com o endpoint interno de orquestração web (Rota Serverless Next REST `POST /api/vm`).
2. O servidor usa a lib `wait-on` para farejar a porta HTTP da máquina destinada na placa local.
3. Se a porta cair no *Timeout* (morta), o código **inicia ativamente via Child Process Shell o script NPM associado à VM apagada**, segurando a requisição no ar por 15 segundos até o boot finalizar. O ambiente virtualizado da criptografia surge sob demanda, frio (Cold Start).

### C. O Fluxo de Telemetria Contínua (Os Logs Nativos)
Em vez de ver terminais Bash escondidos, a interface provê o fluxo técnico transparente via "Short-Polling".
* Foi criada a lib mestre auxiliar \`packages/logger\`.
* Sempre que o motor criptográfico Fastify dentro da VM gera uma "Math Action" (Geração de Assinatura, KeyPair, Tempo de Scrypt), além do \`console.log\` normal padrão, também empilha ordenado em memória usando a library \`logger\`.
* Imediatamente os frontends da página fazem \`HTTP GET /logs\` num intervalo ultra-curto (1000ms).
* As linhas são repassadas via Json, e printadas como terminais Hacker-like em Tempo Real no SideBar panel esquerdo da UI Web!

### D. A Trip de Desencriptação (Ida e Volta Completa)
Para provar que nada é 'Mokado' e a Criptografia é de Classe Bélica:
1. O texto do Painel vai como Payload JSON: \`{"message": "secret"}\`.
2. A VM reage em \`POST /encrypt\`. Puxado pelo pacote `crypto-core`, ela amarra a matemática, encerra e emite Log (detectado simultaneamente pelo SideBar visual). E responde a cifra intransitiva ex: `f32c1e40a...`.
3. O Painel web renderiza "O Túnel Azul" da React Flow Animation.
4. Pausa por um segundo como dramaturgia visual / networking real, e despacha de volta para \`POST /decrypt\` com a mesma cifra ofuscada.
5. Se for modo **Simétrico**: A mesma VM desencripta a mesma cifra com a chave que só *ela* gerou internamente, recuperando em ASCII o conteúdo 100%. Se for o serviço de **Hash**, ele roda o `timingSafeEqual()` em vez de tentar desencriptar (impossível no salt unidirecional).
6. A interface reage com "O Túnel Verde" emitindo a resposta Final original no Log, comprovando a viagem End-to-End criptograficamente perfeita.
