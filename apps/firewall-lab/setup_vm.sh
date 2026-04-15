#!/bin/sh
# setup_vm.sh - Configuracao completa do fw-freebsd
# Rodar via: ssh root@172.16.90.1 "sh /tmp/setup_vm.sh"

echo "=== [1/5] Configurando interfaces de rede ==="
ifconfig em0 inet 172.16.90.1 netmask 255.255.255.0
ifconfig em1 inet 192.168.56.254 netmask 255.255.255.0
ifconfig em2 inet 192.168.57.254 netmask 255.255.255.0
sysctl -w net.inet.ip.forwarding=1
echo "IPs aplicados:"
ifconfig -a | grep "inet "

echo ""
echo "=== [2/5] Instalando rc.conf ==="
cp /tmp/freebsd_rc.conf /etc/rc.conf
echo "rc.conf instalado:"
cat /etc/rc.conf

echo ""
echo "=== [3/5] Carregando modulos do IPFW ==="
kldload ipfw 2>/dev/null
kldload ipfw_nat 2>/dev/null
echo "Modulos ativos:"
kldstat | grep ipfw

echo ""
echo "=== [4/5] Instalando e aplicando o firewall ==="
cp /tmp/firewall_vm.sh /root/firewall_ipfw.sh
chmod +x /root/firewall_ipfw.sh
sh /root/firewall_ipfw.sh

echo ""
echo "=== [5/5] Configurando NTP ==="
cat > /etc/ntp.conf << NTPEOF
server a.ntp.br iburst
server b.ntp.br iburst
server c.ntp.br iburst
driftfile /var/db/ntp/ntp.drift
restrict default nomodify notrap nopeer noquery
restrict 127.0.0.1
restrict ::1
NTPEOF
ntpdate -u a.ntp.br 2>/dev/null || echo "NTP: sem acesso externo (normal em Host-Only)"
service ntpd start 2>/dev/null || true

echo ""
echo "=== SETUP CONCLUIDO ==="
echo "Regras IPFW ativas: $(ipfw -a list | wc -l | tr -d ' ') regras"
echo "Roteamento: $(sysctl -n net.inet.ip.forwarding)"
echo "Horario: $(date)"
