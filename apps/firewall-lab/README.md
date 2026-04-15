# 🛡️ Laboratório de Firewall: IPTables e IPFW

Atividade profissional e avançada demonstrando a criação de regras de mitigação, proteção de infraestrutura (Stateful Inspection), Network Address Translation (NAT) e logging isolado de pacotes em dois cenários distintos (Docker/IPTables e FreeBSD/IPFW).

![Schema](./assets/schema.png)

## 📋 Topologia da Rede

*   **Sistemas de Firewall:**
    *   WAN (`10.100.90.1` no Docker ou `172.16.90.1` no FreeBSD) - Conexão Externa.
    *   DMZ (`10.100.56.254` / `192.168.56.254`) - Gateway da Rede Desmilitarizada.
    *   LAN (`10.100.57.254` / `192.168.57.254`) - Gateway da Rede Local.
*   **Servidores DMZ:**
    *   Joomla/Moodle Web (App): `.10` (Ex: `192.168.56.10` / `10.100.56.10`)
    *   Banco de Dados (MariaDB/MySQL): `.20`
*   **Clientes LAN:**
    *   Administrador Windows: `.30`

---

## ⚙️ Regras Aplicadas (Exigência do Projeto)

- **NAT e Port Forwarding:** Exposição das portas 80 e 443 do servidor web Joomla simulando um ambiente Moodle para a Internet via DNAT.
- **Segurança da WAN:** Recusa automática de `ICMP Echo Request` (Ping Externo), Bloqueio do SSH (`porta 22`) e portas de bancos de dados (`3306`, `5432`).
- **Comunicação Interna:** Clientes LAN possuem acesso a serviços web na DMZ, com tráfego perfeitamente monitorado e restrito (Ex: Regras de horário da LAN para a WAN).
- **Log Específico:** Interceptação dos acessos cruzados (ex: do Admin Windows para o MySQL de Log).

---

## 🚀 Questão 1: IPTables (Simulação Dockerizada)

A primeira parte do laboratório utiliza um ambiente totalmente conteinerizado (`docker-compose`) rodando em redes simuladas (`10.100.x.x`). 

Neste cenário, usamos o `firewall_iptables.sh` rodando ativamente dentro de um gateway/firewall de sistema focado em Linux (`iptables`). 
O ambiente funcionou de forma fluida após implementarmos `SNAT (Masquerade)` no tráfego direcionado para a própria rede interna afim de evitar problemas de "roteamento assimétrico" das requisições web, forçando o Container do Joomla a enviar a resposta estritamente pro Gateway.

### Como Executar e Validar:
```bash
# Subir infraestrutura Web e BD
docker compose up -d

# Executar o firewall no container designado como gateway
docker exec -it fw-gateway sh /root/firewall_iptables.sh
```

---

## 🚀 Questão 2: IPFW (FreeBSD no VirtualBox)

Na segunda etapa, integramos uma Máquina Virtual atuando como um roteador de borda oficial em FreeBSD que intermedia o tráfego da rede *Host-Only* para o Docker (no hospedeiro Windows). 

As configurações estão no script **`firewall_ipfw.sh`**. Tivemos que lidar com a arquitetura severa do firewall FreeBSD:
1. **Driblando a Assimetria (Double NAT):** Implementamos dois NATs (`DNAT` da WAN e `SNAT` na saída da DMZ) para garantir que a requisição originada do Host navegasse para dentro de si e a resposta fosse forçada a retornar para o FreeBSD, em vez do Host encurtar caminho consumindo ele próprio (Loopback). 
2. **Flag One Pass:** Desativamos o `sysctl net.inet.ip.fw.one_pass=0` para que pacotes pudessem circular nos dois módulos de NAT na mesma leitura ao invés de pular as regras de firewall na primeira conversão de IP.

### Como Executar:
Dentro do terminal do Firewall FreeBSD no VirtualBox, rode os comandos para buscar o script limpo e aplicá-lo:
```bash
# 1. Liberar temporariamente tráfego para baixar atualizações locais:
/sbin/ipfw -q -f flush
/sbin/ipfw add 1 allow ip from any to any

# 2. Descarregar o script de regras hospedado no Windows:
fetch -o /root/firewall_ipfw.sh http://192.168.56.1:8080/firewall_ipfw.sh

# 3. Aplicar as Regras Exigidas:
sh /root/firewall_ipfw.sh
```

---

## 🧪 Auditoria de Segurança com Python

O arquivo `test_firewall.py` realiza um pentest interno (TCP Connect e ICMP Packets) validando se o roteador atende às políticas mínimas do Lab. É compatível para testar a Questão 1 (`10.100.90.1`) e Questão 2 (`172.16.90.1`).

```powershell
python .\test_firewall.py
```
**O script valida que:**
1. Ping bloqueado (Proteção Anti-DDoS de pacotes de controle).
2. Portas Web Autorizadas.
3. Sessões Críticas Requerendo Tunneling Bloqueadas no Bordo Público (Firewall Externo Seguro).

---

## 📸 Evidências / Screenshots

*Aqui demonstramos o acesso final resolvido acessando a plataforma na nossa máquina Windows:*

![Acesso ao Joomla pelo Browser no IP da WAN FreeBSD](./assets/print_joomla_browser.png)

*Aplicação do Roteamento e Regras no FreeBSD IPFW:*

![Shell FreeBSD aplicando Firewall IPFW](./assets/print_freebsd_shell.png)

*(Coloque as imagens nos locais da pasta `assets/` e corrija os nomes se necessário).*
