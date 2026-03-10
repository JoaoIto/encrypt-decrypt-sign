import { createCipheriv, createDecipheriv, randomBytes, generateKeyPairSync, publicEncrypt, privateDecrypt, scryptSync, timingSafeEqual } from "crypto";

// ============================================
// 1. CIFRA (Caesar Cipher)
// ============================================

export function encryptCaesar(message, shifts = 4) {
  return message.split("").map((caractere) => {
    const codigoCaractere = caractere.charCodeAt(0);
    return String.fromCharCode(codigoCaractere + shifts);
  }).join("");
}

export function decryptCaesar(encryptedMessage, shifts = 4) {
  return encryptedMessage.split("").map((caractere) => {
    const codigoCaractere = caractere.charCodeAt(0);
    return String.fromCharCode(codigoCaractere - shifts);
  }).join("");
}

// ============================================
// 1.5 CIFRA EM CASCATA (Complexidade Multi-Layer)
// ============================================
export function encryptCaesarCascade(message, baseShift = 4, layers = 3) {
  let result = message;

  for (let layer = 1; layer <= layers; layer++) {
    // 1. Cifragem com Fator Dinâmico: BaseShift * CamadaAtual
    const dynamicShift = baseShift * layer;
    let temp = "";

    for (let i = 0; i < result.length; i++) {
      // Complexidade Algorítmica: O shift depende do índice para evitar matemática linear (A+A = 2A)
      const charCode = result.charCodeAt(i);
      const positionalShift = dynamicShift + (i % 3); // Opcional: injetando distorção posicional
      temp += String.fromCharCode(charCode + positionalShift);
    }

    // 2. Transposição (Reverse string) antes de descer pra próxima camada
    result = temp.split("").reverse().join("");
  }

  return result;
}

export function decryptCaesarCascade(encryptedMessage, baseShift = 4, layers = 3) {
  let result = encryptedMessage;

  // A Reversão DEVE Ocorrer na ordem inversa (Da última camada até a primeira)
  for (let layer = layers; layer >= 1; layer--) {
    // 1. Desfazer Transposição (Invertendo a String novamente)
    result = result.split("").reverse().join("");

    // 2. Desfazer Fator Dinâmico: BaseShift * CamadaAtual
    const dynamicShift = baseShift * layer;
    let temp = "";

    for (let i = 0; i < result.length; i++) {
      const charCode = result.charCodeAt(i);
      const positionalShift = dynamicShift + (i % 3);
      temp += String.fromCharCode(charCode - positionalShift);
    }

    result = temp;
  }

  return result;
}

// ============================================
// 2. SYM-CRYPTO (Symmetric Encryption - AES-256-CBC)
// ============================================

export function generateSymmetricKeyAndIV() {
  return {
    key: randomBytes(32).toString('hex'), // 256 bits
    iv: randomBytes(16).toString('hex')   // 128 bits
  };
}

export function encryptSymmetric(message, keyHex, ivHex) {
  const keyBuffer = Buffer.from(keyHex, 'hex');
  const ivBuffer = Buffer.from(ivHex, 'hex');
  const cipher = createCipheriv('aes-256-cbc', keyBuffer, ivBuffer);

  let encrypted = cipher.update(message, "utf-8", "hex");
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decryptSymmetric(encryptedHex, keyHex, ivHex) {
  const keyBuffer = Buffer.from(keyHex, 'hex');
  const ivBuffer = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);

  let decrypted = decipher.update(encryptedHex, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
}

// ============================================
// 3. ASYM-CRYPTO (Asymmetric Encryption - RSA)
// ============================================

export function generateAsymmetricKeyPair() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { privateKey, publicKey };
}

export function encryptAsymmetric(message, publicKeyPem) {
  const encryptedBuffer = publicEncrypt(publicKeyPem, Buffer.from(message));
  return encryptedBuffer.toString('hex');
}

export function decryptAsymmetric(encryptedHex, privateKeyPem) {
  const decryptedBuffer = privateDecrypt(privateKeyPem, Buffer.from(encryptedHex, 'hex'));
  return decryptedBuffer.toString('utf-8');
}

// ============================================
// 4. HASHING (Scrypt with Salt)
// ============================================

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const paswHash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${paswHash}`;
}

export function verifyPassword(password, storedHashWithSalt) {
  const [salt, storedHash] = storedHashWithSalt.split(":");
  const testHash = scryptSync(password, salt, 64);
  const realHash = Buffer.from(storedHash.trim(), "hex");

  return timingSafeEqual(testHash, realHash);
}
