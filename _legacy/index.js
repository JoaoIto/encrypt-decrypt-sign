import { mensagemCifrada } from "./src/cifra/cifra.js";
import { hashConsole, userAuth, userAuthFake } from "./src/hash/hash.js";
import { user, userCorr } from "./src/hash/hashCrypto.js";
import { cypherMsg, msgDescrypt } from "./src/symetricScript/symetricScript.js"
import { privateKey, publicKey, criptoDatesString, msgDescryptString } from "./src/asymetricScript/asymetricScript.js";

console.log("Mensagem cifra");
console.log(mensagemCifrada);
console.log("\n\n");
console.log("Senha hash: ");
console.log(hashConsole);
console.log(userAuth);
console.log("\n\n");
console.log("Fake user: ");
console.log(userAuthFake);
console.log("\n\n");
console.log("Hash crypto: ");
console.log(user);
console.log("Hash crypto auth(): ");
console.log(userCorr)
console.log("\n\n");
console.log(cypherMsg);
console.log(msgDescrypt);
console.log("\n\n");
console.log("Private Key: " + privateKey);
console.log("Public Key: " + publicKey);
console.log("\n\n");
console.log("criptoDatesString: " + criptoDatesString);
console.log("\n\n");
console.log("Msg descrypt: " + msgDescryptString);