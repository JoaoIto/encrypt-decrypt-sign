# 🎓 Criptoanálise na Prática: A Cifra de Substituição

> **Ferramenta Local:** `npm run demo`
> **Localização do Código:** `/demo.js` (Raiz)
> **Pacote Matemático Utilizado:** `encrypt-decrypt-sign`

Este documento detalha o script de terminal interativo construído para fins de educação e demonstração em sala de aula de **Engenharia de Software / Segurança da Informação**. O aplicativo ilustra visualmente, em *slow motion* (câmera lenta), o comportamento estrutural do algoritmo clássico da Cifra de César (Substituição).

---

## 1. O Algoritmo de Substituição 🧮

A cifra de substituição é uma das formas mais fundamentais e primitivas de criptografia. Ao invés de usar blocos complexos ou chaves derivacionais elípticas (como RSA), ela opera estritamente trocando o valor numérico (ASCII Code) original de cada caractere por um valor fixo consecutivo `N` posições à frente no dicionário de bytes.

### 1.1 Matemática da Empacotadora (Cifrar)
O pacote `encrypt-decrypt-sign` invocado pelo `demo.js` possui um motor puro de *Caesar Cipher*. Na aula presencial usamos **SHIFT = 4**.

```javascript
// Exemplo didático do "Motor de Cifragem" da nossa Library
export function encryptCaesar(text, shift = 4) {
    let result = "";
    for (let i = 0; i < text.length; i++) {
        let charCode = text.charCodeAt(i);
        
        // Aplica o Shift empurrando a letra no catálogo universal
        result += String.fromCharCode(charCode + shift);
    }
    return result;
}
```
**Análise de Complexidade (Big-O):**
A operação possui complexidade **O(n)** de Tempo (Linear) - sendo *n* o número de caracteres da string (o loop lê a string exatamente 1 vez ponta-a-ponta). Sua complexidade de Espaço / RAM também é **O(n)**, dado que concatenamos uma nova string de mesmo tamanho para a memória de resultado.

### 1.2 Matemática da Reversão (Decifrar)
O destinatário só é capaz de recuperar da mesma forma, realizando a subtração na tabela (engenharia reversa do Shift).

```javascript
export function decryptCaesar(text, shift = 4) {
    let result = "";
    for (let i = 0; i < text.length; i++) {
        let charCode = text.charCodeAt(i);
        
        // Aplica a retração da letra no catálogo universal
        result += String.fromCharCode(charCode - shift);
    }
    return result;
}
```

---

## 2. A Camada de Apresentação (CLI Engine) 🖥️

O arquivo principal `demo.js` foi configurado estritamente como um **Teatro CLI** para não exigir que a turma rode servidores Web inteiros (Fastify).

No projeto oficial, as VMs interagem via porta `HTTP 300x` usando chamadas Assíncronas Fastify. Mas na aula usamos **promises puras do Node.js** associadas ao leitor local de `stdout` para injetar pausas manuais. Isso recria nos pixels do Windows o rastreamento individual do processamento em *tempo simulado* (Processamento Slow-Motion):

### 2.1 Efeito *Slow Motion* Visual
Para permitir que o aluno faça criptoanálise em tempo real enquanto a conta acontece, empacotamos o script usando o `Promise(setTimeout)`. 

```javascript
// Utilitário de suspensão da Thread Principal (Efeito Hacker Movie)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function slowPrint(text, speedMs = 30) {
    for (const char of text) {
        process.stdout.write(char);
        await sleep(speedMs); // Dorme por X milisegundos a cada LETRA
    }
    console.log(); 
}
```

### 2.2 Rastreamento de Rede e VMs Virtuais 🌐

Quando você rodar Atuar como Remetente/Destinatário, vai deparar com os seguintes elementos na tela:
1. **Host IP:** O programa rastreia a Camada de Rede (Network Interface) e descobre ativamente o IP Local `192.168.x.x` que disparou o Payload, para emular as VMs do servidor de produção e fixar seu computador como Ponto A da rede.
2. **Raw Output:** Cifra isolada com charCodes exibidos (`'A' (CODE: 65) -> Shift +4 -> 'E' (CODE:69)`) validando a matemática da Seção 1 deste documento em tempo real. 

```javascript
for (let i = 0; i < plainText.length; i++) {
    const char = plainText[i];
    const cipherChar = encryptCaesar(char, 4); // Cifra 1 pino de forma isolada do loop
    
    // Imprime passo-a-passo (Criptoanálise manual)
    await slowPrint(` Byte[0${i}]: '${char}' (CODE:${char.charCodeAt(0)}) -> Shift +4 -> '${cipherChar}'`);
    await sleep(200); // 1/5 de segundo de delay após gerar O BYTE e antes do próximo
}
```

## 3. Guia da Dinâmica Prática (Para Aula)

1. Conectem 2 Computadores da Sala. 
2. No `Computador A`, abram o projeto e digitem `npm run demo`.
3. Escolham opção `[1]` e informem a mensagem. O computador irá gerar a matemática em câmera lenta.
4. O Aluno Copia a linha de texto vermelha (`Texto Cifrado`).
5. O Aluno B manda este texto para o `Computador B `(Via Whatsapp, Discord...).
6. No `Computador B`, abre-se o `npm run demo` digitando a `[2]`. Colam este lixo cifrado no console e assistem a reversão matemática da cifra ocorrendo pino por pino até decodificar a frase.

*(Não há risco de dependência HTTP ou CORS para a rede restrita do Laboratório da Instituição, pois não roda sob WebServers como a parte 1 do trabalho, roda primariamente direto nas artérias do Engine Node V8 local).*
