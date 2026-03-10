'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { encryptCaesar, decryptCaesar, encryptCaesarCascade, decryptCaesarCascade } from 'encrypt-decrypt-sign';

export default function ClassroomVisualDemo() {
    const [plainText, setPlainText] = useState('');
    const [senderLogs, setSenderLogs] = useState([]);
    const [receiverLogs, setReceiverLogs] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [cipherResult, setCipherResult] = useState('');
    const [plainResult, setPlainResult] = useState('');
    const [layers, setLayers] = useState(3);

    // Estados Visuais Avançados
    const [senderMatrix, setSenderMatrix] = useState([]);
    const [receiverMatrix, setReceiverMatrix] = useState([]);
    const [activeLayerA, setActiveLayerA] = useState(0);
    const [activeLayerB, setActiveLayerB] = useState(0);
    const [activeIndexA, setActiveIndexA] = useState(-1);
    const [activeIndexB, setActiveIndexB] = useState(-1);
    const [isTransposingA, setIsTransposingA] = useState(false);
    const [isTransposingB, setIsTransposingB] = useState(false);
    // Animação da bolinha no centro
    const [packetPosition, setPacketPosition] = useState(0);
    const [packetVisible, setPacketVisible] = useState(false);

    const logContainerSenderRef = useRef(null);
    const logContainerReceiverRef = useRef(null);

    const CAESAR_SHIFT = 4;

    const scrollToBottom = (containerRef) => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom(logContainerSenderRef);
    }, [senderLogs]);

    useEffect(() => {
        scrollToBottom(logContainerReceiverRef);
    }, [receiverLogs]);

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

        // Reset Visuals
        setSenderMatrix(plainText.split(''));
        setReceiverMatrix([]);
        setActiveLayerA(0);
        setActiveLayerB(0);
        setActiveIndexA(-1);
        setActiveIndexB(-1);
        setIsTransposingA(false);
        setIsTransposingB(false);

        const ipAddress = "192.168.1.104"; // Simulado visualmente
        const receiverIp = "192.168.1.105";

        // --- TERMINAL A (EMPACOTANDO) ---
        addLog('A', `Máquina Host Iniciada (IP: ${ipAddress})`, 'system');
        addLog('A', `Lendo Input do Usuário: "${plainText}"`, 'info');
        await sleep(800);
        addLog('A', `Injetando Algoritmo: Cifra de César com ${layers} Camadas (BaseShift=+${CAESAR_SHIFT})`, 'system');
        await sleep(800);

        let currentText = plainText;
        let matrixState = plainText.split('');

        for (let layer = 1; layer <= layers; layer++) {
            setActiveLayerA(layer);
            addLog('A', `[>> INICIANDO CAMADA ${layer}/${layers}]`, 'system');
            const dynamicShift = CAESAR_SHIFT * layer;
            let temp = "";

            for (let i = 0; i < currentText.length; i++) {
                setActiveIndexA(i);
                const char = currentText[i];
                const charCode = char.charCodeAt(0);
                const positionalShift = dynamicShift + (i % 3);
                const cipherChar = String.fromCharCode(charCode + positionalShift);
                temp += cipherChar;

                // Atualiza a matriz visual um bloco por vez
                matrixState = [...matrixState];
                matrixState[i] = cipherChar;
                setSenderMatrix([...matrixState]);

                addLog('A', `L${layer} | Byte[0${i}]: '${char}' (Code:${charCode}) -> Shift +${positionalShift} -> '${cipherChar}'`, 'data');
                setCipherResult(temp);
                await sleep(150); // Slow motion matemático
            }

            setActiveIndexA(-1);
            addLog('A', `[>> EMBARALHANDO POSIÇÕES (Transposição)...]`, 'info');

            // Efeito visual de Transposição
            setIsTransposingA(true);
            await sleep(400); // tempo pro CSS rodar
            currentText = temp.split("").reverse().join("");
            matrixState = currentText.split('');
            setSenderMatrix(matrixState);
            setIsTransposingA(false);

            setCipherResult(currentText);
            addLog('A', `[Resultado Camada ${layer}]: ${currentText}`, 'system');
            await sleep(400);
        }

        setActiveLayerA(0);
        let encryptedStr = currentText;
        addLog('A', `Criptografia Multi-Layer concluída com sucesso! Payload Gerado.`, 'success');
        await sleep(600);
        addLog('A', `Abrindo socket HTTP POST para [${receiverIp}:3000/decrypt]...`, 'system');
        await sleep(500);

        // --- ANIMAÇÃO DE REDE (VIAGEM DE DATOS) ---
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
        addLog('B', `Inciando Reversão Algébrica (Camadas=${layers}, BaseShift=-${CAESAR_SHIFT})...`, 'system');
        await sleep(800);

        let currentTextDec = encryptedStr;
        let matrixDecState = encryptedStr.split('');
        setReceiverMatrix(matrixDecState);

        for (let layer = layers; layer >= 1; layer--) {
            setActiveLayerB(layer);
            addLog('B', `[>> DESFAZENDO CAMADA ${layer}/${layers}]`, 'system');

            addLog('B', `[>> REVERTENDO TRANSPOSIÇÃO DE POSIÇÕES...]`, 'info');

            // Reversão Visual
            setIsTransposingB(true);
            await sleep(400);
            currentTextDec = currentTextDec.split("").reverse().join("");
            matrixDecState = currentTextDec.split('');
            setReceiverMatrix(matrixDecState);
            setIsTransposingB(false);

            setPlainResult(currentTextDec);
            await sleep(300);

            const dynamicShift = CAESAR_SHIFT * layer;
            let temp = "";

            for (let i = 0; i < currentTextDec.length; i++) {
                setActiveIndexB(i);
                const char = currentTextDec[i];
                const charCode = char.charCodeAt(0);
                const positionalShift = dynamicShift + (i % 3);
                const plainChar = String.fromCharCode(charCode - positionalShift);
                temp += plainChar;

                // Atualiza visual decodificando
                matrixDecState = [...matrixDecState];
                matrixDecState[i] = plainChar;
                setReceiverMatrix([...matrixDecState]);

                addLog('B', `L${layer} | Decode[0${i}]: '${char}' (Code:${charCode}) -> Shift -${positionalShift} -> '${plainChar}'`, 'data');
                setPlainResult(temp);
                await sleep(150); // Slow motion da Criptoanálise
            }

            setActiveIndexB(-1);
            currentTextDec = temp;
            addLog('B', `[Recuperação Camada ${layer}]: ${currentTextDec}`, 'system');
            await sleep(400);
        }

        setActiveLayerB(0);
        let decodedStr = currentTextDec;
        addLog('B', `Descriptografia Multi-Layer bem sucedida! Arquivo reconstruído.`, 'success');
        setIsSending(false);
    };

    const LogViewer = ({ logs, containerRef }) => (
        <div ref={containerRef} style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', border: '1px solid #334155', borderRadius: '0.5rem', padding: '1rem', overflowY: 'auto', scrollBehavior: 'smooth', fontFamily: 'monospace', fontSize: '0.8125rem', lineHeight: 1.6, position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.25rem', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.5)', height: '400px' }}>
            <div style={{ color: '#64748b', marginBottom: '0.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>-- Console Output --</div>
            {logs.map((L, i) => {
                let color = '#cbd5e1'; // default slate-300
                let fontWeight = 'normal';

                if (L.type === 'system') { color = '#60a5fa'; fontWeight = 'bold'; } // blue-400
                if (L.type === 'data') { color = '#fde047'; } // yellow-300
                if (L.type === 'success') { color = '#34d399'; fontWeight = 'bold'; } // emerald-400
                if (L.type === 'error') { color = '#f87171'; } // red-400

                return (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem' }}>
                        <span style={{ color: '#475569' }}>[{L.time}]</span>
                        <span style={{ color, fontWeight }}>{L.msg}</span>
                    </div>
                );
            })}
        </div>
    );

    const DataMatrix = ({ matrix, activeIndex, isTransposing, themeColor }) => {
        if (!matrix || matrix.length === 0) return null;

        return (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '0.75rem', border: `1px solid ${themeColor}`, perspective: '1000px', minHeight: '4.5rem' }}>
                {matrix.map((char, i) => {
                    const isActive = activeIndex === i;
                    return (
                        <div
                            key={i}
                            style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isActive ? themeColor : 'rgba(30, 41, 59, 0.8)',
                                color: isActive ? '#020617' : 'white',
                                fontWeight: 'bold',
                                fontSize: '1.25rem',
                                borderRadius: '0.5rem',
                                border: `1px solid ${isActive ? 'transparent' : 'rgba(148, 163, 184, 0.3)'}`,
                                boxShadow: isActive ? `0 0 15px ${themeColor}, 0 0 30px ${themeColor} inset` : 'none',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isTransposing ? 'rotateY(180deg) scale(0.9)' : (isActive ? 'scale(1.15) translateY(-3px)' : 'scale(1)'),
                                transformStyle: 'preserve-3d',
                                zIndex: isActive ? 10 : 1
                            }}
                        >
                            {char}
                        </div>
                    );
                })}
            </div>
        );
    };

    const LayerIndicator = ({ totalLayers, activeLayer, themeColor }) => {
        if (totalLayers <= 1) return null;
        return (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Camadas:</span>
                {Array.from({ length: totalLayers }).map((_, i) => {
                    const layerNum = i + 1;
                    const isActive = activeLayer === layerNum;
                    const isDone = activeLayer > layerNum || (activeLayer === 0 && !isSending && plainResult !== ''); // Aproximação do estado

                    let bg = 'rgba(30, 41, 59, 0.5)';
                    if (isActive) bg = themeColor;
                    if (isDone) bg = `${themeColor}66`; // 40% opacity hex

                    return (
                        <div key={i} style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: bg, transition: 'all 0.4s ease', boxShadow: isActive ? `0 0 8px ${themeColor}` : 'none' }} />
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#020617', color: '#e2e8f0', display: 'flex', flexDirection: 'column', padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>

            {/* Header */}
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #1e293b', backdropFilter: 'blur(12px)' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🎓 Criptoanálise na Prática</h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>Visualização em <strong style={{ color: 'white' }}>Slow-Motion</strong> do motor matemático da Cifra de Substituição.</p>
                </div>
                <Link href="/" style={{ padding: '0.625rem 1.25rem', backgroundColor: '#1e293b', color: 'white', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.75rem', transition: 'all 0.2s', border: '1px solid #334155' }}>
                    ← Voltar ao Dashboard Principal
                </Link>
            </header>

            {/* Main UI Area */}
            <div style={{ display: 'flex', flex: 1, gap: '1.5rem', alignItems: 'stretch', position: 'relative' }}>

                {/* LADO A: Remetente */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #1e293b', position: 'relative', zIndex: 10, backdropFilter: 'blur(12px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#34d399', margin: 0 }}>VM: Remetente (Ponto A)</h2>
                        <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderRadius: '9999px', fontSize: '0.75rem', fontFamily: 'monospace', border: '1px solid rgba(16, 185, 129, 0.2)' }}>IP: 192.168.1.104</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={plainText}
                            onChange={e => setPlainText(e.target.value)}
                            placeholder="Digite a mensagem em texto claro..."
                            disabled={isSending}
                            style={{ flex: 1, backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'white', outline: 'none', opacity: isSending ? 0.5 : 1 }}
                        />
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={layers}
                            onChange={e => setLayers(parseInt(e.target.value) || 1)}
                            disabled={isSending}
                            style={{ width: '4rem', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '0.75rem', padding: '0.75rem', fontSize: '0.875rem', color: 'white', outline: 'none', textAlign: 'center', opacity: isSending ? 0.5 : 1 }}
                            title="Número de Camadas"
                        />
                        <button
                            onClick={runSimulation}
                            disabled={isSending || !plainText}
                            style={{ backgroundColor: '#059669', color: 'white', fontWeight: 'bold', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none', cursor: (isSending || !plainText) ? 'not-allowed' : 'pointer', opacity: (isSending || !plainText) ? 0.5 : 1, transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                        >
                            Criptografar e Enviar 🚀
                        </button>
                    </div>

                    <LayerIndicator totalLayers={layers} activeLayer={activeLayerA} themeColor="#10b981" />
                    <DataMatrix matrix={senderMatrix} activeIndex={activeIndexA} isTransposing={isTransposingA} themeColor="#10b981" />

                    <LogViewer logs={senderLogs} containerRef={logContainerSenderRef} />

                    {cipherResult && (
                        <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: 'rgba(69, 10, 10, 0.3)', border: '1px solid rgba(127, 29, 29, 0.5)', borderRadius: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(252, 165, 165, 0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>Payload Cifrado Final:</span>
                            <span style={{ fontFamily: 'monospace', color: '#f87171', fontSize: '1.125rem', letterSpacing: '0.1em' }}>{cipherResult}</span>
                        </div>
                    )}
                </div>

                {/* CABLE / CONNECTION EMULATION */}
                <div style={{ width: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <div style={{ position: 'absolute', width: '100%', height: '2px', backgroundColor: '#334155', top: '50%', transform: 'translateY(-50%)' }}></div>
                    {/* Packet Animation */}
                    <div
                        style={{
                            position: 'absolute',
                            height: '2rem',
                            width: '2rem',
                            backgroundColor: '#3b82f6',
                            borderRadius: '9999px',
                            boxShadow: '0 0 20px #3b82f6, 0 0 40px rgba(59, 130, 246, 0.5)',
                            zIndex: 20,
                            transition: 'left 50ms linear',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            left: `${packetPosition}%`,
                            transform: 'translate(-50%, -50%)',
                            top: '50%',
                            opacity: packetVisible ? 1 : 0
                        }}
                    >
                        <span style={{ fontSize: '0.625rem' }}>📦</span>
                    </div>
                </div>

                {/* LADO B: Destinatário */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #1e293b', position: 'relative', zIndex: 10, backdropFilter: 'blur(12px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#60a5fa', margin: 0 }}>VM: Receptor (Ponto B)</h2>
                        <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderRadius: '9999px', fontSize: '0.75rem', fontFamily: 'monospace', border: '1px solid rgba(59, 130, 246, 0.2)' }}>IP: 192.168.1.105</span>
                    </div>

                    <div style={{ height: '3.125rem', display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#94a3b8', padding: '0 1rem', backgroundColor: 'rgba(2, 6, 23, 0.5)', borderRadius: '0.75rem', border: '1px dashed #1e293b' }}>
                        Aguardando pacote na porta 3000...
                    </div>

                    <LayerIndicator totalLayers={layers} activeLayer={activeLayerB} themeColor="#3b82f6" />
                    <DataMatrix matrix={receiverMatrix} activeIndex={activeIndexB} isTransposing={isTransposingB} themeColor="#3b82f6" />

                    <LogViewer logs={receiverLogs} containerRef={logContainerReceiverRef} />

                    {plainResult && (
                        <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: 'rgba(23, 37, 84, 0.3)', border: '1px solid rgba(30, 58, 138, 0.5)', borderRadius: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(147, 197, 253, 0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>Conteúdo Decodificado com Sucesso:</span>
                            <span style={{ fontFamily: 'monospace', color: '#60a5fa', fontSize: '1.125rem' }}>{plainResult}</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
