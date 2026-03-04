# Funções hash

É um tipo de função usada na criptografia, na qual ela consegue embaralhar o teu segredo de palavra, na qual assim o processo é irreversível

<img src="../../.github/hashExample.png">

---

## Propriedades

As funções de hash apresentam algumas propriedades em momento de execução e em exibição de seus segredos:

- Sem colisões: Ser um segredo único, na qual não existente outro hash;

- Tamanho fixo: Apresentar um tamanho de caracteres físico;

---

# Code:

Este é um código comum, feito para a criação de uma hash na senha de usuário, e assim depois, ele consegue comparar simplesmente esta hash criada para a senha desenvolvida.

```js
import { createHash } from "crypto";

function hashCreate(pwrd){
    return createHash('sha256').update(pwrd).digest('hex');
}

export let hashConsole = hashCreate("stro stro stro");


class User {
    constructor(name, password){
        this.name = name;
        this.hash = hashCreate(password);
    }

    auth(name, password){
        if(this.name == name && this.hash == hashCreate(password)){
            console.log("Sucess!")
            return true;
        }else{
            console.log("Fail! Not a true user!")
            return false;
        }
    }
}

const user = new User("Joao", "23082005");
console.log(user);

export let userAuth = user.auth("Joao", "23082005");
export let userAuthFake = user.auth("Joao", "2204582905");
```

O problema, é que como o hash, é apenas, ***um endereço de memória onde é guardada aquela senha, gerada a partir de uma função!*** Sendo assim, um usuário atacante, pode simplemente entender que ele precisa chutar este endereço, podendo entender que várias hash's criadas, uma dela traduzida, se fala da senha original criada.

### **Criando hash mais implemental:**

A próxima implementação, fará uma implementação que criará uma hash, e ainda com um dado a mais, que fará essa hash muito mais complexa, e assim mais difícil de ser descoberta. Para isso, usaremos as funções de: (scryptSync, randomBytes, timingSafeEqual,).

- ***`scryptSync(pasw, salt, 64).toString('hex')`***:Gera um hash junto com esse sal para uma somente hash de senha;

- ***`randomBytes(16).toString('hex')`***: Gera esse sal aleatório, passando como parâmetro, seu tamanho, que no caso, é de 16 bytes;

- ***`timingSafeEqual()`***: Faz a verificação a partir de temporização se é verdade a condição as duas variáveis de buffer

- ***`Buffer.from(this.hash.trim(), 'hex')`***: Cria um Buffer e depois transforma para hexadecimal, ele converte o valor de hash armazenado na instância do objeto User de uma string hexadecimal em um buffer de bytesbasicamnente serve. Ela também remove qualquer espaço em branco da string de hash usando o método ``trim()``;


### Resultado: 
```js
Hash crypto:
User {
  name: 'Joao',
  crypto: '40624019f88a40f368cdfae9ab217c9a',
  hash: " 'ϻ�o��+).�UJփ���tg���ѝ\x1D��lƐDPt�5\f���㡽\x17��@�\f֩�Ix\rM��ψ"
}
```  

Este resultado, mostra o quão a hash se torna impossível de ser linda, e assim criando 2 hashs, uma crypto ainda para essa senha, mais a própria hash que foi para a senha.

Por ser aleatório e modificar toda e qualquer senha, o “sal” na função de hash faz com que senhas iguais tenham hashes diferentes, fazendo com que atacantes não consigam realizar o ataque de rainbow table por não identificar senhas a partir de hashes gerados, pois toda senha terá um hash diferente. Isso dificulta muito o ataque por fazer com que os atacantes tenham que adivinhar não mais apenas a senha, como também o “sal” utilizado para gerar a hash da senha, acarretando em infinitas combinações extremamente difíceis de serem acertadas.

---