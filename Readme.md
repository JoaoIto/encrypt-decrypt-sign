# Crypto Visualizer & Library Monorepo

Bem-vindo ao repositório de estudos avançados sobre criptografia corporativa. 

Este projeto não é apenas uma coleção de scripts, mas um **monorepo completo** projetado para prover uma interface super performática para visualizar o trajeto da informação ao ser criptografada. 

## 🚀 Como Iniciar (O Jeito Fácil)

Para facilitar os testes, criamos comandos que inicializam as "máquinas virtuais" (VMs) necessárias de forma inteligente, sempre subindo o Front-End (Dashboard) com elas.

Abra o terminal na raiz do projeto e instale as dependências:
```bash
npm install
```

### Inicializando Casos de Estudo Específicos:
Ao invés de rodar 3 comandos separados, utilize nossos atalhos nativos. O Turborepo cuidará de subir o Dashboard Web E a sua "Máquina" respectiva em paralelo de forma muito rápida:

- **Para testar a Cifra de César**:
  ```bash
  npm run dev:cipher
  # Sobe o Painel Web (3000) e a API Cipher (3001)
  ```

- **Para testar Hashing (Auth)**:
  ```bash
  npm run dev:hash
  # Sobe o Painel Web (3000) e a API Hash (3002)
  ```

- **Para testar Criptografia Simétrica**:
  ```bash
  npm run dev:sym
  # Sobe o Painel Web (3000) e a API Simétrica (3003)
  ```

- **Para testar Criptografia Assimétrica**:
  ```bash
  npm run dev:asym
  # Sobe o Painel Web (3000) e a API Assimétrica (3004)
  ```

- **Para testar Autenticação JWT**:
  ```bash
  npm run dev:jwt
  # Sobe o Painel Web (3000) e a API JWT (3005)
  ```

### Ligando Todas as Máquinas Simultaneamente (Modo Completo):
```bash
npm run dev
```

---

## 🏗️ Docker
Prefere usar Docker real em vez dos processos de Node locais? Utilize o Docker Compose incluso:
```bash
docker compose up -d
```

---
*Consulte o diretório `/docs/` para o plano arquitetural completo e descritivo das fases deste projeto.*
