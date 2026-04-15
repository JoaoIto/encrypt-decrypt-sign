#!/bin/sh
# ==============================================================================
# Laboratorio de Firewall - IPFW (FreeBSD 15.x) - Questao 2
# Atividade: Direito e Seguranca da Informacao
# ==============================================================================
#
# PRE-REQUISITOS no /etc/rc.conf:
#   firewall_enable="YES"
#   firewall_script="/root/firewall_ipfw.sh"
#   gateway_enable="YES"
#
# Rodar: sh /root/firewall_ipfw.sh

IPFW="/sbin/ipfw -q"

# ---- Interfaces (ajustar conforme ifconfig -a na sua VM) ----
IF_WAN="em0"
IF_DMZ="em1"
IF_LAN="em2"

# ---- Enderecos IP ----
IP_WAN="10.100.90.1"
NET_DMZ="10.100.56.0/24"
NET_LAN="10.100.57.0/24"
SRV_WEB="10.100.56.10"
SRV_DB="10.100.56.20"
WIN_CLIENT="10.100.57.30"

echo "=== Iniciando configuracao do IPFW ==="

# ==============================================================================
# 1. Limpeza e habilitacao do roteamento
# ==============================================================================
${IPFW} flush
sysctl -q -w net.inet.ip.forwarding=1
sysctl -q -w net.inet.ip.fw.verbose=1
sysctl -q -w net.inet.ip.fw.verbose_limit=0

# ==============================================================================
# 2. Loopback - sempre livre
# ==============================================================================
${IPFW} add 100 allow ip from any to any via lo0

# ==============================================================================
# 3. DNAT (NAT reverso) - Joomla exposto na WAN portas 80 e 443
# ==============================================================================
# Configurar instancia de NAT: SNAT + DNAT
${IPFW} nat 1 config if ${IF_WAN} reset same_ports \
    redirect_port tcp ${SRV_WEB}:80  80  \
    redirect_port tcp ${SRV_WEB}:443 443

# Aplicar NAT em todo trafego que passa pela WAN
${IPFW} add 200 nat 1 ip from any to any in  via ${IF_WAN}
${IPFW} add 210 nat 1 ip from any to any out via ${IF_WAN}

# ==============================================================================
# 4. Stateful Inspection (conexoes estabelecidas e relacionadas)
# ==============================================================================
${IPFW} add 500 check-state

# ==============================================================================
# 5. Protecao ICMP externo (sem ping da internet para o firewall)
# ==============================================================================
${IPFW} add 1000 deny  icmp from any to any in  via ${IF_WAN} icmptypes 8
${IPFW} add 1010 allow icmp from any to any via ${IF_DMZ}
${IPFW} add 1020 allow icmp from any to any via ${IF_LAN}

# ==============================================================================
# 6. Protecao contra TCP flags invalidas (NULL scan, XMAS scan)
# ==============================================================================
${IPFW} add 1100 deny tcp from any to any tcpflags fin,syn,rst,psh,ack,urg
${IPFW} add 1110 deny tcp from any to any tcpflags !fin,!syn,!rst,!psh,!ack,!urg
${IPFW} add 1120 deny tcp from any to any established tcpflags !ack

# ==============================================================================
# 7. Anti-Spoofing e Source Routing
# ==============================================================================
${IPFW} add 1200 deny ip from any to any not antispoof in via ${IF_LAN}
${IPFW} add 1210 deny ip from any to any not antispoof in via ${IF_DMZ}

# ==============================================================================
# 8. Protecao contra SYN Flood (limite de conexoes por IP de origem)
# ==============================================================================
${IPFW} add 1300 allow tcp from any to ${SRV_WEB} 80  setup limit src-addr 20 keep-state
${IPFW} add 1310 allow tcp from any to ${SRV_WEB} 443 setup limit src-addr 20 keep-state

# ==============================================================================
# 9. ACL - Cliente Windows (10.100.57.30) -> portas 22, 3306, 5432 com LOG
# ==============================================================================
${IPFW} add 3000 allow log tcp from ${WIN_CLIENT} to ${SRV_WEB} 22   setup keep-state
${IPFW} add 3010 allow log tcp from ${WIN_CLIENT} to ${SRV_DB}  22   setup keep-state
${IPFW} add 3020 allow log tcp from ${WIN_CLIENT} to ${SRV_DB}  3306 setup keep-state
${IPFW} add 3030 allow log tcp from ${WIN_CLIENT} to ${SRV_DB}  5432 setup keep-state

# ==============================================================================
# 10. LAN -> DMZ: apenas portas 80 e 443 para demais hosts
# ==============================================================================
${IPFW} add 4000 allow tcp from ${NET_LAN} to ${NET_DMZ} 80  setup keep-state
${IPFW} add 4010 allow tcp from ${NET_LAN} to ${NET_DMZ} 443 setup keep-state
${IPFW} add 4099 deny  log ip from ${NET_LAN} to ${NET_DMZ}

# ==============================================================================
# 11. NTP (porta 123 UDP) - sai do firewall para servidores NTP
# ==============================================================================
${IPFW} add 5000 allow udp from me to any 123 keep-state
${IPFW} add 5010 allow udp from any 123 to me keep-state

# ==============================================================================
# 12. SSH de administracao: apenas da LAN para o proprio firewall
# ==============================================================================
${IPFW} add 5100 allow tcp from ${NET_LAN} to me 22 setup keep-state

# ==============================================================================
# 13. Saida do firewall e respostas (OUTPUT generoso para o proprio gateway)
# ==============================================================================
${IPFW} add 6000 allow tcp from me to any setup keep-state
${IPFW} add 6010 allow udp from me to any keep-state

# ==============================================================================
# 14. SNAT com restricao de horario (via cron - veja crontab abaixo)
#     A regra base e adicionada/removida pelo cron nos horarios certos:
#     12h-14h Brasilia (15h-17h UTC) e 18h+ (21h+ UTC)
#     A regra abaixo e o placeholder que o cron ativa/desativa
# ==============================================================================
# Descomentada pelo cron no horario permitido:
# ${IPFW} add 6500 allow ip from ${NET_LAN} to any out via ${IF_WAN} keep-state
# ${IPFW} add 6510 allow ip from ${NET_DMZ} to any out via ${IF_WAN} keep-state

# ==============================================================================
# 15. Regra final: bloquear e registrar tudo que nao foi permitido
# ==============================================================================
${IPFW} add 65534 deny log ip from any to any

echo "=== IPFW configurado com sucesso! ==="
echo ""
echo "Regras aplicadas:"
/sbin/ipfw -a list | head -40
