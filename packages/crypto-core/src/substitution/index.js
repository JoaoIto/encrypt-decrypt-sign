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

export function encryptCaesarCascade(message, baseShift = 4, layers = 3) {
    let result = message;

    for (let layer = 1; layer <= layers; layer++) {
        const dynamicShift = baseShift * layer;
        let temp = "";

        for (let i = 0; i < result.length; i++) {
            const charCode = result.charCodeAt(i);
            const positionalShift = dynamicShift + (i % 3);
            temp += String.fromCharCode(charCode + positionalShift);
        }

        result = temp.split("").reverse().join("");
    }

    return result;
}

export function decryptCaesarCascade(encryptedMessage, baseShift = 4, layers = 3) {
    let result = encryptedMessage;

    for (let layer = layers; layer >= 1; layer--) {
        result = result.split("").reverse().join("");

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
