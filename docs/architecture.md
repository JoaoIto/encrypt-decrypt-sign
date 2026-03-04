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

### 4. A Abstração Final: Bibliotecas "Core" (Próxima Etapa)
- **Desafio:** As VMs Web Fastify contêm, hoje, a casca das requisições. Contudo, precisamos isolar as lógicas "matemáticas" (como o script exato que roda o Scrypt do Node ou RSA puro) para não misturar HTTP com Código de Segurança real.
- **Plano de Ação:** Utilizar a subpasta `/packages/crypto-core`. Os scripts de backup em `_legacy` serão exportados no formato `export function encryptAES()`. A biblioteca servirá para publicação aberta (Exemplo: NPM publicar `joao-crypto-core-lib`).

### 5. Telemetria e Logs das Máquinas Virtuais em Tempo Real (Nova Fase Adicionada)
- **Desafio:** As VMs operam nos bastidores usando processos paralelos. O usuário não consegue ver os logs do `logger` interno sem abrir múltiplos terminais.
- **Plano de Ação:** O Next.js (`apps/web/src/app/api/vm`) não apenas irá "acordar" os serviços, mas passará a repassar o fluxo de dados (stdout/stderr) em tempo real para a UI do painel através de variáveis ou Server-Sent Events (SSE).

### 6. Fluxo de Vida Completo: O Processo de Desencriptação (Nova Fase Adicionada)
- **Desafio:** O dashboard atualmente apenas simula graficamente o envio até o receptor baseando-se no HealthCheck. Para provar o conceito de fato, a requisição deve ser validada por ambos.
- **Plano de Ação:** Modificar as rotas FastAPI para não possuirem apenas o HealthCheck `/`. Rotas como `POST /encrypt` e `POST /decrypt` serão construídas. O Payload Web fará uma viagem de "ida e volta" pelo `React Flow`. Retornará a Cifra na ida e o texto puro validado na volta. O painel deve pintar o log de cada etapa da matemática de volta!
- **Desafio:** Subir processos web, APIs isoladas ou a combinação dos dois exige conhecimentos complexos do usuário e múltiplos terminais lado a lado na tela.
- **Ação Técnica:** Configuramos scripts de automação robustos em `/package.json`, ex: `"dev:sym": "turbo run dev --filter=web --filter=sym-crypto-service"`. Isso invoca a CLI do Turbo: ao detectar esse atalho, o Turbo sobe magicamente em threads duplas de velocidade (evitando compilações redudantes graças ao cache interno `cache: true`) apenas os projetos chamados. 

---
