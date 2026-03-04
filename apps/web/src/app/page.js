'use client';

import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: 'client', position: { x: 50, y: 300 }, data: { label: 'Client (Sender)' }, className: 'glass-panel p-4' },
  { id: 'sym-vm', position: { x: 400, y: 100 }, data: { label: 'Symmetric Crypto VM' }, className: 'glass-panel p-4' },
  { id: 'asym-vm', position: { x: 400, y: 300 }, data: { label: 'Asymmetric Crypto VM' }, className: 'glass-panel p-4' },
  { id: 'hash-vm', position: { x: 400, y: 500 }, data: { label: 'Hash & Auth VM' }, className: 'glass-panel p-4' },
  { id: 'receiver', position: { x: 800, y: 300 }, data: { label: 'Receiver' }, className: 'glass-panel p-4' },
];

const initialEdges = [
  { id: 'e-c-s', source: 'client', target: 'sym-vm', animated: false },
  { id: 'e-s-r', source: 'sym-vm', target: 'receiver', animated: false },
  { id: 'e-c-a', source: 'client', target: 'asym-vm', animated: false },
  { id: 'e-a-r', source: 'asym-vm', target: 'receiver', animated: false },
  { id: 'e-c-h', source: 'client', target: 'hash-vm', animated: false },
  { id: 'e-h-r', source: 'hash-vm', target: 'receiver', animated: false },
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState([]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const simulateExchange = async (type) => {
    const timeStart = performance.now();
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Inicializando ${type.toUpperCase()} VM...`]);

    // Animar borda de entrada
    const routeInId = type === 'sym' ? 'e-c-s' : type === 'asym' ? 'e-c-a' : 'e-c-h';
    const routeOutId = type === 'sym' ? 'e-s-r' : type === 'asym' ? 'e-a-r' : 'e-h-r';
    const port = type === 'sym' ? 3003 : type === 'asym' ? 3004 : 3002;

    setEdges(eds => eds.map(e => e.id === routeInId ? { ...e, animated: true, style: { stroke: '#3b82f6', strokeWidth: 4 } } : e));

    try {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Conectando: http://localhost:${port}`]);

      // Simular chamada real (por agora bate no healthcheck da VM Fastify)
      const res = await fetch(`http://localhost:${port}/`).catch(() => null);
      const timeEnd = performance.now();
      const latency = (timeEnd - timeStart).toFixed(2);

      if (res && res.ok) {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ Sucesso! Tempo de resposta: ${latency}ms`]);
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Payload Original: "${message || 'vazio'}"`]);
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Encriptando dados na VM...`]);

        // Animar borda de saída
        setEdges(eds => eds.map(e => {
          if (e.id === routeInId) return { ...e, animated: false, style: {} };
          if (e.id === routeOutId) return { ...e, animated: true, style: { stroke: '#10b981', strokeWidth: 4 } };
          return e;
        }));

        setTimeout(() => {
          setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Receptor recebeu e processou o Token final.`]);
          setEdges(eds => eds.map(e => e.id === routeOutId ? { ...e, animated: false, style: {} } : e));
        }, 1000);
      } else {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ Erro: VM offline. Suba o ambiente com pnpm run dev`]);
        setEdges(eds => eds.map(e => e.id === routeInId ? { ...e, animated: false, style: { stroke: '#ef4444' } } : e));
      }

    } catch (error) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ Falha catastrófica: Rede inatingível`]);
      setEdges(eds => eds.map(e => e.id === routeInId ? { ...e, animated: false, style: { stroke: '#ef4444' } } : e));
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* Sidebar Controls */}
      <div style={{ width: '380px', background: 'var(--node-bg)', padding: '2rem', backdropFilter: 'blur(20px)', borderRight: '1px solid var(--node-border)', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 10 }}>
        <h1 className="text-gradient" style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Crypto Visualizer</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
          Monorepo Dashboard. Envie requisições reais para as VMs independentes e veja o fluxo de dados em tempo real.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          <label style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>Carga útil (Payload):</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite a mensagem secreta..."
            style={{ padding: '12px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid #334155', color: 'white', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '1rem' }}>
          <button className="btn-primary" onClick={() => simulateExchange('sym')}>🔒 Testar VM: Cifra Simétrica</button>
          <button className="btn-primary" style={{ background: '#8b5cf6' }} onClick={() => simulateExchange('asym')}>🔑 Testar VM: Chave Assimétrica</button>
          <button className="btn-primary" style={{ background: '#ec4899' }} onClick={() => simulateExchange('hash')}>🛡️ Testar VM: Hashing/Auth</button>
        </div>

        <div style={{ flex: 1, marginTop: '20px', background: 'rgba(0,0,0,0.5)', borderRadius: '12px', padding: '15px', overflowY: 'auto', border: '1px solid #334155', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
          <h3 style={{ fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
            Network Logs Real-Time
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logs.map((L, i) => <span key={i} style={{ fontSize: '12px', color: L.includes('❌') ? '#ef4444' : '#34d399', fontFamily: 'SFMono-Regular, Consolas, monospace', lineHeight: '1.4' }}>{L}</span>)}
            {logs.length === 0 && <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Aguardando interação do usuário...</span>}
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          style={{ background: 'transparent' }}
        >
          <Controls style={{ background: 'var(--node-bg)', borderRadius: '8px', border: '1px solid var(--node-border)', fill: 'white' }} />
          <MiniMap style={{ background: 'var(--node-bg)', maskColor: 'rgba(0,0,0,0.6)', border: '1px solid var(--node-border)', borderRadius: '8px' }} />
          <Background gap={20} size={1} color="#334155" />
        </ReactFlow>
      </div>
    </div>
  );
}
