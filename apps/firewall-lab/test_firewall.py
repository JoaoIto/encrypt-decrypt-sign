#!/usr/bin/env python3
# ==============================================================================
# Laboratório de Firewall - Script de Teste / Conectividade e Bloqueios
# ==============================================================================

import socket
import subprocess
import platform
import logging
from datetime import datetime

# Configuração de IP Público (WAN) do Firewall que desejamos atacar/testar
FIREWALL_IP = "172.16.90.1"

# Portas a testar (Sucesso Esperado para Web, e Timeout/Refused para BD e SSH)
PORTS_TEST = {
    80:   "WEB HTTP (Joomla/Moodle)",
    443:  "WEB HTTPS (Joomla/Moodle)",
    22:   "SSH",
    3306: "MySQL / MariaDB",
    5432: "PostgreSQL"
}

# Configuração do Logger
log_file = f"relatorio_seguranca_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Adiciona saída também para o console (STDOUT)
console = logging.StreamHandler()
console.setLevel(logging.INFO)
formatter = logging.Formatter('[%(asctime)s] %(levelname)s - %(message)s', datefmt='%H:%M:%S')
console.setFormatter(formatter)
logging.getLogger('').addHandler(console)

def print_separator(title):
    msg = f"=== {title} ==="
    logging.info("\n" + "=" * 50)
    logging.info(msg)
    logging.info("=" * 50)

def test_ping(ip_address):
    """ Tenta efetuar o ping e reporta se falhou, como exigido na regra anti-ICMP """
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    command = ['ping', param, '1', '-w', '2', ip_address] if platform.system().lower() != 'windows' else ['ping', param, '1', '-w', '2000', ip_address]
    
    logging.info(f"Testando Bloqueio de ICMP (Ping external) para {ip_address}...")
    try:
        output = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        # O firewall *deve* bloquear, portanto, ping falho é SUCESSO de segurança.
        if output.returncode == 0:
            logging.error(f"[FALHA DE SEGURANÇA] Ping para {ip_address} respondeu! A regra anti-ICMP não está ativa.")
        else:
            logging.info(f"[SUCESSO] Ping para {ip_address} bloqueado (Timed Out). Regra de firewall anti-ICMP funcionando!")
    except Exception as e:
        logging.warning(f"Erro ao tentar executar ping: {e}")

def test_port(ip_address, port, description):
    """ Testa socket tcp em uma porta específica """
    logging.info(f"Testando {description} na porta TCP {port}...")
    try:
        # Timeout curto para simular a falha do DROP
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2.0)
        result = sock.connect_ex((ip_address, port))
        
        if result == 0:
            if port in [80, 443]:
                logging.info(f"[SUCESSO] Porta {port} está ABERTA, tráfego NAT funcionando.")
            else:
                logging.error(f"[FALHA DE SEGURANÇA] Porta {port} está ABERTA! O firewall deveria bloqueá-la do mundo externo.")
        else:
            if port in [80, 443]:
                logging.error(f"[FALHA] Porta {port} está FECHADA ou DROPADA. O NAT (DNAT) web não está funcionando.")
            else:
                logging.info(f"[SUCESSO] Porta {port} inacessível (Bloqueio do Firewall garantido).")
                
        sock.close()
    except socket.error as err:
        logging.error(f"Erro de socket: {err}")

if __name__ == "__main__":
    logging.info("Iniciando auditoria de segurança de Firewall (Externa/WAN)")
    logging.info(f"Alvo configurado: {FIREWALL_IP}")
    
    # 1. Testar Ping External (deve falhar)
    print_separator("TESTE 1: ICMP Ping of Death Protection")
    test_ping(FIREWALL_IP)
    
    # 2. Testar Portas
    print_separator("TESTE 2: TCP Port Scanner / DNAT Rules")
    for port, desc in PORTS_TEST.items():
        test_port(FIREWALL_IP, port, desc)
        
    print_separator("AUDITORIA CONCLUIDA")
    logging.info(f"Resultados salvos detalhadamente no arquivo: {log_file}")
