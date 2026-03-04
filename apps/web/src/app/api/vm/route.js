import { exec } from 'child_process';
import waitOn from 'wait-on';

// Armazena processos filhos globais (caso rode em Serverless pode resetar, mas para uso local funciona)
const runningVMs = new Map();

export async function POST(req) {
    try {
        const { vmType, port } = await req.json();

        if (!vmType || !port) {
            return new Response(JSON.stringify({ error: "Missing vmType or port" }), { status: 400 });
        }

        const processName = `${vmType}-service`;
        const targetUrl = `http://localhost:${port}`;

        // 1. Tenta ver se já está online rapidamente (2s)
        try {
            await waitOn({ resources: [targetUrl], timeout: 2000 });
            return new Response(JSON.stringify({ status: "already_running" }), { status: 200 });
        } catch (e) {
            // Se caiu aqui, está offline!
        }

        // 2. Avisa que estamos ligando
        if (runningVMs.has(vmType)) {
            return new Response(JSON.stringify({ status: "starting" }), { status: 200 });
        }

        // 3. Inicia o subprocesso no contexto do Turborepo/Workspace
        // Usa npm run dev --workspace=apps/{vmType}-service
        const child = exec(`npm run dev --workspace=apps/${processName}`, {
            cwd: process.cwd().replace(/apps\\web|apps\/web$/, ""), // Resolve na raiz do monorepo
        });

        runningVMs.set(vmType, child);

        child.stdout?.on('data', (d) => console.log(`[${processName}]`, d));
        child.stderr?.on('data', (d) => console.error(`[${processName} ERR]`, d));

        // 4. Aguarda agressivamente até que a porta local responda "OK"
        try {
            await waitOn({ resources: [targetUrl], timeout: 15000, interval: 500 }); // Espera até 15s a VM bootar
            return new Response(JSON.stringify({ status: "started" }), { status: 200 });
        } catch (err) {
            return new Response(JSON.stringify({ error: "VM Boot Timeout" }), { status: 504 });
        }

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
