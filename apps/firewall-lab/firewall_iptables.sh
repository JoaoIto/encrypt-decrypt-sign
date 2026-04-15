#!/bin/bash
# ==============================================================================
# Laboratório de Firewall - IPTables (Debian 13 / Docker Container)
# ==============================================================================
# Detecta interfaces automaticamente pelos IPs atribuídos no docker-compose

echo "=============================================="
echo "  🔥 Inicializando Firewall IPTables Lab"
echo "=============================================="

# ─── Detectar interfaces pelos IPs (subnets 10.100.x.x) ──────────────────────
IF_WAN=$(ip -4 -o addr | grep "10.100.90.1" | awk '{print $2}')
IF_DMZ=$(ip -4 -o addr | grep "10.100.56.254" | awk '{print $2}')
IF_LAN=$(ip -4 -o addr | grep "10.100.57.254" | awk '{print $2}')

if [ -z "$IF_WAN" ] || [ -z "$IF_DMZ" ] || [ -z "$IF_LAN" ]; then
  echo "❌ ERRO: Interfaces não encontradas! Verificando IPs disponíveis:"
  ip -4 -o addr | awk '{print $2, $4}'
  exit 1
fi

echo "✅ Interface WAN : $IF_WAN (172.16.90.x)"
echo "✅ Interface DMZ : $IF_DMZ (192.168.56.x)"
echo "✅ Interface LAN : $IF_LAN (192.168.57.x)"

# ─── Variáveis de Rede (10.100.x.x — Docker lab) ─────────────────────────────
NET_DMZ="10.100.56.0/24"
NET_LAN="10.100.57.0/24"
SRV_WEB="10.100.56.10"     # Joomla
SRV_DB="10.100.56.20"      # MySQL
WIN_CLIENT="10.100.57.30"  # "Windows" Admin

# ==============================================================================
# 1. Habilitar Roteamento no Kernel
# ==============================================================================
echo ""
echo "➡️  Habilitando roteamento IP no Kernel..."
echo 1 > /proc/sys/net/ipv4/ip_forward
sysctl -w net.ipv4.ip_forward=1

# ==============================================================================
# 2. Limpar Regras Anteriores e Definir Política Padrão DROP
# ==============================================================================
echo "➡️  Limpando regras e aplicando política DEFAULT DROP..."
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X

# POLÍTICA PADRÃO: BLOQUEAR TUDO (lista branca)
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

echo "✅ Política DEFAULT DROP aplicada."

# ==============================================================================
# 3. Regras Base: Loopback e Conexões Estabelecidas
# ==============================================================================
echo "➡️  Aplicando regras base (loopback e state tracking)..."

# Loopback sem restrições
iptables -A INPUT  -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Aceitar pacotes de conexões já estabelecidas (Stateful)
iptables -A INPUT   -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT  -m state --state ESTABLISHED,RELATED -j ACCEPT

# ==============================================================================
# 4. Proteções de Baixo Nível (Anti-Spoofing / Ataques de Rede)
# ==============================================================================
echo "➡️  Aplicando proteções contra ataques..."

# 4.1 Bloquear ICMP externo (Ping da Internet → Firewall)
iptables -A INPUT -i $IF_WAN -p icmp --icmp-type echo-request -j DROP
echo "  🔒 ICMP externo bloqueado."

# 4.2 Bloquear Flags TCP inválidas / incompletas
iptables -A INPUT   -p tcp --tcp-flags ALL NONE -j DROP   # NULL scan
iptables -A INPUT   -p tcp --tcp-flags ALL ALL -j DROP    # XMAS scan
iptables -A FORWARD -p tcp --tcp-flags ALL NONE -j DROP
iptables -A FORWARD -p tcp --tcp-flags ALL ALL -j DROP
iptables -A INPUT   -p tcp ! --syn -m state --state NEW -j DROP
echo "  🔒 Flags TCP inválidas bloqueadas."

# 4.3 Anti-SYN Flood (limitar conexões novas)
iptables -N SYNFLOOD 2>/dev/null || iptables -F SYNFLOOD
iptables -A SYNFLOOD -m limit --limit 10/s --limit-burst 30 -j RETURN
iptables -A SYNFLOOD -j LOG --log-prefix "FW-SYNFLOOD: " --log-level 4
iptables -A SYNFLOOD -j DROP
iptables -A INPUT   -p tcp --syn -j SYNFLOOD
iptables -A FORWARD -p tcp --syn -j SYNFLOOD
echo "  🔒 Anti-SYN Flood ativo."

# 4.4 Anti-Port Scan (marcar e bloquear scanners)
iptables -N PORTSCAN 2>/dev/null || iptables -F PORTSCAN
iptables -A PORTSCAN -m recent --name portscan --set -j LOG --log-prefix "FW-PORTSCAN: " --log-level 4
iptables -A PORTSCAN -j DROP
iptables -A INPUT -m recent --name portscan --rcheck --seconds 60 --hitcount 10 -j PORTSCAN
echo "  🔒 Anti-Port Scan ativo."

# 4.5 Proteção contra Source Routing e IP Spoofing (via sysctl)
sysctl -w net.ipv4.conf.all.accept_source_route=0     >/dev/null
sysctl -w net.ipv4.conf.all.accept_redirects=0        >/dev/null
sysctl -w net.ipv4.conf.all.send_redirects=0          >/dev/null
sysctl -w net.ipv4.conf.all.log_martians=1            >/dev/null
sysctl -w net.ipv4.icmp_echo_ignore_broadcasts=1      >/dev/null
echo "  🔒 Source routing e IP redirects desabilitados."

# ==============================================================================
# 5. NAT: DNAT — Redirecionar Portas Web da WAN para o Servidor Joomla na DMZ
# ==============================================================================
echo "➡️  Configurando DNAT (WAN → Joomla DMZ)..."

# Redirecionar porta 80 e 443 externos para o servidor Joomla (192.168.56.10)
iptables -t nat -A PREROUTING -i $IF_WAN -p tcp --dport 80  -j DNAT --to-destination $SRV_WEB:80
iptables -t nat -A PREROUTING -i $IF_WAN -p tcp --dport 443 -j DNAT --to-destination $SRV_WEB:443

# Autorizar o encaminhamento dessas conexões DNAT
iptables -A FORWARD -i $IF_WAN -o $IF_DMZ -d $SRV_WEB -p tcp -m multiport --dports 80,443 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT

echo "✅ DNAT: Portas 80/443 encaminhando para $SRV_WEB."

# ==============================================================================
# 6. NAT: SNAT — Acesso à Internet com RESTRIÇÃO DE HORÁRIO
# ==============================================================================
# Horário permitido: 12h–14h e após 18h (usando módulo time / UTC-3 = Brasília)
# NOTA: --timestart e --timestop usam UTC. Brasília = UTC-3
# 12h BRT = 15h UTC | 14h BRT = 17h UTC | 18h BRT = 21h UTC | 23:59 BRT = 02:59+1 UTC
echo "➡️  Configurando SNAT com controle de horário (12-14h e 18h+)..."

# Horário almoço: 12h-14h Brasília = 15:00-17:00 UTC
iptables -t nat -A POSTROUTING -s $NET_LAN -o $IF_WAN \
  -m time --timestart 15:00 --timestop 17:00 -j MASQUERADE

iptables -t nat -A POSTROUTING -s $NET_DMZ -o $IF_WAN \
  -m time --timestart 15:00 --timestop 17:00 -j MASQUERADE

# Após 18h Brasília = após 21:00 UTC (até meia-noite UTC)
iptables -t nat -A POSTROUTING -s $NET_LAN -o $IF_WAN \
  -m time --timestart 21:00 --timestop 23:59 -j MASQUERADE

iptables -t nat -A POSTROUTING -s $NET_DMZ -o $IF_WAN \
  -m time --timestart 21:00 --timestop 23:59 -j MASQUERADE

# Bloquear explicitamente saída fora do horário
iptables -A FORWARD -s $NET_LAN -o $IF_WAN -j DROP
iptables -A FORWARD -s $NET_DMZ -o $IF_WAN -j DROP

echo "✅ SNAT configurado com restrição de horário."

# ==============================================================================
# 7. ACL: Acessos Específicos da LAN para a DMZ
# ==============================================================================
echo "➡️  Aplicando ACLs de acesso LAN → DMZ..."

# Cliente Windows (192.168.57.30): SSH (22), MySQL (3306), PostgreSQL (5432) — com LOG
for PORT in 22 3306 5432; do
  iptables -A FORWARD -s $WIN_CLIENT -o $IF_DMZ -p tcp --dport $PORT \
    -m state --state NEW \
    -j LOG --log-prefix "FW-WIN_ACCEPT: " --log-level 4

  iptables -A FORWARD -s $WIN_CLIENT -o $IF_DMZ -p tcp --dport $PORT \
    -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
done
echo "  ✅ Windows ($WIN_CLIENT): SSH/MySQL/Postgres liberados com LOG."

# Demais hosts da LAN: somente portas 80 e 443 na DMZ
iptables -A FORWARD -s $NET_LAN -o $IF_DMZ -p tcp -m multiport --dports 80,443 \
  -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT

# Bloquear qualquer outra coisa da LAN para a DMZ (exceto o Windows Admin)
iptables -A FORWARD -s $NET_LAN -o $IF_DMZ -j LOG --log-prefix "FW-LAN_BLOCK: " --log-level 4
iptables -A FORWARD -s $NET_LAN -o $IF_DMZ -j DROP

echo "  ✅ Demais hosts LAN: apenas 80/443 liberados."

# ==============================================================================
# 8. NTP — Sincronização de Horário (necessária para regras de tempo!)
# ==============================================================================
echo "➡️  Liberando NTP para sincronização (a.ntp.br, b.ntp.br, c.ntp.br)..."
iptables -A OUTPUT -p udp --dport 123 -j ACCEPT
iptables -A INPUT  -p udp --sport 123 -j ACCEPT
echo "✅ NTP liberado."

# ==============================================================================
# 9. OUTPUT do Firewall: liberar SSH local para administração
# ==============================================================================
iptables -A INPUT  -i $IF_LAN -p tcp --dport 22 -m state --state NEW -j ACCEPT
iptables -A OUTPUT -p tcp -m state --state NEW,ESTABLISHED -j ACCEPT
iptables -A OUTPUT -p udp -j ACCEPT
iptables -A OUTPUT -p icmp -j ACCEPT

# Permitir ICMP das redes internas (LAN e DMZ) para o gateway
# (A atividade só exige bloquear ICMP EXTERNO - da WAN)
iptables -A INPUT -i $IF_LAN -p icmp --icmp-type echo-request -j ACCEPT
iptables -A INPUT -i $IF_DMZ -p icmp --icmp-type echo-request -j ACCEPT

# ==============================================================================
# 10. Exibir Sumário
# ==============================================================================
echo ""
echo "=============================================="
echo " ✅ Firewall IPTables ATIVO e Configurado!"
echo "=============================================="
iptables -L FORWARD -v -n --line-numbers
echo ""
echo "NAT Rules:"
iptables -t nat -L -v -n
