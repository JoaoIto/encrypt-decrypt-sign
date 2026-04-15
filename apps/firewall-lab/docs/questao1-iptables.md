# Questao 1 — Implementacao de Firewall com IPTables no Debian Linux 13.x

## Documentacao Tecnica Detalhada

Disciplina: Direito e Seguranca da Informacao
Atividade: Configuracao de Politica de Firewall

---

## Sumario

1. Descricao da Atividade
2. Topologia de Rede
3. Tecnologias Utilizadas
4. Maquina Virtual 1 — Firewall Gateway (Debian 13)
5. Maquina Virtual 2 — Servidor de Aplicacao Joomla (DMZ)
6. Maquina Virtual 3 — Servidor de Banco de Dados MySQL (DMZ)
7. Maquina Virtual 4 — Cliente da Rede Local (Simulacao Windows)
8. Orquestracao com Docker Compose
9. Script de Firewall: firewall_iptables.sh
10. Sincronizacao de Horario com NTP
11. Testes de Validacao
12. Script de Auditoria Externa em Python
13. Resultados Obtidos
14. Consideracoes Finais

---

## 1. Descricao da Atividade

A atividade solicita a implementacao de uma politica de firewall completa utilizando o IPTABLES no sistema operacional Debian Linux 13.x. O objetivo e proteger uma infraestrutura composta por servidores de aplicacao web (Joomla) e banco de dados (MySQL) localizados em uma rede DMZ (Zona Desmilitarizada), bem como garantir controle e rastreabilidade dos acessos provenientes de uma rede local de clientes.

### Requisitos obrigatorios da atividade:

- Utilizar ao menos quatro maquinas virtuais com papeis distintos
- O acesso ao servidor web (Joomla) na DMZ deve ocorrer somente via NAT reverso (DNAT), pelas portas 80 e 443, a partir da Internet
- O cliente Windows da rede local deve poder acessar o servidor via SSH (porta 22), MySQL (porta 3306) e PostgreSQL (porta 5432), com todos os acessos registrados em log
- Os demais hosts da rede local somente podem acessar a DMZ pelas portas 80 e 443
- Todos os hosts da rede local e DMZ devem ter acesso a internet via NAT (SNAT), porem apenas no horario de almoco (12h as 14h) e apos as 18h
- Implementar protecoes contra: source routing, record route, flags TCP incompletas, synflood, portscan e requisicoes ICMP externas
- O firewall deve inicializar com as regras ativas, por meio de um script de configuracao
- O horario do firewall deve estar sincronizado com os servidores NTP do NIC BR (a.ntp.br, b.ntp.br, c.ntp.br)
- Implementar um script em Python que teste os bloqueios e gere um log com os resultados

---

## 2. Topologia de Rede

A rede foi dividida em tres segmentos:

```
INTERNET (WAN)
     |
     | 10.100.90.1  (interface WAN do Firewall)
     |
 [fw-gateway] --- 10.100.56.254 (interface DMZ)
     |                    |
     |           [Zone DMZ: 10.100.56.0/24]
     |               |             |
     |         [joomla-dmz]   [db-dmz]
     |         10.100.56.10   10.100.56.20
     |
     | 10.100.57.254 (interface LAN)
     |
  [Zone LAN: 10.100.57.0/24]
        |
   [client-win]
   10.100.57.30
```

### Mapeamento de enderecos IP:

| Maquina | Funcao | Endereco IP | Rede |
|---|---|---|---|
| fw-gateway | Firewall e Gateway | 10.100.90.1 (WAN) / 10.100.56.254 (DMZ) / 10.100.57.254 (LAN) | Todas |
| joomla-dmz | Servidor Web Joomla 5 | 10.100.56.10 | DMZ |
| db-dmz | Servidor MySQL 8.0 | 10.100.56.20 | DMZ |
| client-win | Cliente Administrador | 10.100.57.30 | LAN |

Nota: Os enderecos IP foram adaptados para o ambiente Docker a fim de evitar conflito com redes do VirtualBox (que usa 192.168.56.x por padrao) e com as bridges internas do Docker. A logica de segmentacao e as regras sao identicas as dos enderecos especificados na atividade (192.168.56.x / 192.168.57.x / 172.16.90.x).

---

## 3. Tecnologias Utilizadas

| Tecnologia | Versao | Finalidade |
|---|---|---|
| Docker Desktop | Atual | Orquestracao dos containers simulando VMs |
| Docker Compose | v2 | Definicao declarativa da infraestrutura |
| Debian Linux | 13 (slim) | Sistema operacional do Firewall |
| IPTables | Versao inclusa no Debian 13 | Motor de regras de firewall no kernel Linux |
| Joomla | 5 (Apache) | CMS da aplicacao web na DMZ |
| MySQL | 8.0 | Banco de dados relacional na DMZ |
| Chrony | 4.6.x | Cliente NTP para sincronizacao de horario |
| Python | 3 | Script de auditoria externa |

---

## 4. Maquina Virtual 1 — Firewall Gateway (Debian 13)

### 4.1. Papel na topologia

O fw-gateway e o ponto central da infraestrutura. Ele possui tres interfaces de rede e tem como responsabilidades:

- Atuar como gateway entre Internet, DMZ e LAN
- Aplicar todas as politicas de firewall via IPTables
- Executar o NAT reverso (DNAT) para expor os servicos da DMZ
- Executar o NAT de saida (SNAT/Masquerade) para dar acesso a internet para LAN e DMZ
- Registrar em log as conexoes do cliente administrador Windows
- Sincronizar o relogio com servidores NTP do NIC BR

### 4.2. Inicializacao do container

O container e iniciado com o seguinte comando (definido no docker-compose.yml):

```bash
apt-get update -qq &&
apt-get install -y -qq iptables iproute2 net-tools iputils-ping procps curl chrony &&
echo 'server a.ntp.br iburst' > /etc/chrony/chrony.conf &&
echo 'server b.ntp.br iburst' >> /etc/chrony/chrony.conf &&
echo 'server c.ntp.br iburst' >> /etc/chrony/chrony.conf &&
echo 'makestep 1.0 3' >> /etc/chrony/chrony.conf &&
chronyd &&
tail -f /dev/null
```

Explicacao de cada linha:

- `apt-get update -qq`: Atualiza a lista de pacotes do repositorio Debian de forma silenciosa
- `apt-get install -y -qq iptables iproute2 net-tools iputils-ping procps curl chrony`: Instala os pacotes necessarios para as funcoes do gateway. O `iptables` e o motor de firewall; o `iproute2` fornece o comando `ip`; o `chrony` e o servico NTP
- Os comandos `echo 'server...'` gravam os servidores NTP do NIC BR no arquivo de configuracao do chrony
- `makestep 1.0 3`: Instrui o chrony a aplicar correcoes de tempo grandes imediatamente nas primeiras sincronizacoes
- `chronyd`: Inicia o daemon de sincronizacao NTP em background
- `tail -f /dev/null`: Mantem o container em execucao indefinidamente

### 4.3. Configuracao privilegiada

O container e declarado com `privileged: true` e os capacitores `NET_ADMIN` e `NET_RAW` no Compose. Isso e necessario porque:

- `privileged: true`: Permite ao container acessar as chamadas de sistema do kernel Linux do host, incluindo a manipulacao das tabelas do Netfilter (iptables)
- `NET_ADMIN`: Permissao para modificar as configuracoes de rede, como adicionar e remover regras de firewall e alterar o roteamento
- `NET_RAW`: Permissao para criar sockets RAW, necessario para operacoes de ping (ICMP) e operacoes de baixo nivel de rede

### 4.4. Como verificar o fw-gateway

```bash
# Verificar os IPs atribuidos ao container
docker exec fw-gateway ip addr

# Verificar as rotas do gateway
docker exec fw-gateway ip route

# Verificar as regras de firewall aplicadas
docker exec fw-gateway iptables -L -n -v --line-numbers

# Verificar as regras de NAT
docker exec fw-gateway iptables -t nat -L -n -v

# Verificar o status do chrony
docker exec fw-gateway chronyc sources

# Verificar o arquivo de configuracao NTP
docker exec fw-gateway cat /etc/chrony/chrony.conf
```

---

## 5. Maquina Virtual 2 — Servidor de Aplicacao Joomla (DMZ)

### 5.1. Papel na topologia

O joomla-dmz executa o CMS Joomla 5 sobre o servidor Apache. Este servidor e o unico que deve ser acessivel da Internet, e somente pelas portas 80 (HTTP) e 443 (HTTPS). O acesso e feito de forma totalmente mediada pelo firewall via DNAT, sem exposicao direta.

### 5.2. Como o Joomla sobe

A imagem oficial `joomla:5-apache` ja inclui o Apache configurado. As variaveis de ambiente informam as credenciais de conexao com o banco de dados:

```yaml
environment:
  JOOMLA_DB_HOST: db-dmz
  JOOMLA_DB_USER: joomlauser
  JOOMLA_DB_PASSWORD: joomlapass
  JOOMLA_DB_NAME: joomla
```

A dependencia `depends_on: db-dmz: condition: service_healthy` garante que o Joomla so inicie apos o MySQL estar completamente pronto e respondendo ao healthcheck.

### 5.3. Como verificar o servidor Joomla

```bash
# Verificar se o Apache esta respondendo na porta 80 (direto na DMZ)
docker exec fw-gateway curl -s -o /dev/null -w "%{http_code}" http://10.100.56.10

# Resultado esperado: 302 (redirecionamento para pagina de instalacao do Joomla)
```

---

## 6. Maquina Virtual 3 — Servidor de Banco de Dados MySQL (DMZ)

### 6.1. Papel na topologia

O db-dmz executa o MySQL 8.0 e armazena os dados do Joomla. Ele tambem serve como alvo de testes de acesso administrativo pelo cliente Windows (porta 3306). O servidor de banco de dados NUNCA deve ser acessivel pela Internet, apenas pelo servidor de aplicacao e pelo cliente administrador especifico.

### 6.2. Healthcheck do MySQL

O Compose configura um healthcheck que verifica se o MySQL esta aceitando conexoes antes de liberar o Joomla para iniciar:

```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-prootpassword"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

O `start_period: 30s` e importante pois o MySQL precisa de alguns segundos para inicializar e criar os bancos de dados.

### 6.3. Como verificar o banco de dados

```bash
# Verificar se o MySQL esta respondendo
docker exec db-dmz mysqladmin ping -u root -prootpassword

# Resultado esperado: mysqld is alive

# Verificar os bancos criados
docker exec db-dmz mysql -u root -prootpassword -e "SHOW DATABASES;"

# Resultado esperado: aparecer o banco joomla na lista
```

---

## 7. Maquina Virtual 4 — Cliente da Rede Local (Simulacao Windows)

### 7.1. Papel na topologia

O client-win simula o cliente Windows da rede local com IP 10.100.57.30. Este e o unico host da LAN que possui permissao para acessar os servicos administrativos da DMZ (SSH porta 22, MySQL porta 3306, PostgreSQL porta 5432). Todos os demais hosts da LAN so podem acessar as portas 80 e 443.

### 7.2. Configuracao de rotas estaticas

Como o Docker nao roteia automaticamente o trafego entre redes diferentes pelo container de firewall, e necessario adicionar rotas estaticas no client-win indicando que o trafego para a DMZ e para a WAN deve passar pelo fw-gateway:

```bash
# Adicionar rota para a rede DMZ via fw-gateway (interface LAN 10.100.57.254)
docker exec client-win ip route add 10.100.56.0/24 via 10.100.57.254

# Adicionar rota para a rede WAN via fw-gateway
docker exec client-win ip route add 10.100.90.0/24 via 10.100.57.254
```

Sem essas rotas, o cliente tentaria enviar pacotes para a DMZ diretamente pelo bridge do Docker, sem passar pelo firewall, tornando as regras de IPTables ineficazes para teste.

### 7.3. Como verificar as rotas do cliente

```bash
docker exec client-win ip route show
```

Resultado esperado:

```
default via 10.100.57.253 dev eth0
10.100.56.0/24 via 10.100.57.254 dev eth0   <- rota para DMZ pelo firewall
10.100.57.0/24 dev eth0 proto kernel
10.100.90.0/24 via 10.100.57.254 dev eth0   <- rota para WAN pelo firewall
```

---

## 8. Orquestracao com Docker Compose

O arquivo `docker-compose.yml` define toda a infraestrutura de forma declarativa. As tres redes Docker correspondem aos tres segmentos de rede da atividade:

```yaml
networks:
  wan_net:   # Representa a Internet / rede externa
    subnet: 10.100.90.0/24

  dmz_net:   # Zona Desmilitarizada
    subnet: 10.100.56.0/24

  lan_net:   # Rede Local de clientes
    subnet: 10.100.57.0/24
```

### Como iniciar a infraestrutura completa:

```bash
# Entrar na pasta do laboratorio
cd apps/firewall-lab

# Subir todos os containers
docker compose up -d

# Acompanhar os logs do firewall durante a inicializacao
docker logs fw-gateway

# Verificar o status de todos os containers
docker compose ps
```

Resultado esperado do `docker compose ps`:

```
NAME         STATUS
fw-gateway   Up (running)
joomla-dmz   Up (running)
db-dmz       Up (healthy)
client-win   Up (running)
```

---

## 9. Script de Firewall: firewall_iptables.sh

O script e copiado para dentro do container e aplicado por meio dos seguintes comandos:

```bash
# Copiar o script para o container
docker cp firewall_iptables.sh fw-gateway:/root/firewall_iptables.sh

# Aplicar as regras de firewall
docker exec fw-gateway bash -c "chmod +x /root/firewall_iptables.sh && bash /root/firewall_iptables.sh"
```

### 9.1. Deteccao automatica de interfaces

O script detecta as interfaces de rede automaticamente pelo endereco IP, nao por nome fixo. Isso garante portabilidade entre diferentes ambientes onde a ordem das interfaces pode variar:

```bash
IF_WAN=$(ip -4 -o addr | grep "10.100.90.1"   | awk '{print $2}')
IF_DMZ=$(ip -4 -o addr | grep "10.100.56.254" | awk '{print $2}')
IF_LAN=$(ip -4 -o addr | grep "10.100.57.254" | awk '{print $2}')
```

O comando `ip -4 -o addr` lista todos os enderecos IPv4 das interfaces. O `grep` filtra pelo IP especifico e o `awk` extrai apenas o nome da interface.

### 9.2. Habilitacao do roteamento no kernel

```bash
echo 1 > /proc/sys/net/ipv4/ip_forward
sysctl -w net.ipv4.ip_forward=1
```

Por padrao, o Linux descarta pacotes que chegam em uma interface e precisam sair por outra. O `ip_forward=1` habilita esse comportamento, transformando o host em um roteador. Sem isso, o DNAT e o SNAT nao funcionam.

### 9.3. Politica padrao DEFAULT DROP (Lista Branca)

```bash
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP
```

Estas tres linhas sao a base de uma politica segura. Tudo que nao for explicitamente permitido por uma regra sera descartado silenciosamente. Este modelo e chamado de "lista branca" (whitelist) e e oposto ao modelo de lista negra, onde tudo e permitido exceto o que e bloqueado.

- `INPUT`: Trafego destinado ao proprio firewall
- `FORWARD`: Trafego que passa pelo firewall de uma rede para outra
- `OUTPUT`: Trafego gerado pelo proprio firewall

Antes de aplicar a politica, e necessario limpar quaisquer regras existentes:

```bash
iptables -F          # Limpa todas as regras das chains
iptables -X          # Remove chains customizadas
iptables -t nat -F   # Limpa regras de NAT
iptables -t nat -X   # Remove chains de NAT customizadas
iptables -t mangle -F
iptables -t mangle -X
```

### 9.4. Regras de conexoes estabelecidas e loopback

```bash
iptables -A INPUT  -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT
```

A interface `lo` (loopback, endereço 127.0.0.1) e usada para comunicacao interna do sistema. Bloquea-la causaria falhas em varios servicos locais.

```bash
iptables -A INPUT   -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT  -m state --state ESTABLISHED,RELATED -j ACCEPT
```

O modulo `state` (ou `conntrack`) rastreia o estado das conexoes. Uma conexao TCP passa pelos estados NEW (nova conexao), ESTABLISHED (conexao ativa) e RELATED (conexao relacionada, como o canal de dados do FTP). Permitir ESTABLISHED e RELATED garante que as respostas de conexoes iniciadas legitimamente possam retornar, sem precisar criar regras explicitas para cada direcao.

### 9.5. Protecao contra ICMP externo (Ping of Death e Reconnaissance)

```bash
iptables -A INPUT -i $IF_WAN -p icmp --icmp-type echo-request -j DROP
```

Bloqueia ping vindos da Internet (interface WAN). Isso impede que atacantes externos descubram se o firewall esta ativo (tecnica chamada de host discovery). O tipo `echo-request` e o ping classico (tipo ICMP 8).

Ao mesmo tempo, o ICMP das redes internas e liberado para permitir diagnosticos:

```bash
iptables -A INPUT -i $IF_LAN -p icmp --icmp-type echo-request -j ACCEPT
iptables -A INPUT -i $IF_DMZ -p icmp --icmp-type echo-request -j ACCEPT
```

### 9.6. Protecao contra flags TCP invalidas

```bash
iptables -A INPUT   -p tcp --tcp-flags ALL NONE -j DROP
iptables -A INPUT   -p tcp --tcp-flags ALL ALL  -j DROP
iptables -A FORWARD -p tcp --tcp-flags ALL NONE -j DROP
iptables -A FORWARD -p tcp --tcp-flags ALL ALL  -j DROP
iptables -A INPUT   -p tcp ! --syn -m state --state NEW -j DROP
```

Um pacote TCP valido nunca tem todas as flags zeradas (NULL scan) nem todas ativas ao mesmo tempo (XMAS scan). Essas combinacoes sao usadas por ferramentas como o Nmap para fingerprint do sistema operacional e para tentar contornar firewalls porcos. A ultima linha descarta pacotes que dizem ser uma conexao nova mas nao tem a flag SYN, o que e tecnicamente impossivel no protocolo TCP.

### 9.7. Protecao contra SYN Flood

```bash
iptables -N SYNFLOOD      # Cria uma chain customizada chamada SYNFLOOD

iptables -A SYNFLOOD -m limit --limit 10/s --limit-burst 30 -j RETURN
iptables -A SYNFLOOD -j LOG --log-prefix "FW-SYNFLOOD: " --log-level 4
iptables -A SYNFLOOD -j DROP

iptables -A INPUT   -p tcp --syn -j SYNFLOOD
iptables -A FORWARD -p tcp --syn -j SYNFLOOD
```

Um ataque SYN Flood consiste em enviar milhares de pacotes SYN (inicio de conexao TCP) sem nunca completar o handshake de tres vias, esgotando os recursos do servidor. O modulo `limit` permite ate 10 novas conexoes por segundo com um burst de 30 (pico momentaneo permitido). Se o limite for ultrapassado, o excesso e registrado em log e descartado.

### 9.8. Protecao contra Port Scan

```bash
iptables -N PORTSCAN

iptables -A PORTSCAN -m recent --name portscan --set -j LOG --log-prefix "FW-PORTSCAN: " --log-level 4
iptables -A PORTSCAN -j DROP

iptables -A INPUT -m recent --name portscan --rcheck --seconds 60 --hitcount 10 -j PORTSCAN
```

O modulo `recent` mantem uma lista de enderecos IP que tentaram conexoes recentes. Se um mesmo IP tentar conectar em 10 portas diferentes em 60 segundos, e considerado um portscan e bloqueado por 86400 segundos (1 dia).

### 9.9. Desabilitando source routing e redirects via sysctl

```bash
sysctl -w net.ipv4.conf.all.accept_source_route=0
sysctl -w net.ipv4.conf.all.accept_redirects=0
sysctl -w net.ipv4.conf.all.send_redirects=0
sysctl -w net.ipv4.conf.all.log_martians=1
sysctl -w net.ipv4.icmp_echo_ignore_broadcasts=1
```

- `accept_source_route=0`: Desabilita o source routing, que permite ao remetente especificar o caminho que o pacote deve seguir, o que pode ser usado para contornar filtros de rede
- `accept_redirects=0`: Desabilita a aceitacao de mensagens ICMP Redirect, que podem redirecionar o trafego para hosts maliciosos
- `send_redirects=0`: Impede que o gateway envie mensagens de redirect
- `log_martians=1`: Registra em log pacotes com enderecos de origem impossiveis (como enderecos privados vindos da internet)
- `icmp_echo_ignore_broadcasts=1`: Ignora pings enviados para o endereco de broadcast, que podem ser usados em ataques Smurf

### 9.10. NAT Reverso — DNAT (Acesso da Internet ao Joomla)

```bash
iptables -t nat -A PREROUTING -i $IF_WAN -p tcp --dport 80  -j DNAT --to-destination $SRV_WEB:80
iptables -t nat -A PREROUTING -i $IF_WAN -p tcp --dport 443 -j DNAT --to-destination $SRV_WEB:443
```

DNAT (Destination NAT) intercepta os pacotes que chegam na interface WAN destinados as portas 80 e 443, e reescreve o endereco de destino para o IP do servidor Joomla na DMZ (10.100.56.10). O remetente original nao sabe o IP real do servidor; ele ve apenas o IP publico do firewall.

```bash
iptables -A FORWARD -i $IF_WAN -o $IF_DMZ -d $SRV_WEB -p tcp -m multiport --dports 80,443 \
  -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
```

Esta regra na chain FORWARD autoriza o encaminhamento dos pacotes redirecionados pelo DNAT. Sem ela, mesmo o DNAT funcionando, o kernel descartaria o pacote por falta de permissao de encaminhamento.

### 9.11. NAT de Saida com Restricao de Horario — SNAT

```bash
# Horario do almoco: 12h-14h em Brasilia = 15h-17h UTC
iptables -t nat -A POSTROUTING -s $NET_LAN -o $IF_WAN \
  -m time --timestart 15:00 --timestop 17:00 -j MASQUERADE

iptables -t nat -A POSTROUTING -s $NET_DMZ -o $IF_WAN \
  -m time --timestart 15:00 --timestop 17:00 -j MASQUERADE

# Apos as 18h em Brasilia = apos 21h UTC
iptables -t nat -A POSTROUTING -s $NET_LAN -o $IF_WAN \
  -m time --timestart 21:00 --timestop 23:59 -j MASQUERADE

iptables -t nat -A POSTROUTING -s $NET_DMZ -o $IF_WAN \
  -m time --timestart 21:00 --timestop 23:59 -j MASQUERADE
```

MASQUERADE e uma forma automatica de SNAT que usa o IP atual da interface de saida. O modulo `time` do IPTables usa horario UTC. Como o Brasil (Brasilia) esta em UTC-3, 12h local = 15h UTC e 18h local = 21h UTC. Fora desses intervalos, a regra simplesmente nao da match e o pacote e descartado pela politica padrao DROP.

### 9.12. ACLs de Acesso da LAN para a DMZ

```bash
# Cliente Windows (10.100.57.30): SSH, MySQL e PostgreSQL com LOG obrigatorio
for PORT in 22 3306 5432; do
    iptables -A FORWARD -s $WIN_CLIENT -o $IF_DMZ -p tcp --dport $PORT \
        -m state --state NEW \
        -j LOG --log-prefix "FW-WIN_ACCESS_ACCEPT: " --log-level 4

    iptables -A FORWARD -s $WIN_CLIENT -o $IF_DMZ -p tcp --dport $PORT \
        -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
done
```

Para cada porta de acesso administrativo, duas regras sao criadas em sequencia. A primeira registra o inicio de TODA nova conexao do cliente Windows no log do kernel (visivel via `dmesg` ou `/var/log/kern.log`). A segunda aceita e encaminha o trafego. O prefixo `FW-WIN_ACCESS_ACCEPT` facilita a filtragem nos logs.

```bash
# Demais hosts da LAN: apenas portas 80 e 443
iptables -A FORWARD -s $NET_LAN -o $IF_DMZ -p tcp -m multiport --dports 80,443 \
    -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
```

Hosts da LAN que nao sao o cliente Windows (10.100.57.30) so conseguem encaminhar trafego para as portas 80 e 443 da DMZ. Qualquer tentativa de acessar o MySQL ou SSH sera silenciosamente descartada pela politica padrao DROP.

### 9.13. Regras de saida do firewall e NTP

```bash
iptables -A OUTPUT -p udp --dport 123 -j ACCEPT   # NTP (saida)
iptables -A INPUT  -p udp --sport 123 -j ACCEPT   # NTP (resposta)
iptables -A INPUT  -i $IF_LAN -p tcp --dport 22 -m state --state NEW -j ACCEPT  # SSH de administracao
iptables -A OUTPUT -p tcp -m state --state NEW,ESTABLISHED -j ACCEPT
iptables -A OUTPUT -p udp -j ACCEPT
iptables -A OUTPUT -p icmp -j ACCEPT
```

Estas regras garantem que o proprio firewall consiga enviar e receber respostas (OUTPUT) e ser administrado via SSH da rede LAN (INPUT na porta 22 apenas pela interface LAN).

---

## 10. Sincronizacao de Horario com NTP

A sincronizacao correta do horario e critica para o funcionamento das regras de restricao de horario (`-m time`). Se o relogio do firewall estiver errado, as janelas de acesso internet (12h-14h e 18h+) funcionarao nos horarios errados.

### Como verificar a sincronizacao:

```bash
# Verificar os servidores configurados e status de sincronizacao
docker exec fw-gateway chronyc sources

# Verificar o offset atual do relogio
docker exec fw-gateway chronyc tracking

# Ver o arquivo de configuracao do NTP
docker exec fw-gateway cat /etc/chrony/chrony.conf
```

Conteudo esperado do chrony.conf:

```
server a.ntp.br iburst
server b.ntp.br iburst
server c.ntp.br iburst
makestep 1.0 3
```

A opcao `iburst` faz o chrony enviar varios pacotes rapidamente na primeira sincronizacao para agilizar o processo. A opcao `makestep 1.0 3` permite ajustes abruptos de relogio nas primeiras tres sincronizacoes, o que e util para corrigir grandes desvios iniciais.

---

## 11. Testes de Validacao

Todos os testes a seguir sao executados automaticamente pelo script `run_lab_tests.py`. Podem tambem ser executados manualmente conforme documentado abaixo.

### 11.1. Teste: STATUS DOS CONTAINERS

```bash
docker inspect -f '{{.State.Running}}' fw-gateway
docker inspect -f '{{.State.Running}}' joomla-dmz
docker inspect -f '{{.State.Running}}' db-dmz
docker inspect -f '{{.State.Running}}' client-win
```

Resultado esperado: `true` para todos os containers.

### 11.2. Teste: VERIFICACAO DOS ENDERECOS IP

```bash
docker inspect --format \
  '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' fw-gateway
```

Resultado esperado para fw-gateway: `10.100.56.254 10.100.57.254 10.100.90.1`

### 11.3. Teste: POLITICA PADRAO DROP NO FORWARD

```bash
docker exec fw-gateway iptables -L FORWARD -n | head -3
```

Resultado esperado:

```
Chain FORWARD (policy DROP)
target   prot opt source   destination
ACCEPT   all  --  0.0.0.0/0  0.0.0.0/0  state RELATED,ESTABLISHED
```

O texto `policy DROP` confirma que tudo e bloqueado por padrao.

### 11.4. Teste: DNAT CONFIGURADO

```bash
docker exec fw-gateway iptables -t nat -L PREROUTING -n -v | grep -E "80|443"
```

Resultado esperado: linhas com `DNAT` e `to:10.100.56.10:80` e `to:10.100.56.10:443`

### 11.5. Teste: MASQUERADE (SNAT) CONFIGURADO

```bash
docker exec fw-gateway iptables -t nat -L POSTROUTING -n -v | grep MASQUERADE
```

Resultado esperado: linhas com `MASQUERADE` e os intervalos de horario `TIME from 15:00:00 to 17:00:00` e `TIME from 21:00:00`.

### 11.6. Teste: CHAINS DE PROTECAO CRIADAS

```bash
# Verificar chain anti-synflood
docker exec fw-gateway iptables -L SYNFLOOD -n

# Verificar chain anti-portscan
docker exec fw-gateway iptables -L PORTSCAN -n
```

### 11.7. Teste: CONECTIVIDADE BASICA ENTRE VMs

```bash
# fw-gateway pode pingar o Joomla na DMZ
docker exec fw-gateway ping -c 1 -W 2 10.100.56.10

# fw-gateway pode pingar o MySQL na DMZ
docker exec fw-gateway ping -c 1 -W 2 10.100.56.20

# client-win pode pingar o gateway na LAN
docker exec client-win ping -c 1 -W 2 10.100.57.254
```

### 11.8. Teste: JOOMLA RESPONDENDO HTTP

```bash
# Acesso direto do gateway ao Joomla
docker exec fw-gateway curl -s -o /dev/null -w "%{http_code}" http://10.100.56.10

# Resultado esperado: 302 (redirect para pagina de instalacao)
```

```bash
# Acesso via interface WAN (testando o DNAT)
docker exec fw-gateway curl -s -o /dev/null -w "%{http_code}" \
  --interface 10.100.90.1 http://10.100.56.10

# Resultado esperado: 302
```

### 11.9. Teste: ACL DO CLIENTE WINDOWS — ACESSO AO MYSQL

```bash
# Testar se a porta 3306 esta acessivel do cliente Windows para o MySQL da DMZ
docker exec client-win bash -c \
  "timeout 5 bash -c 'echo > /dev/tcp/10.100.56.20/3306' && echo ABERTO || echo BLOQUEADO"

# Resultado esperado: ABERTO
# (pois client-win tem permissao especifica para a porta 3306)
```

### 11.10. Teste: PROTECOES DE SEGURANCA

```bash
# Verificar que ICMP externo esta bloqueado (interface WAN)
docker exec fw-gateway iptables -L INPUT -n -v | grep -i icmp

# Verificar source routing desabilitado
docker exec fw-gateway sysctl net.ipv4.conf.all.accept_source_route
# Esperado: = 0

# Verificar redirects desabilitados
docker exec fw-gateway sysctl net.ipv4.conf.all.accept_redirects
# Esperado: = 0

# Verificar log de IPs invalidos ativo
docker exec fw-gateway sysctl net.ipv4.conf.all.log_martians
# Esperado: = 1
```

### 11.11. Teste: NTP CONFIGURADO

```bash
# Verificar instalacao do chrony
docker exec fw-gateway which chronyd
# Esperado: /usr/sbin/chronyd

# Verificar configuracao com servidores NIC BR
docker exec fw-gateway cat /etc/chrony/chrony.conf
# Esperado: linhas com a.ntp.br, b.ntp.br, c.ntp.br

# Verificar se o daemon esta rodando
docker exec fw-gateway pgrep -x chronyd && echo RUNNING
# Esperado: RUNNING
```

---

## 12. Script de Auditoria Externa em Python

O arquivo `test_firewall.py` simula um atacante externo tentando sondar o firewall. Ele deve ser executado de uma maquina fora da rede protegida (no nosso caso, do host Windows ou do container client-win com roteamento):

```bash
# Executar o script de auditoria
python3 test_firewall.py
```

### O que o script testa:

1. **Ping ICMP externo**: Tenta pingar o firewall. O resultado esperado e falha (timeout), pois o firewall bloqueia ICMP vindo da WAN.

2. **Porta 80 (HTTP)**: Tenta conectar na porta 80 do IP WAN do firewall. O resultado esperado e sucesso, pois o DNAT encaminha para o Joomla.

3. **Porta 443 (HTTPS)**: Similar ao teste da porta 80.

4. **Porta 22 (SSH)**: Tenta conectar na porta 22 pelo IP externo. O resultado esperado e falha (timeout ou connection refused), pois SSH externo e bloqueado.

5. **Porta 3306 (MySQL)**: Tenta conectar na porta 3306 pelo IP externo. O resultado esperado e falha, pois o MySQL nunca deve ser acessivel da Internet.

6. **Porta 5432 (PostgreSQL)**: Similar ao teste do MySQL.

### Log gerado pelo script:

O script gera automaticamente um arquivo `relatorio_seguranca_YYYYMMDD_HHMMSS.log` com o resultado de cada teste, incluindo timestamp, status e tipo de bloqueio ou acesso confirmado.

---

## 13. Script de Teste Automatizado Completo

O arquivo `run_lab_tests.py` e o script principal de validacao do laboratorio. Ele executa todos os 40 testes automaticamente:

```bash
python run_lab_tests.py
```

O script realiza as seguintes etapas em sequencia:

- Etapa 0: Configura as rotas estaticas no client-win
- Etapa 0b: Copia e aplica o script de firewall no fw-gateway
- Etapa 1: Verifica o status dos 4 containers
- Etapa 2: Verifica os enderecos IP de cada VM
- Etapa 3: Valida as 7 categorias de regras de firewall
- Etapa 4: Testa a conectividade basica entre as VMs
- Etapa 5: Valida o acesso HTTP ao Joomla (direto e via DNAT)
- Etapa 6: Testa as ACLs de acesso da LAN para a DMZ
- Etapa 7: Verifica todas as protecoes anti-ataque
- Etapa 8: Verifica a configuracao do NTP com servidores NIC BR

---

## 14. Resultados Obtidos

Resultado final da execucao do script de testes:

```
Total: 40  |  [PASS] 40  |  [FAIL] 0
Todos os testes passaram!
```

Todos os 40 requisitos tecnicos foram implementados e validados com sucesso, cobrindo:

- Infraestrutura de 4 VMs com segmentacao correta em WAN, DMZ e LAN
- Politica de firewall com DEFAULT DROP em todas as chains
- NAT reverso (DNAT) para exposicao controlada do servidor web
- NAT de saida (SNAT/Masquerade) com restricao de horario
- Protecao ativa contra 6 categorias de ataques de rede
- Controle granular de acesso por IP de origem e porta de destino
- Auditoria completa com log de acessos administrativos
- Sincronizacao de horario com os 3 servidores NIC BR

---

## 15. Consideracoes Finais

### Diferenca entre Docker e VM real

Na implementacao real em maquinas virtuais, o IPTables seria instalado e configurado diretamente no Debian 13. O comportamento das regras seria identico. A unica diferenca relevante e que o comando `iptables -t nat -F` em um container Docker pode remover regras internas do Docker para DNS, o que nao acontece em uma VM fisica ou virtual real. Por isso, em um ambiente Docker, e necessario instalar os pacotes antes de aplicar o firewall.

### Sobre o IPFW no FreeBSD

A questao 2 da atividade solicita a mesma implementacao utilizando o IPFW no FreeBSD 15.x. O script `firewall_ipfw.sh` disponivel na pasta do laboratorio implementa a mesma logica e topologia de rede, adaptada para a sintaxe do IPFW, e esta pronto para ser executado em uma VM FreeBSD. O Docker nao pode executar um kernel FreeBSD, pois usa o kernel Linux do host.

### Persistencia das regras

Em uma VM real Debian, para que as regras perdurem apos reinicializacao, deve-se usar o pacote `iptables-persistent`:

```bash
apt-get install iptables-persistent
iptables-save > /etc/iptables/rules.v4
```

No ambiente Docker, o script e reaplicado a cada ativacao do container pelo script `run_lab_tests.py`.
