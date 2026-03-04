import { createCipheriv, randomBytes, createDecipheriv }from 'crypto';

const msg = "Crypt message cyphger";
const key = randomBytes(32);
const vi = randomBytes(16);

const cifra = createCipheriv('aes256', key, vi);
export const cypherMsg = cifra.update(msg, "utf-8", "hex") + cifra.final('hex');

const descrypt = createDecipheriv('aes256', key, vi);

export const msgDescrypt =
  descrypt.update(cypherMsg, "hex", "utf-8") + descrypt.final("utf-8");
