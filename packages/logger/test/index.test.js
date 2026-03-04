import { describe, it, expect, beforeEach } from 'vitest';
import { log, logsHistory } from '../src/index.js';

describe('Global Memory Logger', () => {
    beforeEach(() => {
        // Limpar RAM mock antes de cada teste
        logsHistory.length = 0;
    });

    it('Should append logs to global memory sequence', () => {
        const msg = "Testing Logger";
        log(msg);
        expect(logsHistory.length).toBe(1);
        expect(logsHistory[0]).toContain(msg);
        expect(logsHistory[0]).toContain("[LOGGER]");
    });

    it('Should respect Garbage Collector limit of 50 logs queue to prevent Memory Leak', () => {
        // Enchemos 55 logs brutos
        for (let i = 0; i < 55; i++) {
            log(`Cycle ${i}`);
        }

        // Verifica se cortou o limite máximo na ram Array
        expect(logsHistory.length).toBe(50);
        // O primeiro registro da nova fila será o item [5], provando shifting array
        expect(logsHistory[0]).toContain("Cycle 5");
    });
});
