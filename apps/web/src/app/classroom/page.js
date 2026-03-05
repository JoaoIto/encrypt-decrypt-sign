'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { encryptCaesar, decryptCaesar } from 'encrypt-decrypt-sign';

export default function ClassroomVisualDemo() {
    const [plainText, setPlainText] = useState('');
    const [senderLogs, setSenderLogs] = useState([]);
    const [receiverLogs, setReceiverLogs] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [cipherResult, setCipherResult] = useState('');
    const [plainResult, setPlainResult] = useState('');
    // Animação da bolinha no centro
    const [packetPosition, setPacketPosition] = useState(0);
    const [packetVisible, setPacketVisible] = useState(false);

    const endRefSender = useRef(null);
    const endRefReceiver = useRef(null);

    const CAESAR_SHIFT = 4;

    const scrollToBottom = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(() => scrollToBottom(endRefSender), [senderLogs]);
    useEffect(() => scrollToBottom(endRefReceiver), [receiverLogs]);

    const addLog = (side, msg, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const formatted = { time: timestamp, msg, type };
        if (side === 'A') setSenderLogs(prev => [...prev, formatted]);
        else setReceiverLogs(prev => [...prev, formatted]);
    };

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const runSimulation = async () => {
        if (!plainText.trim() || isSending) return;
        setIsSending(true);
        setSenderLogs([]);
        setReceiverLogs([]);
        setCipherResult('');
        setPlainResult('');
        setPacketVisible(false);
        setPacketPosition(0);

        const ipAddress = "192.168.1.104"; // Simulado visualmente
        const receiverIp = "192.168.1.105";

        // --- TERMINAL A (EMPACOTANDO) ---
        addLog('A', `Máquina Host Iniciada (IP: ${ipAddress})`, 'system');
        addLog('A', `Lendo Input do Usuário: "${plainText}"`, 'info');
        await sleep(800);
        addLog('A', `Injetando Algoritmo: Cifra de César (Shift=+${CAESAR_SHIFT})`, 'system');
        await sleep(800);

        let encryptedStr = "";
        for (let i = 0; i < plainText.length; i++) {
            const char = plainText[i];
            const code = char.charCodeAt(0);
            const cipherChar = encryptCaesar(char, CAESAR_SHIFT);
            encryptedStr += cipherChar;

            addLog('A', `Byte[0${i}]: '${char}' (Code:${code}) -> Shift +4 -> '${cipherChar}'`, 'data');
            setCipherResult(encryptedStr);
            await sleep(400); // Slow motion matemático
        }

        addLog('A', `Criptografia concluída com sucesso! Payload Gerado.`, 'success');
        await sleep(600);
        addLog('A', `Abrindo socket HTTP POST para [${receiverIp}:3000/decrypt]...`, 'system');
        await sleep(500);

        // --- ANIMAÇÃO DE REDE (VIAGEM DE DADOS) ---
        setPacketVisible(true);
        addLog('A', `>> Enviando Pacote (Data: ${encryptedStr})`, 'info');

        // Anime de 0% a 100%
        for (let move = 0; move <= 100; move += 5) {
            setPacketPosition(move);
            await sleep(50);
        }
        setPacketVisible(false);

        // --- TERMINAL B (DESEMPACOTANDO) ---
        addLog('B', `Conexão HTTP Entrante Recebida de [${ipAddress}]`, 'system');
        await sleep(800);
        addLog('B', `Lendo Conteúdo do Body: {"encrypted": "${encryptedStr}"}`, 'info');
        await sleep(800);
        addLog('B', `Inciando Reversão Algébrica (Shift=-${CAESAR_SHIFT})...`, 'system');
        await sleep(800);

        let decodedStr = "";
        for (let i = 0; i < encryptedStr.length; i++) {
            const char = encryptedStr[i];
            const code = char.charCodeAt(0);
            const plainChar = decryptCaesar(char, CAESAR_SHIFT);
            decodedStr += plainChar;

            addLog('B', `Decode[0${i}]: '${char}' (Code:${code}) -> Shift -4 -> '${plainChar}'`, 'data');
            setPlainResult(decodedStr);
            await sleep(400); // Slow motion da Criptoanálise
        }

        addLog('B', `Descriptografia bem sucedida! Arquivo reconstruído.`, 'success');
        setIsSending(false);
    };

    const LogViewer = ({ logs, refObj }) => (
        <div className="flex-1 bg-black/60 border border-slate-700 rounded-lg p-4 overflow-y-auto font-mono text-[13px] leading-relaxed relative flex flex-col gap-1 shadow-inner h-[400px]">
            <div className="text-slate-500 mb-2 border-b border-slate-800 pb-2">-- Console Output --</div>
            {logs.map((L, i) => {
                let color = 'text-slate-300';
                if (L.type === 'system') color = 'text-blue-400 font-bold';
                if (L.type === 'data') color = 'text-yellow-300';
                if (L.type === 'success') color = 'text-emerald-400 font-bold';
                if (L.type === 'error') color = 'text-red-400';

                return (
                    <div key={i} className="flex gap-3">
                        <span className="text-slate-600">[{L.time}]</span>
                        <span className={color}>{L.msg}</span>
                    </div>
                );
            })}
            <div ref={refObj} />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col p-6 font-sans">

            {/* Header */}
            <header className="mb-8 flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800 glass-panel">
                <div>
                    <h1 className="text-3xl font-bold text-gradient mb-2">🎓 Criptoanálise na Prática</h1>
                    <p className="text-slate-400 text-sm">Visualização em <strong className="text-white">Slow-Motion</strong> do motor matemático da Cifra de Substituição.</p>
                </div>
                <Link href="/" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sm font-semibold rounded-xl transition-all shadow border border-slate-700">
                    ← Voltar ao Dashboard Principal
                </Link>
            </header>

            {/* Main UI Area */}
            <div className="flex flex-1 gap-6 items-stretch relative">

                {/* LADO A: Remetente */}
                <div className="flex-1 flex flex-col gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 relative z-10 glass-panel">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold text-emerald-400">VM: Remetente (Ponto A)</h2>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-mono border border-emerald-500/20">IP: 192.168.1.104</span>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={plainText}
                            onChange={e => setPlainText(e.target.value)}
                            placeholder="Digite a mensagem em texto claro..."
                            disabled={isSending}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                        <button
                            onClick={runSimulation}
                            disabled={isSending || !plainText}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50"
                        >
                            Criptografar & Enviar 🚀
                        </button>
                    </div>

                    <LogViewer logs={senderLogs} refObj={endRefSender} />

                    {cipherResult && (
                        <div className="mt-2 p-4 bg-red-950/30 border border-red-900/50 rounded-xl">
                            <span className="text-xs text-red-300/70 uppercase tracking-widest font-bold block mb-1">Payload Cifrado Final:</span>
                            <span className="font-mono text-red-400 text-lg tracking-widest">{cipherResult}</span>
                        </div>
                    )}
                </div>

                {/* CABLE / CONNECTION EMULATION */}
                <div className="w-16 flex items-center justify-center relative">
                    <div className="absolute w-full h-[2px] bg-slate-700 top-1/2 -translate-y-1/2"></div>
                    {/* Packet Animation */}
                    <div
                        className="absolute h-8 w-8 bg-blue-500 rounded-full shadow-[0_0_20px_blue] z-20 transition-all duration-75 flex items-center justify-center"
                        style={{
                            left: `${packetPosition}%`,
                            transform: 'translate(-50%, -50%)',
                            top: '50%',
                            opacity: packetVisible ? 1 : 0
                        }}
                    >
                        <span className="text-[10px]">📦</span>
                    </div>
                </div>

                {/* LADO B: Destinatário */}
                <div className="flex-1 flex flex-col gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 relative z-10 glass-panel">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold text-blue-400">VM: Receptor (Ponto B)</h2>
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-mono border border-blue-500/20">IP: 192.168.1.105</span>
                    </div>

                    <div className="h-[50px] flex items-center text-sm text-slate-400 px-4 bg-slate-950/50 rounded-xl border border-slate-800 border-dashed">
                        Aguardando pacote na porta 3000...
                    </div>

                    <LogViewer logs={receiverLogs} refObj={endRefReceiver} />

                    {plainResult && (
                        <div className="mt-2 p-4 bg-blue-950/30 border border-blue-900/50 rounded-xl">
                            <span className="text-xs text-blue-300/70 uppercase tracking-widest font-bold block mb-1">Conteúdo Decodificado com Sucesso:</span>
                            <span className="font-mono text-blue-400 text-lg">{plainResult}</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
