#!/bin/bash
# ==============================================================================
# Laboratório de Firewall - IPTables (Debian Linux 13.x)
# ==============================================================================

# Variáveis Globais de Redes e Interfaces (Ajustar as interfaces conforme VM)
IF_WAN="eth0"
IF_DMZ="eth1"
IF_LAN="eth2"

IP_WAN="172.16.90.1"
NET_DMZ="192.168.56.0/24"
NET_LAN="192.168.57.0/24"

# Servidores Específicos
SRV_WEB="192.168.56.10"
SRV_DB="192.168.56.20"
WIN_CLIENT="192.168.57.30"

# ==============================================================================
# 1. Preparação e Política Padrão (Default DROP)
# ==============================================================================
echo "Limpando e aplicando politicas padrao..."
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X

# Bloquear tudo por padrão (Lista Branca)
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

# Habilitar roteamento no kernel
echo 1 > /proc/sys/net/ipv4/ip_forward

# ==============================================================================
# 2. Proteções de Baixo Nível (Anti-Spoofing, TCP, Synflood, Portscan)
# ==============================================================================
echo "Aplicando protecoes do Kernel e Netfilter..."

# Bloquear requisições ICMP externas (Ping of Death) na WAN
iptables -A INPUT -i $IF_WAN -p icmp --icmp-type echo-request -j DROP

# Rejeitar flags TCP incompletas/inválidas (Proteção de State)
iptables -A INPUT -p tcp --tcp-flags ALL NONE -j DROP
iptables -A FORWARD -p tcp --tcp-flags ALL NONE -j DROP
iptables -A INPUT -p tcp --tcp-flags ALL ALL -j DROP
iptables -A FORWARD -p tcp --tcp-flags ALL ALL -j DROP
iptables -A INPUT -p tcp ! --syn -m state --state NEW -j DROP

# Proteção contra SYN-Flood limitando conexões inacabadas
iptables -A INPUT -p tcp --syn -m limit --limit 5/s --limit-burst 10 -j ACCEPT
iptables -A FORWARD -p tcp --syn -m limit --limit 5/s --limit-burst 10 -j ACCEPT

# Mitigação contra Port Scan
iptables -A INPUT -m recent --name portscan --rcheck --seconds 86400 -j DROP
iptables -A FORWARD -m recent --name portscan --rcheck --seconds 86400 -j DROP

# Source routing e record route (Desabilitar no Kernel)
echo 0 > /proc/sys/net/ipv4/conf/all/accept_source_route
echo 0 > /proc/sys/net/ipv4/conf/all/accept_redirects

# Aceitar tráfego de laço local e conexões já estabelecidas
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# ==============================================================================
# 3. Políticas de NAT e Redirecionamento (DNAT / SNAT)
# ==============================================================================
echo "Aplicando NAT e Regras de Redirecionamento..."

# O acesso ao servidor web (Joomla) localizado na DMZ se dará apenas via NAT (DNAT),
# a partir de um host na internet, somente nas portas 80 e 443.
iptables -t nat -A PREROUTING -i $IF_WAN -p tcp -m multiport --dports 80,443 -j DNAT --to-destination $SRV_WEB
iptables -A FORWARD -i $IF_WAN -o $IF_DMZ -d $SRV_WEB -p tcp -m multiport --dports 80,443 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT

# Todos os hosts da LAN e DMZ terão acesso à internet via SNAT (Masquerade)
# Somente no horário de almoço: 12h às 14h e após às 18h
# Nota: O modulo 'time' do iptables usa horário UTC (Ajuste '--kerneltz' se a data for local)
iptables -t nat -A POSTROUTING -s $NET_LAN -o $IF_WAN -m time --timestart 12:00 --timestop 14:00 --kerneltz -j MASQUERADE
iptables -t nat -A POSTROUTING -s $NET_DMZ -o $IF_WAN -m time --timestart 12:00 --timestop 14:00 --kerneltz -j MASQUERADE

iptables -t nat -A POSTROUTING -s $NET_LAN -o $IF_WAN -m time --timestart 18:00 --timestop 23:59 --kerneltz -j MASQUERADE
iptables -t nat -A POSTROUTING -s $NET_DMZ -o $IF_WAN -m time --timestart 18:00 --timestop 23:59 --kerneltz -j MASQUERADE

# ==============================================================================
# 4. Controle de Acessos Específicos
# ==============================================================================
echo "Aplicando ACLs de LAN e DMZ..."

# O cliente Windows (192.168.57.30) pode acessar o servidor via SSH (22), MariaDB (3306) e PostgreSQL (5432).
# Os acessos deste cliente deverão ser registrados em log.
for PORT in 22 3306 5432; do
    iptables -A FORWARD -s $WIN_CLIENT -o $IF_DMZ -p tcp --dport $PORT -m state --state NEW -j LOG --log-prefix "FW-WIN_ACCESS_ACCEPT: "
    iptables -A FORWARD -s $WIN_CLIENT -o $IF_DMZ -p tcp --dport $PORT -m state --state NEW,ESTABLISHED -j ACCEPT
done

# Os demais hosts da rede local somente poderão acessar via porta 80 e 443 na DMZ.
iptables -A FORWARD -s $NET_LAN -o $IF_DMZ -p tcp -m multiport --dports 80,443 -j ACCEPT

# ==============================================================================
# NTP (Network Time Protocol) - Necessário para que a regra de tempo (12h-14h) opere com exatidão
# ==============================================================================
# Devemos permitir que o firewall mande requisições pro a.ntp.br (porta 123 udp)
iptables -A OUTPUT -p udp --dport 123 -j ACCEPT
iptables -A INPUT -p udp --sport 123 -j ACCEPT

echo "Firewall IPTables ativado e configurado com sucesso!"
