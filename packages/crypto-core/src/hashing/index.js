import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

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
