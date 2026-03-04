# 🔑 \`asym-crypto-service\` (Asymmetric RSA VM)

> **Máquina Virtual** encarregada de simular um servidor capaz de lidar com requisições de criptografia baseada em pares de chaves **RSA-2048**.

## 📌 Arquitetura e Propósito
A criptografia assimétrica se destaca por requerer duas chaves (Uma Pública e uma Privada). Este serviço Fastify importa a função abstrata do \`crypto-core\` de geração \`generateAsymmetricKeyPair\` assim que sobe. Ele mantém em memória da VM (Sessão) tanto a chave PEM Privada quanto a Pública.

Roda nativamente sob a Porta **3004**.

---

## 🚀 Rotas da Aplicação

### 1. \`GET /public-key\` (Distribuição)
Num caso de uso real de Handshake TLS ou troca de mensagens Web, o Transmissor precisa pedir explicitamente pela chave pública do destinatário.
Esta rota exporta a string limpa PEM contendo a Pública, avisando ao mundo: *"Se quiserem me mandar um segredo com segurança absoluta pela rede roteada crua, embaralhem os pacotes HTTP com essa chave"*.

### 2. \`POST /encrypt\` (Criptografando com a Chave Pública)
É aqui onde a UI "Transmissora" chega. Recebemos o parâmetro \`({ message })\`, pegamos ele e embaralhamos nativamente via função nativamente exportada do Core (\`encryptAsymmetric\`).
A cifra retorna em String **Hexadecimal**, pronta para ser transitada via rede de volta para a UI para efeitos visuais.

### 3. \`POST /decrypt\` (Abertura do Cofre com a Chave Privada)
Neste estágio o \`Dashboard Web\` envia a cifra embaralhada como se estivesse batendo no destino final real.
A VM então entra em operação usando o \`crypto-core > decryptAsymmetric\` e passando a poderosa chave secreta que nunca saiu ou vazou da memória do Fastify (A Private Key). O resultado é devolvido em \`utf-8\` puro para leitura do front.

### 4. \`GET /logs\` (Telemetria)
Usado globalmente pela interface Web UI para consumir cada linha de "console" que a máquina gera em tempo real sob ação e pintá-la no painel como se fosse um log via terminal isolado do Monorepo.
