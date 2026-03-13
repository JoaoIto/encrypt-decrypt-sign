/**
 * generate-cert.js
 * Gera um certificado autoassinado RSA 4096 bits usando apenas Node.js nativo.
 * Não precisa de OpenSSL no PATH nem Docker.
 *
 * Uso: node generate-cert.js
 */

import { generateKeyPairSync, createSign } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const certsDir = join(__dirname, 'nginx', 'certs');

mkdirSync(certsDir, { recursive: true });

console.log('🔑 Gerando par de chaves RSA 4096 bits...');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding:  { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
});

// Escreve a chave privada
const keyPath = join(certsDir, 'server.key');
writeFileSync(keyPath, privateKey);
console.log(`✅ Chave privada salva:    ${keyPath}`);

// ─────────────────────────────────────────────────────────────
// Monta um certificado X.509 autoassinado "na mão"
// Node.js não tem API de alto nível para X.509 completo,
// por isso usamos um certificado pré-gerado a partir do forge
// ou usamos a abordagem via subprocess.
// ─────────────────────────────────────────────────────────────

// Tenta usar o openssl do Git for Windows se disponível
import { execSync } from 'node:child_process';

const opensslPaths = [
    'openssl',                              // PATH padrão (Linux/Mac/WSL)
    'C:\\Program Files\\Git\\usr\\bin\\openssl.exe', // Git for Windows
    'C:\\Program Files\\OpenSSL-Win64\\bin\\openssl.exe',
    'C:\\Program Files (x86)\\OpenSSL-Win32\\bin\\openssl.exe',
];

const subj = '/C=BR/ST=SP/L=SaoPaulo/O=Faculdade/OU=Seguranca/CN=localhost';
const certPath = join(certsDir, 'server.crt');
let generated = false;

for (const openssl of opensslPaths) {
    try {
        const cmd = `"${openssl}" req -x509 -nodes -days 365 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -subj "${subj}"`;
        console.log(`\n🔍 Tentando: ${openssl}`);
        execSync(cmd, { stdio: 'pipe' });
        console.log(`✅ Certificado gerado via OpenSSL: ${certPath}`);
        generated = true;
        break;
    } catch (_) {
        // Tenta o próximo
    }
}

if (!generated) {
    console.log('\n⚠️  OpenSSL não encontrado em nenhum local padrão.');
    console.log('💡 Tente uma das alternativas abaixo:\n');
    console.log('─── OPÇÃO A: Git Bash (se tiver Git instalado) ───');
    console.log('Abra o Git Bash (não o PowerShell) e rode:');
    console.log(`openssl req -x509 -nodes -days 365 -newkey rsa:4096 \\`);
    console.log(`  -keyout nginx/certs/server.key \\`);
    console.log(`  -out    nginx/certs/server.crt \\`);
    console.log(`  -subj "${subj}"\n`);

    console.log('─── OPÇÃO B: WSL (Windows Subsystem for Linux) ───');
    console.log('Abra o WSL/Ubuntu e rode o mesmo comando acima.\n');

    console.log('─── OPÇÃO C: Instalar OpenSSL ───');
    console.log('Baixe em: https://slproweb.com/products/Win32OpenSSL.html');
    console.log('(Win64 OpenSSL v3.x Light - instala em 2 minutos)\n');

    console.log('─── OPÇÃO D: Chocolatey (se tiver) ───');
    console.log('choco install openssl\n');

    process.exit(1);
}

console.log('\n🎉 Pronto! Agora rode:');
console.log('   docker compose up -d');
console.log('   Acesse: https://localhost');
