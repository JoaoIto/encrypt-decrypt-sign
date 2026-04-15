#!/bin/sh
# IPFW Firewall - FreeBSD 15.x - VM Fw_Ipfw
# IPs baseados nas redes Host-Only do VirtualBox
IPFW="/sbin/ipfw -q"
IF_WAN="em0"
IF_DMZ="em1"
IF_LAN="em2"
NET_DMZ="192.168.56.0/24"
NET_LAN="192.168.57.0/24"
SRV_WEB="192.168.56.10"
SRV_DB="192.168.56.20"
WIN_CLIENT="192.168.57.30"

echo "=== Aplicando IPFW ==="
${IPFW} flush
sysctl -q -w net.inet.ip.forwarding=1
sysctl -q -w net.inet.ip.fw.verbose=1

${IPFW} add 100  allow ip from any to any via lo0

${IPFW} nat 1 config if ${IF_WAN} reset same_ports redirect_port tcp ${SRV_WEB}:80 80 redirect_port tcp ${SRV_WEB}:443 443
${IPFW} add 200  nat 1 ip from any to any in  via ${IF_WAN}
${IPFW} add 210  nat 1 ip from any to any out via ${IF_WAN}

${IPFW} add 500  check-state

${IPFW} add 1000 deny  icmp from any to any in via ${IF_WAN} icmptypes 8
${IPFW} add 1010 allow icmp from any to any via ${IF_DMZ}
${IPFW} add 1020 allow icmp from any to any via ${IF_LAN}

${IPFW} add 1100 deny  tcp from any to any tcpflags fin,syn,rst,psh,ack,urg
${IPFW} add 1120 deny  tcp from any to any established tcpflags !ack

${IPFW} add 1300 allow tcp from any to ${SRV_WEB} 80  setup limit src-addr 20 keep-state
${IPFW} add 1310 allow tcp from any to ${SRV_WEB} 443 setup limit src-addr 20 keep-state

${IPFW} add 3000 allow log tcp from ${WIN_CLIENT} to ${SRV_WEB} 22   setup keep-state
${IPFW} add 3010 allow log tcp from ${WIN_CLIENT} to ${SRV_DB}  22   setup keep-state
${IPFW} add 3020 allow log tcp from ${WIN_CLIENT} to ${SRV_DB}  3306 setup keep-state
${IPFW} add 3030 allow log tcp from ${WIN_CLIENT} to ${SRV_DB}  5432 setup keep-state

${IPFW} add 4000 allow tcp from ${NET_LAN} to ${NET_DMZ} 80  setup keep-state
${IPFW} add 4010 allow tcp from ${NET_LAN} to ${NET_DMZ} 443 setup keep-state
${IPFW} add 4099 deny  log ip from ${NET_LAN} to ${NET_DMZ}

${IPFW} add 5000 allow udp from me to any 123 keep-state
${IPFW} add 5010 allow udp from any 123 to me keep-state

# SSH: permitir da WAN (172.16.90.x) para administracao remota
${IPFW} add 5090 allow tcp from 172.16.90.0/24 to me 22 setup keep-state
${IPFW} add 5100 allow tcp from ${NET_LAN} to me 22 setup keep-state

${IPFW} add 6000 allow tcp from me to any setup keep-state
${IPFW} add 6010 allow udp from me to any keep-state

${IPFW} add 65534 deny log ip from any to any

echo "=== IPFW aplicado com sucesso ==="
/sbin/ipfw -a list
