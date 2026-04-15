# Questao 2 — Implementacao de Firewall com IPFW no FreeBSD 15.x

## Documentacao Tecnica Detalhada

Disciplina: Direito e Seguranca da Informacao
Atividade: Politica de Firewall com IPFW no FreeBSD 15.x

---

## Sumario

1. [Criar a VM com VBoxManage (PowerShell)](#1-criar-a-vm-com-vboxmanage-powershell)
2. [Instalar o FreeBSD 15.x](#2-instalar-o-freebsd-15x)
3. [Configurar a rede dentro do FreeBSD](#3-configurar-a-rede-dentro-do-freebsd)
4. [Instalar os pacotes necessarios](#4-instalar-os-pacotes-necessarios)
5. [Configurar o NTP com servidores NIC BR](#5-configurar-o-ntp-com-servidores-nic-br)
6. [Transferir o script firewall_ipfw.sh para a VM](#6-transferir-o-script-firewall_ipfwsh-para-a-vm)
7. [Habilitar o IPFW no boot](#7-habilitar-o-ipfw-no-boot)
8. [Aplicar o firewall e verificar as regras](#8-aplicar-o-firewall-e-verificar-as-regras)
9. [Configurar o SNAT por horario via cron](#9-configurar-o-snat-por-horario-via-cron)
10. [Testes completos dentro da VM](#10-testes-completos-dentro-da-vm)
11. [Resultados esperados por requisito](#11-resultados-esperados-por-requisito)

---

## 1. Criar a VM com VBoxManage (PowerShell)

Todos os comandos abaixo rodam no PowerShell do Windows com o VirtualBox instalado.
Nao e necessario abrir a interface grafica para criar a VM.

### 1.1. Definir o caminho base das VMs

```powershell
# Definir onde as VMs serao salvas (mudar conforme preferencia)
$VM_DIR = "C:\VMs"
$ISO_PATH = "C:\ISOs\FreeBSD-15.0-RELEASE-amd64-disc1.iso"
$VM_NAME = "fw-freebsd"

# Criar a pasta base caso nao exista
New-Item -ItemType Directory -Force -Path $VM_DIR
```

### 1.2. Criar as redes Host-Only no VirtualBox

```powershell
# Criar a rede Host-Only para WAN
VBoxManage hostonlyif create
# Anotar o nome retornado (ex: "VirtualBox Host-Only Ethernet Adapter #2")

VBoxManage hostonlyif ipconfig "VirtualBox Host-Only Ethernet Adapter" `
  --ip 10.100.90.254 --netmask 255.255.255.0

# Criar a rede Host-Only para DMZ
VBoxManage hostonlyif create
VBoxManage hostonlyif ipconfig "VirtualBox Host-Only Ethernet Adapter #2" `
  --ip 10.100.56.253 --netmask 255.255.255.0

# Criar a rede Host-Only para LAN
VBoxManage hostonlyif create
VBoxManage hostonlyif ipconfig "VirtualBox Host-Only Ethernet Adapter #3" `
  --ip 10.100.57.253 --netmask 255.255.255.0

# Listar as redes criadas para confirmar
VBoxManage list hostonlyifs | Select-String "Name|IPAddress"
```

### 1.3. Criar a VM e o disco

```powershell
# Criar a VM
VBoxManage createvm `
  --name "$VM_NAME" `
  --ostype "FreeBSD_64" `
  --register `
  --basefolder "$VM_DIR"

# Configurar hardware
VBoxManage modifyvm "$VM_NAME" `
  --memory 1024 `
  --cpus 1 `
  --boot1 dvd `
  --boot2 disk `
  --boot3 none `
  --nic1 hostonly `
  --hostonlyadapter1 "VirtualBox Host-Only Ethernet Adapter" `
  --nic2 hostonly `
  --hostonlyadapter2 "VirtualBox Host-Only Ethernet Adapter #2" `
  --nic3 hostonly `
  --hostonlyadapter3 "VirtualBox Host-Only Ethernet Adapter #3" `
  --audio none `
  --usb off

# Criar o disco rigido virtual (10 GB)
VBoxManage createhd `
  --filename "$VM_DIR\$VM_NAME\$VM_NAME.vdi" `
  --size 10240 `
  --format VDI

# Adicionar controladora SATA
VBoxManage storagectl "$VM_NAME" `
  --name "SATA Controller" `
  --add sata `
  --controller IntelAhci

# Conectar o disco a controladora
VBoxManage storageattach "$VM_NAME" `
  --storagectl "SATA Controller" `
  --port 0 --device 0 `
  --type hdd `
  --medium "$VM_DIR\$VM_NAME\$VM_NAME.vdi"

# Conectar a ISO do FreeBSD
VBoxManage storageattach "$VM_NAME" `
  --storagectl "SATA Controller" `
  --port 1 --device 0 `
  --type dvddrive `
  --medium "$ISO_PATH"

# Verificar se a VM foi criada corretamente
VBoxManage showvminfo "$VM_NAME"
```

### 1.4. Iniciar a VM

```powershell
# Iniciar a VM com interface grafica
VBoxManage startvm "$VM_NAME"

# OU iniciar sem janela (headless - acesso apenas por serial ou SSH depois)
VBoxManage startvm "$VM_NAME" --type headless
```

---

## 2. Instalar o FreeBSD 15.x

Apos iniciar a VM, o instalador `bsdinstall` e exibido. Use o teclado para navegar.

### 2.1. Sequencia de escolhas no instalador

```
Tela 1: Escolher "Install"

Tela 2: Keymap
  Escolher "Latin American" ou "Brazilian" se disponivel
  Se nao encontrar, usar "US Default" e configurar depois

Tela 3: Hostname
  Digitar: fw-freebsd
  Pressionar Enter

Tela 4: Optional System Components
  Marcar: base-dbg, lib32, ports
  Desmarcar: doc (para economizar espaco)
  Confirmar com OK

Tela 5: Particoes
  Escolher "Auto (UFS)" para simplicidade

Tela 6: Disco
  Selecionar o disco disponivel (ex: ada0 ou da0)
  Confirmar "Entire Disk"

Tela 7: Particao
  Confirmar o esquema MBR ou GPT (GPT recomendado)
  Confirmar com Finish

Tela 8: Aguardar a instalacao (copia de arquivos)

Tela 9: Root Password
  Definir uma senha segura para o usuario root
  Repetir a senha

Tela 10: Network Interface
  Selecionar em0 (primeira interface)
  IPv4: Yes
  DHCP: No (recusar)
  IP: 10.100.90.1
  Subnet: 255.255.255.0
  Gateway: 10.100.90.254
  IPv6: No
  Resolver: 8.8.8.8

Tela 11: Clock UTC? Yes

Tela 12: Timezone
  America > Brazil > East (para Brasilia)

Tela 13: System Configuration
  Marcar: sshd, ntpdate, ntpd, dumpdev
  Desmarcar: moused, sendmail

Tela 14: Add User? (opcional)
  No (usaremos root por enquanto)

Tela 15: Final Configuration
  Exit

Tela 16: Manual Configuration?
  No (sair e reiniciar)

Reiniciar. Retirar a ISO quando pedir.
```

### 2.2. Retirar a ISO apos a instalacao

```powershell
# Rodar no PowerShell do Windows apos a instalacao
VBoxManage storageattach "fw-freebsd" `
  --storagectl "SATA Controller" `
  --port 1 --device 0 `
  --type dvddrive `
  --medium emptydrive
```

---

## 3. Configurar a Rede dentro do FreeBSD

Fazer login como root. Todos os comandos abaixo rodam DENTRO da VM FreeBSD.

### 3.1. Verificar as interfaces disponiveis

```sh
# Listar todas as interfaces de rede e seus MACs
ifconfig -a

# O FreeBSD nomeia as interfaces por driver:
# em0, em1, em2  - para placas Intel (mais comum no VirtualBox)
# vtnet0, vtnet1  - para placas VirtIO
# re0, re1        - para placas Realtek

# Verificar qual interface tem qual IP (WAN configurada no instalador deve ter 10.100.90.1)
ifconfig em0
```

### 3.2. Editar o rc.conf com toda a configuracao

```sh
# Abrir o editor ee (mais facil que vi)
ee /etc/rc.conf
```

Dentro do editor `ee`: use as setas para navegar, Backspace para apagar, e `Ctrl+C` -> `a` para salvar e sair.

Digitar o seguinte conteudo (substituir o conteudo existente se necessario):

```sh
# /etc/rc.conf - Configuracao do fw-freebsd

hostname="fw-freebsd"

# ---- Interfaces de rede ----
# em0 = WAN (Internet simulada)
ifconfig_em0="inet 10.100.90.1 netmask 255.255.255.0"

# em1 = DMZ (Servidores Joomla e MySQL)
ifconfig_em1="inet 10.100.56.254 netmask 255.255.255.0"

# em2 = LAN (Clientes internos)
ifconfig_em2="inet 10.100.57.254 netmask 255.255.255.0"

# ---- Roteamento ----
# Habilitar encaminhamento de pacotes entre interfaces (essencial para o gateway)
gateway_enable="YES"

# ---- Firewall IPFW ----
firewall_enable="YES"
firewall_type="open"
firewall_script="/root/firewall_ipfw.sh"
firewall_logging="YES"

# ---- NTP ----
ntpd_enable="YES"
ntpd_flags="-g"
ntpdate_enable="YES"
ntpdate_hosts="a.ntp.br"
```

### 3.3. Aplicar as configuracoes de rede sem reiniciar

```sh
# Aplicar os IPs em cada interface manualmente
ifconfig em0 inet 10.100.90.1 netmask 255.255.255.0
ifconfig em1 inet 10.100.56.254 netmask 255.255.255.0
ifconfig em2 inet 10.100.57.254 netmask 255.255.255.0

# Habilitar o roteamento IP imediatamente
sysctl net.inet.ip.forwarding=1

# Verificar o resultado
ifconfig em0 | grep inet
ifconfig em1 | grep inet
ifconfig em2 | grep inet
```

### 3.4. Verificar a tabela de roteamento

```sh
netstat -rn

# Resultado esperado: rotas para as tres redes listadas
# Destination    Gateway    Flags    Netif
# 10.100.90.0/24  link#1    U        em0
# 10.100.56.0/24  link#2    U        em1
# 10.100.57.0/24  link#3    U        em2
```

---

## 4. Instalar os Pacotes Necessarios

```sh
# Atualizar os repositorios de pacotes
pkg update

# Se aparecer mensagem para instalar o pkg primeiro, confirmar com "y"

# Instalar ferramentas uteis para testes e diagnostico
pkg install -y bash curl wget nmap netcat tcpdump

# Verificar se o pkg instalou corretamente
pkg info | head -10
```

---

## 5. Configurar o NTP com Servidores NIC BR

O FreeBSD usa o `ntpd` nativo. A configuracao dos servidores do NIC BR e feita no `/etc/ntp.conf`.

### 5.1. Editar o arquivo de configuracao do NTP

```sh
ee /etc/ntp.conf
```

Substituir o conteudo pelo seguinte:

```
# /etc/ntp.conf - Servidores NIC BR (Requisito da atividade)

# Servidores NTP do NIC BR (Comite Gestor da Internet no Brasil)
server a.ntp.br iburst
server b.ntp.br iburst
server c.ntp.br iburst

# Deriva do relogio salva em arquivo
driftfile /var/db/ntp/ntp.drift

# Restricoes de seguranca
restrict default nomodify notrap nopeer noquery
restrict 127.0.0.1
restrict ::1

# Passo de ajuste: permite correcoes grandes nas primeiras sincs
tinker stepout 0
tos minstep 0.0
```

### 5.2. Sincronizar o horario agora (sem esperar o ntpd)

```sh
# Sincronizacao imediata (pode demorar alguns segundos)
ntpdate a.ntp.br

# Resultado esperado:
# server a.ntp.br, port 123
# adjust time server X offset +0.00xxxx sec

# Iniciar o servico ntpd
service ntpd start

# Verificar o status da sincronizacao
ntpq -p

# Resultado esperado: tabela com a.ntp.br, b.ntp.br e c.ntp.br
# * indica o servidor em uso     + indica candidato
```

### 5.3. Verificar que o horario esta correto

```sh
# Ver o horario atual do sistema
date

# Configurar o fuso horario para Brasilia (se nao feito no instalador)
tzsetup

# Escolher: America > Brazil > East

# Verificar novamente
date
# Esperado: horario de Brasilia (UTC-3)
```

---

## 6. Transferir o Script firewall_ipfw.sh para a VM

### Opcao A: Digitar diretamente na VM (mais simples)

```sh
# Criar o arquivo com o editor ee
ee /root/firewall_ipfw.sh
```

Digitar o conteudo completo do script `firewall_ipfw.sh` disponivel em `apps/firewall-lab/firewall_ipfw.sh` neste repositorio.

Conteudo do script (digitar dentro do ee):

```sh
#!/bin/sh
# IPFW Firewall - FreeBSD 15.x - Questao 2

IPFW="/sbin/ipfw -q"
IF_WAN="em0"
IF_DMZ="em1"
IF_LAN="em2"
IP_WAN="10.100.90.1"
NET_DMZ="10.100.56.0/24"
NET_LAN="10.100.57.0/24"
SRV_WEB="10.100.56.10"
SRV_DB="10.100.56.20"
WIN_CLIENT="10.100.57.30"

echo "=== Aplicando regras IPFW ==="

${IPFW} flush
sysctl -q -w net.inet.ip.forwarding=1
sysctl -q -w net.inet.ip.fw.verbose=1

# Loopback livre
${IPFW} add 100 allow ip from any to any via lo0

# DNAT: redirecionar portas 80 e 443 WAN para o Joomla na DMZ
${IPFW} nat 1 config if ${IF_WAN} reset same_ports \
    redirect_port tcp ${SRV_WEB}:80  80  \
    redirect_port tcp ${SRV_WEB}:443 443
${IPFW} add 200 nat 1 ip from any to any in  via ${IF_WAN}
${IPFW} add 210 nat 1 ip from any to any out via ${IF_WAN}

# Stateful tracking
${IPFW} add 500 check-state

# Bloquear ICMP externo (da WAN)
${IPFW} add 1000 deny icmp from any to any in via ${IF_WAN} icmptypes 8

# Permitir ICMP interno (diagnostico da LAN e DMZ)
${IPFW} add 1010 allow icmp from any to any via ${IF_DMZ}
${IPFW} add 1020 allow icmp from any to any via ${IF_LAN}

# TCP flags invalidas (NULL scan, XMAS scan)
${IPFW} add 1100 deny tcp from any to any tcpflags fin,syn,rst,psh,ack,urg
${IPFW} add 1120 deny tcp from any to any established tcpflags !ack

# Anti SYN Flood: limitar 20 conexoes simultaneas por IP de origem
${IPFW} add 1300 allow tcp from any to ${SRV_WEB} 80  setup limit src-addr 20 keep-state
${IPFW} add 1310 allow tcp from any to ${SRV_WEB} 443 setup limit src-addr 20 keep-state

# ACL: cliente Windows -> SSH(22), MySQL(3306), PostgreSQL(5432) com LOG
${IPFW} add 3000 allow log tcp from ${WIN_CLIENT} to ${SRV_WEB} 22   setup keep-state
${IPFW} add 3010 allow log tcp from ${WIN_CLIENT} to ${SRV_DB}  22   setup keep-state
${IPFW} add 3020 allow log tcp from ${WIN_CLIENT} to ${SRV_DB}  3306 setup keep-state
${IPFW} add 3030 allow log tcp from ${WIN_CLIENT} to ${SRV_DB}  5432 setup keep-state

# LAN -> DMZ: demais hosts somente 80 e 443
${IPFW} add 4000 allow tcp from ${NET_LAN} to ${NET_DMZ} 80  setup keep-state
${IPFW} add 4010 allow tcp from ${NET_LAN} to ${NET_DMZ} 443 setup keep-state
${IPFW} add 4099 deny log ip from ${NET_LAN} to ${NET_DMZ}

# NTP saindo do firewall
${IPFW} add 5000 allow udp from me to any 123 keep-state
${IPFW} add 5010 allow udp from any 123 to me keep-state

# SSH de administracao da LAN para o firewall
${IPFW} add 5100 allow tcp from ${NET_LAN} to me 22 setup keep-state

# OUTPUT do proprio firewall
${IPFW} add 6000 allow tcp from me to any setup keep-state
${IPFW} add 6010 allow udp from me to any keep-state

# SNAT (internet access): ativado/desativado pelo cron
# Regra 6500 e 6510 sao adicionadas/removidas pelo cron

# BLOQUEAR E REGISTRAR TUDO O MAIS
${IPFW} add 65534 deny log ip from any to any

echo "=== IPFW configurado! Regras aplicadas: ==="
/sbin/ipfw -a list
```

### Opcao B: Via SCP se tiver SSH habilitado na VM

```powershell
# Rodar no PowerShell do Windows
# Navegar ate a pasta do laboratorio
cd C:\Users\itofr\Documents\Github\trabalhos-faculdade\direito-seguranca\token_nodejs\apps\firewall-lab

# Copiar o script para a VM FreeBSD via SCP
scp firewall_ipfw.sh root@10.100.90.1:/root/firewall_ipfw.sh

# Senha: a senha de root que voce definiu na instalacao
```

---

## 7. Habilitar o IPFW no Boot

```sh
# Carregar o modulo do IPFW agora (sem reboot)
kldload ipfw
kldload ipfw_nat

# Verificar se foi carregado
kldstat | grep ipfw
# Esperado: ipfw.ko e ipfw_nat.ko listados

# Adicionar ao /etc/rc.conf para persistir apos reboot
sysrc firewall_enable="YES"
sysrc firewall_script="/root/firewall_ipfw.sh"
sysrc firewall_logging="YES"
sysrc gateway_enable="YES"

# Verificar o rc.conf
grep -E "firewall|gateway" /etc/rc.conf
```

---

## 8. Aplicar o Firewall e Verificar as Regras

```sh
# Dar permissao de execucao ao script
chmod +x /root/firewall_ipfw.sh

# Executar o script de firewall
sh /root/firewall_ipfw.sh

# Verificar o codigo de retorno (0 = sucesso)
echo "Codigo: $?"

# Listar TODAS as regras aplicadas com contadores de pacotes
ipfw -a list

# Listar as regras de NAT configuradas
ipfw nat list

# Verificar as regras de log especificamente
ipfw -a list | grep log
```

### 8.1. Resultado esperado do `ipfw -a list`

```
00100     0     0 allow ip from any to any via lo0
00200     0     0 nat 1 ip from any to any in via em0
00210     0     0 nat 1 ip from any to any out via em0
00500     0     0 check-state :default
01000     0     0 deny icmp from any to any in via em0 icmptypes 8
01010     0     0 allow icmp from any to any via em1
01020     0     0 allow icmp from any to any via em2
01100     0     0 deny tcp from any to any tcpflags fin,syn,rst,psh,ack,urg
01120     0     0 deny tcp from any to any established tcpflags !ack
01300     0     0 allow tcp from any to 10.100.56.10 80 setup limit src-addr 20
01310     0     0 allow tcp from any to 10.100.56.10 443 setup limit src-addr 20
03000     0     0 allow log tcp from 10.100.57.30 to 10.100.56.10 22 setup
03010     0     0 allow log tcp from 10.100.57.30 to 10.100.56.20 22 setup
03020     0     0 allow log tcp from 10.100.57.30 to 10.100.56.20 3306 setup
03030     0     0 allow log tcp from 10.100.57.30 to 10.100.56.20 5432 setup
04000     0     0 allow tcp from 10.100.57.0/24 to 10.100.56.0/24 80 setup
04010     0     0 allow tcp from 10.100.57.0/24 to 10.100.56.0/24 443 setup
04099     0     0 deny log ip from 10.100.57.0/24 to 10.100.56.0/24
05000     0     0 allow udp from me to any 123
05010     0     0 allow udp from any 123 to me
05100     0     0 allow tcp from 10.100.57.0/24 to me 22 setup
06000     0     0 allow tcp from me to any setup
06010     0     0 allow udp from me to any
65534     0     0 deny log ip from any to any
```

---

## 9. Configurar o SNAT por Horario via Cron

O FreeBSD IPFW nao tem modulo `time` nativo como o Linux IPTables. A restricao de horario e implementada via cron: um script habilita e desabilita as regras de SNAT nos horarios corretos.

### 9.1. Criar o script de ativacao do SNAT

```sh
ee /root/snat_ativar.sh
```

Conteudo:

```sh
#!/bin/sh
# Ativar SNAT (acesso internet para LAN e DMZ)
# Chamado pelo cron nos horarios: 12h-14h e 18h+ (Brasilia)
/sbin/ipfw -q add 6500 allow ip from 10.100.57.0/24 to any out via em0 keep-state
/sbin/ipfw -q add 6510 allow ip from 10.100.56.0/24 to any out via em0 keep-state
logger "IPFW: SNAT ativado em $(date)"
```

### 9.2. Criar o script de desativacao do SNAT

```sh
ee /root/snat_desativar.sh
```

Conteudo:

```sh
#!/bin/sh
# Desativar SNAT (bloquear acesso internet)
# Remove as regras 6500 e 6510 se existirem
/sbin/ipfw -q delete 6500 2>/dev/null
/sbin/ipfw -q delete 6510 2>/dev/null
logger "IPFW: SNAT desativado em $(date)"
```

### 9.3. Dar permissao de execucao e testar

```sh
chmod +x /root/snat_ativar.sh
chmod +x /root/snat_desativar.sh

# Testar ativacao
sh /root/snat_ativar.sh
ipfw -a list | grep 6500
# Esperado: regra 6500 listada

# Testar desativacao
sh /root/snat_desativar.sh
ipfw -a list | grep 6500
# Esperado: linha vazia (regra foi removida)
```

### 9.4. Configurar o cron com os horarios da atividade

```sh
# Abrir o crontab do root
crontab -e
```

Adicionar as seguintes linhas (os horarios sao em UTC, Brasilia = UTC-3):

```
# SNAT: Horario de almoco - Brasilia 12h = UTC 15h
# Ativar as 12h (15h UTC)
0 15 * * * /root/snat_ativar.sh

# Desativar as 14h (17h UTC)
0 17 * * * /root/snat_desativar.sh

# Ativar apos as 18h (21h UTC)
0 21 * * * /root/snat_ativar.sh

# Desativar a meia-noite (3h UTC do dia seguinte)
0 3 * * * /root/snat_desativar.sh
```

### 9.5. Verificar o cron

```sh
# Listar o crontab do root
crontab -l

# Verificar se o cron esta rodando
service cron status

# Iniciar o cron se nao estiver ativo
service cron start
```

---

## 10. Testes Completos dentro da VM

Todos os comandos abaixo rodam DENTRO da VM FreeBSD.

### 10.1. Teste: verificar configuracao das interfaces

```sh
# T1: Listar todos os IPs configurados
ifconfig -a | grep "inet "
# Esperado:
#   inet 127.0.0.1        <- loopback
#   inet 10.100.90.1      <- WAN (em0)
#   inet 10.100.56.254    <- DMZ (em1)
#   inet 10.100.57.254    <- LAN (em2)

# T2: Verificar o roteamento habilitado
sysctl net.inet.ip.forwarding
# Esperado: net.inet.ip.forwarding: 1

# T3: Tabela de roteamento completa
netstat -rn | grep -v "^::"
# Esperado: entradas para 10.100.90.0, 10.100.56.0 e 10.100.57.0
```

### 10.2. Teste: verificar o IPFW carregado

```sh
# T4: Verificar modulos carregados
kldstat | grep ipfw
# Esperado: ipfw.ko e ipfw_nat.ko

# T5: Contar o numero de regras aplicadas
ipfw -a list | wc -l
# Esperado: pelo menos 20 regras

# T6: Ver a regra padrao de bloqueio
ipfw -a list | tail -3
# Esperado: 65534 - deny log ip from any to any
```

### 10.3. Teste: verificar as regras especificas

```sh
# T7: Verificar DNAT do Joomla
ipfw nat list
# Esperado: nat 1 config ... redirect_port tcp 10.100.56.10:80 80

# T8: Verificar regras de controle do cliente Windows
ipfw -a list | grep 10.100.57.30
# Esperado: 4 regras allow log para portas 22, 3306, 5432

# T9: Verificar regra de bloqueio LAN->DMZ para outras portas
ipfw -a list | grep "4099"
# Esperado: 04099 deny log ip from 10.100.57.0/24 to 10.100.56.0/24

# T10: Verificar protecao ICMP externo
ipfw -a list | grep "icmp"
# Esperado: regra 1000 deny icmp via em0 icmptypes 8

# T11: Verificar protecao TCP flags invalidas
ipfw -a list | grep "tcpflags"
# Esperado: regras 1100 e 1120 com deny
```

### 10.4. Teste: verificar o NTP

```sh
# T12: Status da sincronizacao NTP
ntpq -p
# Esperado: tabela com a.ntp.br b.ntp.br c.ntp.br
#   *a.ntp.br  significa que este servidor esta sendo usado

# T13: Ver o arquivo de configuracao
cat /etc/ntp.conf | grep server
# Esperado: server a.ntp.br iburst
#          server b.ntp.br iburst
#          server c.ntp.br iburst

# T14: Forcar sincronizacao manual
ntpdate a.ntp.br
# Esperado: "adjust time server ... offset ..."

# T15: Ver horario atual
date
# Esperado: horario de Brasilia
```

### 10.5. Teste: verificar o SNAT por horario

```sh
# T16: Ativar manualmente o SNAT para teste
sh /root/snat_ativar.sh

# T17: Verificar se as regras foram adicionadas
ipfw -a list | grep -E "6500|6510"
# Esperado: duas regras allow para LAN e DMZ via em0

# T18: Desativar e verificar a remocao
sh /root/snat_desativar.sh
ipfw -a list | grep -E "6500|6510"
# Esperado: VAZIO (regras removidas)

# T19: Ver o crontab configurado
crontab -l | grep snat
# Esperado: 4 entradas no cron para os horarios de ativacao/desativacao
```

### 10.6. Teste: verificar a persistencia apos reboot

```sh
# T20: Ver que o firewall esta configurado para boot automatico
grep -E "firewall|gateway" /etc/rc.conf
# Esperado:
#   gateway_enable="YES"
#   firewall_enable="YES"
#   firewall_script="/root/firewall_ipfw.sh"
#   firewall_logging="YES"

# T21: Simular o reload do servico (sem reboot)
service ipfw restart
# Ou:
sh /etc/rc.d/ipfw restart

# Verificar novamente as regras
ipfw -a list | wc -l
# Esperado: mesmo numero de regras de antes
```

### 10.7. Teste: verificar os logs de acesso

```sh
# T22: Ver os logs gerados pelo IPFW em tempo real
# (em outro terminal, gerar trafego para ver os logs sendo gerados)
tail -f /var/log/security

# T23: Verificar os logs de pacotes bloqueados
cat /var/log/security | grep "ipfw" | tail -20

# T24: Verificar os logs do cliente Windows (porta 3306)
cat /var/log/security | grep "3306" | tail -10
# Esperado: entradas de log quando o cliente Windows acessa o MySQL
```

### 10.8. Teste: diagnostico de conectividade

```sh
# T25: Testar alcance do host Windows (se na mesma rede Host-Only)
ping -c 3 10.100.57.30
# Esperado: respostas (se o container ou VM do cliente estiver rodando)

# T26: Testar alcance do servidor Joomla na DMZ
ping -c 3 10.100.56.10
# Esperado: respostas (se o container Joomla estiver rodando)

# T27: Testar porta HTTP do Joomla
nc -zv 10.100.56.10 80
# Esperado: Connection to 10.100.56.10 80 port [tcp/http] succeeded!

# T28: Testar porta MySQL
nc -zv 10.100.56.20 3306
# Esperado: Connection to 10.100.56.20 3306 port [tcp/mysql] succeeded!

# T29: Testar que a porta 22 NAO esta acessivel da WAN (do proprio gateway)
nc -zv 10.100.90.1 22
# Esperado: bloqueado (o firewall nao permite SSH pela WAN)
```

---

## 11. Resultados Esperados por Requisito

| Requisito da Atividade | Comando de Verificacao | Resultado Esperado |
|---|---|---|
| Firewall com IPFW no FreeBSD 15.x | `ipfw -a list` | Lista de regras numeradas 100-65534 |
| DNAT: Joomla exposto so portas 80/443 | `ipfw nat list` | redirect_port tcp 10.100.56.10:80 80 |
| Bloqueio de todo o resto da WAN | `ipfw -a list tail` | 65534 deny log ip from any to any |
| Windows client acessa SSH+MySQL+PG | `ipfw -a list grep 10.100.57.30` | 4 regras allow log |
| Log dos acessos do cliente Windows | `cat /var/log/security` | Entradas com IP 10.100.57.30 |
| Demais hosts LAN so 80/443 | `ipfw -a list grep 4099` | deny log ip from 10.100.57.0/24 |
| SNAT com restricao de horario | `crontab -l` | 4 entradas de cron |
| ICMP externo bloqueado | `ipfw -a list grep icmp` | deny icmp via em0 icmptypes 8 |
| TCP flags invalidas bloqueadas | `ipfw -a list grep tcpflags` | deny tcp tcpflags urg |
| Anti SYN Flood | `ipfw -a list grep limit` | limit src-addr 20 |
| Source routing desabilitado | `sysctl net.inet.ip.accept_sourceroute` | 0 |
| Firewall inicia no boot | `grep firewall /etc/rc.conf` | firewall_enable="YES" |
| NTP com NIC BR | `ntpq -p` | Servidores a.ntp.br b.ntp.br c.ntp.br |
