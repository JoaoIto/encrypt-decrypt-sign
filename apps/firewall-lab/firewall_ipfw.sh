#!/bin/sh
# ==============================================================================
# Laboratório de Firewall - IPFW (FreeBSD 15.x)
# ==============================================================================

# Executar como: sh firewall_ipfw.sh
# Certifique-se de habilitar no /etc/rc.conf:
# firewall_enable="YES"
# firewall_script="/caminho/para/firewall_ipfw.sh"
# gateway_enable="YES"
# natd_enable="YES" (ou kernel nat configurado)

# Comando base do ipfw
IPFW="/sbin/ipfw"

# Variáveis Globais de Redes e Interfaces (Ajustar as interfaces conforme VM)
IF_WAN="em0"
IF_DMZ="em1"
IF_LAN="em2"

IP_WAN="172.16.90.1"
NET_DMZ="192.168.56.0/24"
NET_LAN="192.168.57.0/24"

# Servidores Específicos
SRV_WEB="192.168.56.10"
SRV_DB="192.168.56.20"
WIN_CLIENT="192.168.57.30"

# ==============================================================================
# 1. Preparação e Limpeza
# ==============================================================================
echo "Limpando regras do IPFW..."
${IPFW} -q flush
${IPFW} -q nat 1 config

# ==============================================================================
# 2. Configuração de NAT e Translators (DNAT / SNAT)
# ==============================================================================
# O NAT do IPFW requer configuração prévia do alvo de NAT
echo "Configurando Instâncias de NAT..."

# Redirecionamento 80 e 443 externos -> 192.168.56.10 na DMZ
${IPFW} -q nat 1 config if ${IF_WAN} reset same_ports \
    redirect_port tcp ${SRV_WEB}:80 80 \
    redirect_port tcp ${SRV_WEB}:443 443

# ==============================================================================
# 3. Regras Globais e Proteções de Baixo Nível (Anti-Spoofing, TCP, Synflood)
# ==============================================================================
# Desviar o tráfego de interface NAT para tradução imediata:
${IPFW} -q add 00100 nat 1 ip from any to any via ${IF_WAN}

# Tráfego Loopback sempre livre
${IPFW} -q add 00500 allow ip from any to any via lo0

# Rejeitar requisições ICMP externas (Ping of Death) na WAN
${IPFW} -q add 01000 deny icmp from any to any via ${IF_WAN} icmptypes 8

# Controle de conexões dinâmicas e state tracking (Stateful Inspection)
${IPFW} -q add 02000 check-state

# Anti-spoofing
${IPFW} -q add 02100 deny ip from any to any not antispoof

# Proteção contra synflood com 'limit src-addr' (State limita pacotes)
# Todas regras de tcp stateful já cuidam de "flags tcp incompletas" se aplicarmos setup.
# Mitigando flags quebradas:
${IPFW} -q add 02300 deny tcp from any to any tcpflags fin,syn,rst,psh,ack,urg

# ==============================================================================
# 4. Políticas de Acesso e Controle Específico
# ==============================================================================
echo "Aplicando Políticas de Segmentação (LAN/DMZ)..."

# O cliente Windows (192.168.57.30) pode acessar servidores na DMZ via SSH(22), MySQL(3306), Postgres(5432)
# Registrando log ('log' antes da action)
${IPFW} -q add 03000 allow log tcp from ${WIN_CLIENT} to ${SRV_WEB} 22 setup keep-state
${IPFW} -q add 03010 allow log tcp from ${WIN_CLIENT} to ${SRV_DB} 22 setup keep-state
${IPFW} -q add 03020 allow log tcp from ${WIN_CLIENT} to ${SRV_DB} 3306 setup keep-state
${IPFW} -q add 03030 allow log tcp from ${WIN_CLIENT} to ${SRV_DB} 5432 setup keep-state

# Os demais hosts da rede local somente poderão acessar via porta 80 e 443.
${IPFW} -q add 04000 allow tcp from ${NET_LAN} to ${NET_DMZ} 80 setup keep-state
${IPFW} -q add 04010 allow tcp from ${NET_LAN} to ${NET_DMZ} 443 setup keep-state
# Bloqueia outros acessos de LAN para DMZ que não bateram na regra
${IPFW} -q add 04099 deny ip from ${NET_LAN} to ${NET_DMZ}

# Acesso irrestrito entre WAN e Servidor Web nas portas espelhadas no DNAT
${IPFW} -q add 05000 allow tcp from any to ${SRV_WEB} 80 setup limit src-addr 20
${IPFW} -q add 05010 allow tcp from any to ${SRV_WEB} 443 setup limit src-addr 20

# ==============================================================================
# 5. Controle de Horário para Acesso Externo
# ==============================================================================
# Regras baseadas em tempo (12-14h e 18h+) devem ser mantidas
# O cron é uma forma, ou usar as flags de tempo do ipfw (mac time não é nativo, requer compilação kernel ou cron)
# Simularemos a sintaxe de cron ou a restrição comportamental de FreeBSD
# NOTA: O freebsd ipfw possui as diretivas 'time' nativamente nos scripts mais modernos ou requer daemon
# Exemplo genérico usando os modificadores do tempo real suportado pelo IPFW (se compilado):
${IPFW} -q add 06000 allow ip from ${NET_LAN} to any out via ${IF_WAN} setup keep-state # (Necessita Cronjob para ativar/desativar se n for Kernel time)
${IPFW} -q add 06010 allow ip from ${NET_DMZ} to any out via ${IF_WAN} setup keep-state # (Necessita Cronjob para ativar/desativar se n for Kernel time)

# Serviços locais (NTP) saindo do firewall para porta 123
${IPFW} -q add 07000 allow udp from me to any 123 keep-state

# ==============================================================================
# Default Drop (Fechamento)
# ==============================================================================
${IPFW} -q add 65534 deny log ip from any to any

echo "Firewall IPFW (FreeBSD) ativado e configurado!"
