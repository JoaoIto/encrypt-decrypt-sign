# 🎓 Criptoanálise na Prática: A Cifra de Substituição

> **Ferramenta Local:** `npm run demo`
> **Localização do Código:** `/demo.js` (Raiz)
> **Pacote Matemático Utilizado:** `encrypt-decrypt-sign`

Este documento detalha o script de terminal interativo construído para fins de educação e demonstração em sala de aula de **Engenharia de Software / Segurança da Informação**. O aplicativo ilustra visualmente, em *slow motion* (câmera lenta), o comportamento estrutural do algoritmo clássico da Cifra de César (Substituição).

---

## 1. A Matemática da Cifra de Substituição 🧮

A cifra de substituição é uma das mecânicas mais clássicas e antigas da criptografia (conhecida desde o Império Romano como Cifra de César). A premissa central dessa modalidade é o seguinte fato: **computadores não entendem letras, apenas números**. 

Para o sistema computadorizado compreender e exibir a letra `'A'`, ele recorre à Tabela ASCII (ou Unicode), um dicionário global em que a letra `'A'` é estritamente fixada e mapeada como o número Inteiro `65`. 

A matemática de cifragem é puramente baseada em aplicar uma manipulação algébrica (uma soma simples) sobre este número inteiro.

### 1.1 O Cálculo e a Lógica (Modo de Envio)

Para cifrar um caractere $x$, utilizamos uma chave paramétrica numérica em hardcode, chamada de **Shift** (deslocamento). A fórmula atômica da cifra é:

$$ C(x) = x + \text{Shift} $$

> **Exemplo Prático da Aula (Shift = 4):**
> 1. Se o aluno digitar a letra `'A'`, o sistema extrai instantaneamente seu código numérico base: `65`.
> 2. O processador aplica a fórmula com deslocamento fixo de 4: `65 + 4 = 69`.
> 3. Em seguida, o sistema procura na tabela binária: Quem é o caractere de ID `69`? A resposta é a letra `'E'`.
> 4. Portanto, a letra original `'A'` virou o lixo cibernético mascarado de `'E'`.

### 1.2 Como isso é feito no Código JavaScript?

No nosso motor de criptografia real (`packages/crypto-core/src/index.js`), que é acoplado dentro do CLI de Demonstração, a fórmula purista é replicada utilizando dois métodos originais da Virtual Machine de Javascript (engine V8):
- `charCodeAt()`: Lê o texto em tela e converte pro respectivo número da tabela universal (Ex: `'A' -> 65`).  
- `fromCharCode()`: Pega a poeira criptográfica resolvida numericamente e injeta como String pro Ser Humano poder ler.

Confira o recorte real do código de **Cifragem** hospedado no projeto:

```javascript
/* 
 * Recorte: function encryptCaesar(text, shift)
 * Localização no Monorepo: /packages/crypto-core/src/index.js
 */
export function encryptCaesar(text, shift = 4) {
    let result = "";
    
    // 1. LER: O Algoritmo percorre a palavra digitada pelo aluno letra por letra
    for (let i = 0; i < text.length; i++) {
        
        // 2. EXTRAÍR: Puxa o valor computacional puro (O Byte Inteiro. Ex: 'A' vira 65)
        let charCode = text.charCodeAt(i);
        
        // 3. CALCULAR e SUBSTITUIR: Executa a fórmula (65 + 4 = 69) 
        // Em seguida, o String.fromCharCode já converte o 69 para 'E' e anexa no output
        result += String.fromCharCode(charCode + shift);
    }
    
    // Devolve as letras mascaradas ao usuário
    return result;
}
```

### 1.3 Matemática da Reversão (Ato de Decodificar)

A magia de uma cifra simétrica simples é que o **destinatário e o remetente precisam compartilhar o mesmo Segredo** em uma chave comum (`Shift = 4`). Para resgatar a mensagem do estado de lixo ilegível, basta o sistema alvo espelhar a inversão da operação algébrica original:

$$ Texto Claro(x) = x - \text{Shift} $$

> Se o Destinatário B recebeu `'E'` (Lixo de código número `69`), o seu Computador B executará a regra reversa: `69 - 4 = 65`.  Feito a dedução lógica, o `65` é convertido de volta para o texto legível: `'A'`.

Confira o recorte de **Reversão** executado no lado de *Recebimento*:

```javascript
/* 
 * Recorte: function decryptCaesar(text, shift)
 * Localização no Monorepo: /packages/crypto-core/src/index.js
 */
export function decryptCaesar(text, shift = 4) {
    let result = "";
    
    for (let i = 0; i < text.length; i++) {
        // Recebe da rede a letra 'E'. Extrai seu código '69'
        let charCode = text.charCodeAt(i); 
        
        // Retrai deslocamento (-4) forçando byte decair e voltar a ser '65' (letra 'A')
        result += String.fromCharCode(charCode - shift);
    }
    return result;
}
```

### 1.4 A Matemática da Complexidade (Multi-Layer Cascading) 🧬

Para garantir uma **avaliação acadêmica máxima**, a arquitetura do algoritmo evoluiu da clássica Cifra de César para o modelo de **Substituição em Cascata com Múltiplas Camadas (Multi-Layer Cascading)** iterativas.
Note que, se um script rodasse `N` vezes a Cifra de César com a mesma fórmula linear sobre um arquivo, o resultado criptográfico real seria reduzido a um único deslocamento maior simplório (Ex: `Shift +4 +4 = Shift +8`), tornando a segurança irrisória.

Para forçar um cenário de **Caos Posicional Analítico**, a engine implementada (`encryptCaesarCascade`) neste projeto realiza duas subversões da linearidade romana tradicional em cada Camada ($L$) processada:

1. **Deslocamento Variável por Posição ($D_{L,i}$):** O deslocamento perde a característica de matriz fixa. O `Shift` é multiplicado pelo nível da camada e sofre Injeção de Distorção pelo resto da divisão Indexical do caractere (`i % 3`).
   Fórmula do Deslocamento da Camada L e Índice $i$: 
   $$ D_{(L,i)} = (\text{Base} \times L) + (i \pmod 3) $$
   $$ C(x_{L,i}) = x_{L-1,i} + D_{(L,i)} $$

2. **Transposição Geométrica Escalar (Reversão):** Para destruir metodologias de Análise de Frequência de Idiomas inter-camadas, no décimo de segundo subsequente do fim do Loop da Camada Atual ($L$), toda a string gerada sofre uma **Transposição Brutal** (ela é invertida integralmente de ponta a ponta: `Reverse`) antes de ser reinjetada como Fator de Entrada para a Camada seguinte ($L+1$). A reversão do texto na descriptografia exige estrita inversão descendente das fases e blocos (Layer 3 $\rightarrow$ Destranspõe $\rightarrow$ Subtrai Fator $D_3$ $\rightarrow$ Layer 2 $\dots$).

**Análise de Complexidade (Big-O)**
Essa operação possui complexidade Big-O de:
- **Tempo O(n) (Linear):** O micro-processador gastará um tempo proporcionalmente exato em relação ao tamanho `$n$` de letras do texto, porque precisamos engatar e fazer varredura em um Loop exato `For` ao longo e toda dimensão textual.
- **Espaço (RAM) O(n):** Aloca memória virtual em progressão Linear no Servidor, o espaço é o dobro do tamanho original porque o compilador vai montando na Memória uma String nova, paralela (`""+ Result`) da mesma equivalência de bits do texto inicial, sem destruir um por cima do outro.

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
3. Escolham opção `[1]`, digitem a mensagem e o **Número de Camadas (Layers)** de segurança. O computador irá gerar a matemática tridimensional multicamadas em câmera lenta!
4. O Aluno Copia a linha de texto vermelha (`Texto Cifrado`).
5. O Aluno B manda este texto para o `Computador B `(Via Whatsapp, Discord...).
6. No `Computador B`, abre-se o `npm run demo` digitando a `[2]`. Informa o mesmo **Número de Camadas** combinadas e o lixo cifrado no console e assistem a reversão de Transposição e Deslocamento ocorrendo camada por camada até decodificar a frase.

*(Não há risco de dependência HTTP ou CORS para a rede restrita do Laboratório da Instituição, pois não roda sob WebServers como a parte 1 do trabalho, roda primariamente direto nas artérias do Engine Node V8 local).*
