#!/bin/sh
# ==============================================================================
# Laboratorio de Firewall - IPFW (FreeBSD) - Questao 2
# Atividade: Direito e Seguranca da Informacao
# ==============================================================================

IPFW="/sbin/ipfw -q"

# ---- INTERFACE ----
# Interface WAN (onde roda o IP 172.16.90.1)
IF_WAN="em0"

echo "Interface WAN Fixada: $IF_WAN"

# ---- IPs Questão 2 ----
IP_WAN="172.16.90.1"
# O IP do Windows Host (Docker) na rede Host-Only da DMZ
MOODLE_IP="192.168.56.1" 

# Limpeza e kldload
${IPFW} -f flush
/sbin/kldload ipfw_nat 2>/dev/null
sysctl -q -w net.inet.ip.forwarding=1

# O SEGREDRO MÁGICO: Desativar one_pass para o pacote ser NATeado e continuar nas regras!
sysctl -q -w net.inet.ip.fw.one_pass=0

# ==============================================================================
# CONFIGURAÇÕES DE NAT DUPLO (DNAT da WAN + SNAT da DMZ para Windows)
# ==============================================================================
IF_DMZ="em1"

# NAT 1: Redireciona tudo que bate no Firewall (172.x) para o Moodle (192.x)
${IPFW} nat 1 config if ${IF_WAN} reset same_ports \
    redirect_port tcp ${MOODLE_IP}:80  80 \
    redirect_port tcp ${MOODLE_IP}:443 443

# NAT 2: Disfarça a origem pro Windows não quebrar a conexão na volta (Loopback do HOST)
${IPFW} nat 2 config if ${IF_DMZ} reset same_ports

# Loopback Livre
${IPFW} add 100 allow ip from any to any via lo0

# ==============================================================================
# APLICAÇÃO DOS NATs (Tem que ser ANTES de qualquer regra Allow!)
# ==============================================================================
# IN/OUT da WAN
${IPFW} add 200 nat 1 ip from any to any in  via ${IF_WAN}
${IPFW} add 210 nat 1 ip from any to any out via ${IF_WAN}

# IN/OUT da DMZ
${IPFW} add 220 nat 2 ip from any to any out via ${IF_DMZ}
${IPFW} add 230 nat 2 ip from any to any in  via ${IF_DMZ}

# ==============================================================================
# REQUISITOS DE AUDITORIA (test_firewall.py) -> BLOQUEIOS
# ==============================================================================
# Bloqueio ICMP (Ping)
${IPFW} add 1000 deny icmp from any to any in via ${IF_WAN} icmptypes 8

# Bloqueios SSH e Bancos de Dados via WAN
${IPFW} add 1100 deny tcp from any to any 22 in via ${IF_WAN}
${IPFW} add 1110 deny tcp from any to any 3306 in via ${IF_WAN}
${IPFW} add 1120 deny tcp from any to any 5432 in via ${IF_WAN}

# ==============================================================================
# FINAL: Permite o restante do tráfego interno (O NAT garante a segurança do roteamento)
# ==============================================================================
${IPFW} add 6000 allow ip from any to any

echo "=== IPFW (DOUBLE NAT ROUTING) configurado com sucesso! ==="

