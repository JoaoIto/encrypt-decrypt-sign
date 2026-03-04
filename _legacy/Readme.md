# Criptografia e tokens em JS:

A arte de criptografar e codificar faz parte da nossa história e essa prática não ficou de fora nas evoluções tecnológicas; por isso que, quando os computadores foram criados, a programação foi pensada como uma forma que facilitasse a comunicação entre pessoas e máquinas.

---

Daí surgiu a necessidade de ***codificar* essa comunicação**. Cada caractere que utilizamos para passar instruções ao computador, sejam letras, números, símbolos, até mesmo espaços e aspas, é interpretado no computador como uma sequência numérica de 0 ou 1, configurando a quantidade de 8 bits, que é a quantidade de memória consumida por cada caractere no computador.

## Em código

### Usando os métodos ***``charCodeAt()``*** e ***``fromCharCode()``***

O ***``charCodeAt()``*** é um método usado para retornar o número que indica o valor Unicode do caractere no índice especificado.

```js
let mensagem = "A";
let codAscii = mensagem.charCodeAt(0);

console.log(codAscii); // 65

let mensagem = "a";

let codAscii = mensagem.charCodeAt(0);

console.log(codAscii); // 97
```

### Exemplo com laço ``for()``

```js
const mensagem = "ALURA";

for (let i = 0; i < mensagem.length; i++) {
 console.log(mensagem.charCodeAt(i));
}

/*
65
76
85
82
65
*/
```

---