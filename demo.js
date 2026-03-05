import readline from 'readline';
import os from 'os';
import { encryptCaesar, decryptCaesar } from 'encrypt-decrypt-sign';

const CAESAR_SHIFT = 4; // Shift fixo para a aula

// Utilitário 1: Descobrir o IP Local da Máquina (simulando a VM)
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

// Utilitário 2: Promisify o setTimeout para fazer o terminal 'dormir' (Efeito Slow Motion / Matrix)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Utilitário 3: Imprimir texto devagar estilo maquina de escrever
async function slowPrint(text, speedMs = 30) {
    for (const char of text) {
        process.stdout.write(char);
        await sleep(speedMs);
    }
    console.log(); // Quebra de linha no fim
}

// Configuração do Leitor do Terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function main() {
    console.clear();
    await slowPrint('======================================================', 10);
    await slowPrint('🔐 SIMULADOR DIDÁTICO DE CRIPTOGRAFIA 🔐', 10);
    await slowPrint('======================================================\n', 10);

    const ip = getLocalIP();
    await slowPrint(`✔️  Máquina Host Iniciada.`);
    await slowPrint(`🌐 IP Detectado (VM Local): \x1b[36m${ip}\x1b[0m`);
    await slowPrint(`⚙️  Algoritmo Carregado: Cifra de Substituição (Deslocamento = ${CAESAR_SHIFT})`);
    console.log('\n------------------------------------------------------');

    while (true) {
        console.log('\nEscolha o seu Papel na Comunicação:');
        console.log('  [1] Lado A - Remetente (Cifrar Mensagem)');
        console.log('  [2] Lado B - Destinatário (Decifrar Mensagem)');
        console.log('  [3] Sair');

        const option = await askQuestion('\nSelecione (1, 2 ou 3): ');

        if (option === '1') {
            await runSenderFlow(ip);
        } else if (option === '2') {
            await runReceiverFlow(ip);
        } else if (option === '3') {
            await slowPrint('\nEncerrando sessão segura... Adeus!');
            rl.close();
            break;
        } else {
            console.log('❌ Opção inválida. Tente novamente.');
        }
    }
}

async function runSenderFlow(ip) {
    console.log('\n--- 📤 MODO REMETENTE ---');
    const plainText = await askQuestion('Digite a mensagem secreta (Texto Claro): ');

    await slowPrint('\n[SISTEMA] Iniciando processo de empacotamento...');
    await sleep(800);
    await slowPrint(`[SISTEMA] Máquina Origem  (TX): \x1b[32m${ip}\x1b[0m`);
    await slowPrint(`[SISTEMA] Invoking Command: \x1b[33m$ encryptCaesar("${plainText}", ${CAESAR_SHIFT})\x1b[0m`);
    await sleep(1000);

    console.log('\n🔍 --- CRIPTOANÁLISE VIZUAL ---');
    let encryptedResult = '';

    for (let i = 0; i < plainText.length; i++) {
        const char = plainText[i];
        // Aplica a cifra apenas nessa letra para o visual
        const cipherChar = encryptCaesar(char, CAESAR_SHIFT);
        encryptedResult += cipherChar;

        await slowPrint(`   Byte[${i.toString().padStart(2, '0')}]: '${char}' (CODE:${char.charCodeAt(0)}) -> Shift +${CAESAR_SHIFT} -> '${cipherChar}' (CODE:${cipherChar.charCodeAt(0)})`, 40);
        await sleep(200); // Atraso extra para a turma poder ler a linha
    }

    await slowPrint('\n✅ Criptografia Concluída com Sucesso!');
    await sleep(500);

    console.log('======================================================');
    console.log('📝 COPIE O TEXTO CIFRADO ABAIXO E ENVIE AO LADO B:');
    console.log(`\x1b[31m${encryptedResult}\x1b[0m`);
    console.log('======================================================\n');

    await askQuestion('(Pressione ENTER para voltar ao Menu Principal...)');
}

async function runReceiverFlow(ip) {
    console.log('\n--- 📥 MODO DESTINATÁRIO ---');
    const cipherText = await askQuestion('Cole a mensagem recebida (Texto Cifrado): ');

    const assumedSenderIp = '10.0.0.x (Network)'; // Simulação de onde veio

    await slowPrint('\n[SISTEMA] Conexão Entrante Detectada!');
    await sleep(800);
    await slowPrint(`[SISTEMA] Máquina Remetente (RX): \x1b[32m${assumedSenderIp}\x1b[0m`);
    await slowPrint(`[SISTEMA] Máquina Destino   (Host): \x1b[36m${ip}\x1b[0m`);
    await slowPrint(`[SISTEMA] Invoking Command: \x1b[33m$ decryptCaesar("${cipherText.substring(0, 5)}...", ${CAESAR_SHIFT})\x1b[0m`);
    await sleep(1000);

    console.log('\n🔍 --- REVERSÃO CRIPTOGRÁFICA ---');
    let plainResult = '';

    for (let i = 0; i < cipherText.length; i++) {
        const char = cipherText[i];
        const plainChar = decryptCaesar(char, CAESAR_SHIFT);
        plainResult += plainChar;

        await slowPrint(`   Decode[${i.toString().padStart(2, '0')}]: '${char}' (CODE:${char.charCodeAt(0)}) -> Shift -${CAESAR_SHIFT} -> '${plainChar}' (CODE:${plainChar.charCodeAt(0)})`, 40);
        await sleep(200);
    }

    await slowPrint('\n✅ Descriptografia Concluída com Sucesso!');
    await sleep(500);

    console.log('======================================================');
    console.log('🔓 TEXTO CLARO REVELADO:');
    console.log(`\x1b[32m${plainResult}\x1b[0m`);
    console.log('======================================================\n');

    await askQuestion('(Pressione ENTER para voltar ao Menu Principal...)');
}

// Inicia o app
main().catch(err => {
    console.error('Erro Fatal:', err);
    process.exit(1);
});
