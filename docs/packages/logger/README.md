# 📝 \`logger\` (Pacote Utilitário Interno)

> **Pacote Monorepo Nativo `(@workspace/logger)`** focado na aglutinação dos ponteiros de Standard Output/Error dos processos NodeJS que os renderizam em listas de memória para consumo HTTP assíncrono.

## 📌 Arquitetura e Necessidade
Em um desenvolvimento normal, faríamos um `console.log("X")` na máquina Virtual de Segurança e ele printaria no Bash Terminal C:. Contudo, nesse projeto ultra-isolado, construímos um mecanismo Visual Web (No Dashboard do Next.JS). Como a UI vai ler logs locais da Memória Fastify se eles não estão conectados?

Por meio do compartilhamento global transiente de Histórico dentro da Memória Isolada da VM e exposição via \`export\` de JS.

## 🛠️ Método Exportado `log(msg)` 

Esta função é consumida pelas Rotas do Fastify não apenas para emitir output console. A cada log que os arquivos realizam na lógica de criptografia (Ex: "Chave AES gerada", "Scrypt Forçado Com Sucesso"):

1. Pega essa Message de Entrada.
2. Injeta um Timestamp de String Global Date legível formatado.
3. Dá Print Node Original \`console.log\`
4. Push (Append) pra dentro do Array Nativo Mestre \`logsHistory\`.

E esse Array é exportado diretamente para todos os Listeners em Rotas \`GET /logs\`.

_Para segurar estouros de Memória (Memory Leak do Heap do V8 Engine Node)_:
\`\`\`javascript
if (logsHistory.length > 50) logsHistory.shift();
\`\`\`
O logger mantém apenas os limites visuais precisos dos 50 últimos logs por VM instânciada. Semelhante a uma "Stack Queue".
