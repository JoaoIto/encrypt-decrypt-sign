// Em um cenário de produção escalável usaríamos Redis ou Elasticsearch.
// Para este Monorepo Didático, salvamos globalmente na memória da VM.
export const logsHistory = [];

export function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[LOGGER] ${timestamp}: ${message}`;
    console.log(formatted);
    logsHistory.push(formatted);

    // Evita Memory Leak básico mantendo só os últimos 50 logs por VM.
    if (logsHistory.length > 50) logsHistory.shift();
}
