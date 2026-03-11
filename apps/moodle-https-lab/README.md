# 🔒 Servidor Seguro Moodle com Nginx via HTTPS (TLS 1.3 | RSA 4096)

Este laboratório provê os passos práticos para implantar um servidor web (Nginx) operando como proxy reverso para a plataforma **Moodle**, exigindo tráfego criptografado exclusivamente via protocolo **TLS 1.3** com chaves assimétricas **RSA de 4096 bits**. Tudo orquestrado em contêineres Docker para facilidade de execução.

---

## 🏗️ 1. Gerando o Certificado Autoassinado (OpenSSL)
Para habilitarmos a porta `443` (HTTPS) no servidor web Nginx, precisamos empacotar uma Identidade Criptográfica em um Certificado Digital X.509, atrelado a uma chave RSA de 4096 bits.

**Passo a passo:**
1. Abra o terminal na raiz deste projeto interativo (na pasta `apps/moodle-https-lab`).
2. Crie uma pasta vazia para receber as chaves digitais:
   ```bash
   mkdir certs
   ```
3. Execute o comando nativo do OpenSSL exigindo uma nova chave criptográfica RSA com envergadura de 4096 pinos binários:
   ```bash
   openssl req -x509 -nodes -days 365 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt
   ```
4. O terminal efetuará algumas perguntas (País `BR`, Estado, etc.). Responda "Localhost" para o *Common Name*.

No final deste passo, o diretório `certs/` deverá conter:
- `server.key`: Sua chave PRIVADA (o cofre). Não a compartilhe.
- `server.crt`: Seu documento PÚBLICO validável.

---

## 🚀 2. Subindo o Laboratório (Docker)
Este laboratório elimina qualquer complexidade de dependências no seu sistema host. Utilizaremos o **Docker Compose** para parear e interligar em rede 3 componentes simulados em "VMs Isoladas":
- **`moodle`**: Aplicação oficial Moodle rodando na porta fechada `8080`.
- **`db`**: SGDB PostgreSQL 15, servindo dados localmente ao Moodle na porta `5432`.
- **`nginx`**: O Porteiro Seguro do nosso cenário. Ele senta na porta **443** com o certificado RSA, recusa quem for inseguro e redireciona (Proxy) ao Moodle quem falar HTTPS e `TLS 1.3`.

Na pasta atual `moodle-https-lab`, digite:

```bash
docker compose up -d
```

A orquestração provisionará a arquitetura.

---

## 🕵️‍♂️ 3. Auditoria e Validação (Prova Prática)

Uma vez que o terminal retorne `Started` para os 3 serviços:

1. Acesse pelo seu navegador a URL estrita de segurança: `https://localhost`
2. **O Aviso Vermelho (Autoridade Certificadora)**
   - O Chrome/Edge informará que seu certificado é inválido ou "Sua conexão não é particular" (`ERR_CERT_AUTHORITY_INVALID`). 
   - **Por quê?** Porque o arquivo `server.crt` foi *autoassinado* por você, e não por uma Autoridade de Confiança Global embutida no Windows (CA, como Let's Encrypt ou VeriSign). 
   - Na aula, explicamos a confiança PKI. Clique em "Avançado" > "Ir para localhost (inseguro)".
3. **Provando os Requisitos (TLS 1.3 e RSA-4096)**
   - Ao carregar a tela de instalação base do Moodle, pressione **`F12`** no teclado.
   - Navegue até a aba **Segurança (Security)**.
   - Na seção "Connection" (Conexão), observe os protocolos validados. Você enxergará nitidamente: `A conexão desta página foi criptografada com TLS 1.3`.
   - Clique em **View Certificate (Ver Certificado)** e expanda a área "Details (Detalhes)", procure por Assinatura de Chave Pública: estará lá `RSA (4096 Bits)`.

### Falhando Intencionalmente
Se tentar acessar via HTTP HTTPs antigos (`http://localhost` ou forçar SSLv3), o Nginx rejeitará sumariamente o acesso à rede, validando o isolamento.
