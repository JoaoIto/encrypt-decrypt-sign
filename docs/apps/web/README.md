# 🌐 \`web\` (React Flow Dashboard & Orchestrator Master)

> **Front-end Ultra-Avançado App Router (Next.js 14+)**. Esta aplicação não é apenas a interface (UI), ela é o próprio regente do sistema operacional local do Workspace, governando as ATMs menores de Node diretamente do seu navegador. O ecossistema está construído ao redor da stack Tailwind CSS + React Flow.

---

## ⚙️ A Arquitetura do "Cold Start" Automático (API /vm)
Para satisfazer requisitos de **"Play & Play Automatizado Sem Terminais"**, foi necessário dar inteligência ao Next.js além de componentes em React Puro.

Construímos o **Orquestrador Child Process**:
O Next.js contendo uma Server Route (Server Action Backend Interno) em \`apps/web/src/app/api/vm/route.js\`.

### Fluxo Operacional:
1. O usuário clica em `Testar VM` no front.
2. O Painel faz um `POST /api/vm`. O Next passa a conversar com o Kernel do seu SO/Hardware.
3. Checamos (com o binário `wait-on` por baixo dos panos) se a API destino (`localhost:300x`) pisca via Socket HTTP 200.
4. Se o erro for de conexão recusada (VM Desligada), o Orquestrador injeta no Console Virtual:
   - \`exec("npm run dev --workspace=apps/{vmType}")\`
5. A máquina sobe sob demanda, invisível ao usuário final. O React aguarda a promessa e destrava os botões só quando a UI "Verde OK" sinalizar que a VM em background respondeu ao Socket.

---

## 🎨 React Flow e Viagem Ponta a Ponta

**O `simulateExchange` do \`page.js\`** comanda três etapas críticas:
1. Envio do Objeto: Aciona o Backend Fastify no `/encrypt`.
2. Recebimento da Cifra: A linha animada do grafo assume `stroke Azul`, simula o pulso indo pra VM. O painel esquerdo atualiza o Network Log e extrai o Payload Hexadecimal / Scrypt e mostra na interface.
3. Pós-Processamento: Espera 1 segundo para o usuário entender o tempo real e re-emite o Payload no Node `/decrypt` da Máquina. Linha Animada do grafo assume `stroke Verde`.
4. Visualiza-se tudo o que a matemática desconstruiu.

## 📡 Sonda de Logs Real-time
No painel esquerdo há telas de terminal. Pela falta de websockets ou integrações caras de Event Streaming (Kafka), contruimos um "Short Pulling Mechanism" muito robusto em React via React Hooks + \`setInterval\`. 

\`\`\`javascript
 React.useEffect(() => {
     if(!activePort) return;
     const interval = setInterval(async () => {
         // Fica pingando a respectiva rota de telemetria da VM a cada 1 seg:
         const logRes = await fetch(`http://localhost:${activePort}/logs`);
         // Injeta sem re-render looping set logs
     }, 1000);
     return () => clearInterval(interval);
  }, [activePort]);
  
// O Payload é dinamicamente atachado ao console da DIV usando Map.
\`\`\`
