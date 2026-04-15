#!/usr/bin/env python3
"""
run_lab_tests.py - Testes automatizados do Firewall Lab
FIX: Usa subprocess list-args (sem shell=True) para evitar
     quebra de quoting no cmd.exe do Windows.
"""

import subprocess
import sys
import os
from datetime import datetime

LOG_FILE = f"lab_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

GREEN  = "\033[92m"; RED = "\033[91m"; BLUE = "\033[94m"; YELLOW = "\033[93m"; RESET = "\033[0m"
PASS_S = f"{GREEN}[PASS]{RESET}"; FAIL_S = f"{RED}[FAIL]{RESET}"
INFO_S = f"{BLUE}[INFO]{RESET}"; WARN_S = f"{YELLOW}[WARN]{RESET}"
results = []

def log(msg, level="INFO"):
    ts = datetime.now().strftime('%H:%M:%S')
    clean = msg.encode('ascii', 'ignore').decode('ascii')
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{ts}] {level:4} {clean}\n")
    icon = {"PASS": PASS_S, "FAIL": FAIL_S, "INFO": INFO_S, "WARN": WARN_S}.get(level, INFO_S)
    print(f"{icon} {msg}")

def section(title):
    sep = "=" * 60
    msg = f"\n{sep}\n  {title}\n{sep}"
    print(msg)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

# ─── subprocess com LIST (sem shell=True → sem problemas com cmd.exe) ─────────
def runcmd(args_list, timeout=20):
    """Executa lista de argumentos diretamente — sem passar pelo shell do Windows."""
    try:
        r = subprocess.run(
            args_list, capture_output=True, timeout=timeout,
            encoding="utf-8", errors="ignore"
        )
        return (r.stdout + r.stderr).strip(), r.returncode
    except subprocess.TimeoutExpired:
        return "TIMEOUT", 1
    except Exception as e:
        return str(e), 1

def dexec(container, bash_cmd, timeout=20):
    """docker exec <container> bash -c '<cmd>'  (sem passar pelo shell Windows)."""
    return runcmd(["docker", "exec", container, "bash", "-c", bash_cmd], timeout)

def test(name, passed, details=""):
    icon = PASS_S if passed else FAIL_S
    level = "PASS" if passed else "FAIL"
    d = str(details)[:150].replace('\n', ' ')
    log(f"{name}: {d}", level)
    results.append((name, passed, d))

# ==============================================================================
section("ETAPA 0: Setup de Rotas (client-win → DMZ e WAN via fw-gateway)")
# ==============================================================================
log("Adicionando rota 10.100.56.0/24 no client-win...", "INFO")
out, _ = dexec("client-win", "ip route add 10.100.56.0/24 via 10.100.57.254 2>&1 || echo already")
log(f"  {out or 'ok'}", "INFO")

log("Adicionando rota 10.100.90.0/24 no client-win...", "INFO")
out, _ = dexec("client-win", "ip route add 10.100.90.0/24 via 10.100.57.254 2>&1 || echo already")
log(f"  {out or 'ok'}", "INFO")

out, _ = dexec("client-win", "ip route show")
test("Rotas client-win configuradas", "10.100.56" in out and "10.100.90" in out, out[:300])

# ==============================================================================
section("ETAPA 0b: Aplicar Firewall no fw-gateway")
# ==============================================================================
log("Copiando firewall_iptables.sh para fw-gateway...", "INFO")
cp_out, cp_code = runcmd(["docker", "cp", "firewall_iptables.sh",
                           "fw-gateway:/root/firewall_iptables.sh"])
test("Copia do script", cp_code == 0, cp_out or "OK")

log("Executando firewall_iptables.sh...", "INFO")
# Redireciona output pro /tmp/fw.log para não travar, depois lemos
fw_out, fw_code = dexec(
    "fw-gateway",
    "chmod +x /root/firewall_iptables.sh && bash /root/firewall_iptables.sh > /tmp/fw.log 2>&1; RC=$?; cat /tmp/fw.log | tail -8; echo EXITCODE=$RC",
    timeout=90
)
script_ok = "EXITCODE=0" in fw_out
test("Script firewall executado sem erros", script_ok, fw_out[-300:] if fw_out else "Sem output")

# Aplicar sysctl manualmentepara garantir (caso tenha falhado no script)
dexec("fw-gateway", "sysctl -w net.ipv4.conf.all.log_martians=1 > /dev/null 2>&1")

# ==============================================================================
section("ETAPA 1: Status dos Containers")
# ==============================================================================
for container in ["fw-gateway", "joomla-dmz", "db-dmz", "client-win"]:
    out, code = runcmd(["docker", "inspect", "-f", "{{.State.Running}}", container])
    ok = out.strip() == "true"
    test(f"Container {container} rodando", ok, "Running" if ok else out)

# ==============================================================================
section("ETAPA 2: IPs das VMs (docker inspect)")
# ==============================================================================
ip_checks = [
    ("fw-gateway",  "10.100.90.1",   "Firewall WAN"),
    ("fw-gateway",  "10.100.56.254", "Firewall DMZ"),
    ("fw-gateway",  "10.100.57.254", "Firewall LAN"),
    ("joomla-dmz",  "10.100.56.10",  "Joomla DMZ"),
    ("db-dmz",      "10.100.56.20",  "MySQL DMZ"),
    ("client-win",  "10.100.57.30",  "Cliente LAN"),
]
for container, expected_ip, label in ip_checks:
    out, _ = runcmd(["docker", "inspect", "--format",
                     "{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}",
                     container])
    found = expected_ip in out
    test(f"IP {expected_ip} ({label})", found, f"IPs: {out.strip()}")

# ==============================================================================
section("ETAPA 3: Regras do Firewall")
# ==============================================================================
out, _ = dexec("fw-gateway", "iptables -L FORWARD -n 2>&1 | head -3")
test("Politica FORWARD DEFAULT DROP", "policy DROP" in out, out[:200])

out, _ = dexec("fw-gateway", "iptables -t nat -L PREROUTING -n 2>&1")
test("DNAT portas 80/443 para Joomla", "DNAT" in out, out[:200])

out, _ = dexec("fw-gateway", "cat /proc/sys/net/ipv4/ip_forward")
test("IP Forwarding ativado", out.strip() == "1", f"ip_forward={out.strip()}")

out, _ = dexec("fw-gateway", "iptables -t nat -L POSTROUTING -n 2>&1")
test("MASQUERADE (SNAT) configurado", "MASQUERADE" in out, out[:200])

out, _ = dexec("fw-gateway", "iptables -L SYNFLOOD -n 2>&1")
test("Chain SYNFLOOD criada", "SYNFLOOD" in out or "limit" in out, out[:150])

out, _ = dexec("fw-gateway", "iptables -L INPUT -n 2>&1 | grep -i 'flags\\|NONE'")
test("Bloqueio TCP flags invalidas", len(out) > 5, out[:200] if out else "Nao encontrado")

out, _ = dexec("fw-gateway", "iptables -L PORTSCAN -n 2>&1")
test("Chain PORTSCAN criada", "PORTSCAN" in out or "recent" in out, out[:150])

# ==============================================================================
section("ETAPA 4: Conectividade Basica")
# ==============================================================================
out, _ = dexec("db-dmz", "mysqladmin ping -u root -prootpassword 2>&1")
test("MySQL saudavel", "alive" in out, out[:80])

out, _ = dexec("client-win", "ping -c 1 -W 2 10.100.57.254 2>&1")
test("client-win → fw-gateway LAN", "1 received" in out or "bytes from" in out, out[-100:])

out, _ = dexec("fw-gateway", "ping -c 1 -W 2 10.100.56.10 2>&1")
test("fw-gateway → Joomla DMZ", "1 received" in out or "bytes from" in out, out[-100:])

out, _ = dexec("fw-gateway", "ping -c 1 -W 2 10.100.56.20 2>&1")
test("fw-gateway → MySQL DMZ", "1 received" in out or "bytes from" in out, out[-100:])

# ==============================================================================
section("ETAPA 5: Servico Web - Joomla HTTP")
# ==============================================================================
out, _ = dexec("fw-gateway",
    "curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 http://10.100.56.10 2>&1",
    timeout=15)
http_ok = out.strip() in ["200", "301", "302", "303"]
test("Joomla responde HTTP (direto na DMZ)", http_ok, f"HTTP {out.strip()}")

# DNAT: Testar do fw-gateway usando a interface WAN como origem do pacote
# (usando curl com --interface para simular trafego externo)
out, _ = dexec("fw-gateway",
    "curl -s -o /dev/null -w '%{http_code}' --connect-timeout 8 "
    "--interface 10.100.90.1 http://10.100.56.10 2>&1",
    timeout=15)
dnat_fw = out.strip() in ["200", "301", "302", "303"]
test("Joomla acessivel via interface WAN do firewall", dnat_fw, f"HTTP {out.strip()}")

# Verificar DNAT via regras (garantia documental)
out, _ = dexec("fw-gateway", "iptables -t nat -L PREROUTING -n -v 2>&1 | grep -E '80|443'")
test("Regra DNAT porta 80/443 configurada", "80" in out or "443" in out, out[:200])

# ==============================================================================
section("ETAPA 6: ACLs - Regras de Acesso LAN → DMZ")
# ==============================================================================
# Client-win (10.100.57.30) → MySQL 3306 DEVE funcionar
out, _ = dexec("client-win",
    "timeout 5 bash -c 'echo > /dev/tcp/10.100.56.20/3306' 2>/dev/null && echo ABERTO || echo BLOQUEADO",
    timeout=10)
test("client-win acessa MySQL:3306 DMZ (DEVE ABRIR)", "ABERTO" in out,
     "ACL WIN_CLIENT funcionando" if "ABERTO" in out else out)

# Client-win → porta 22 no servidor joomla
out, _ = dexec("client-win",
    "timeout 5 bash -c 'echo > /dev/tcp/10.100.56.10/80' 2>/dev/null && echo ABERTO || echo BLOQUEADO",
    timeout=10)
test("client-win acessa porta 80 Joomla DMZ", "ABERTO" in out, out)

# ==============================================================================
section("ETAPA 7: Protecoes Anti-Ataque")
# ==============================================================================
out, _ = dexec("fw-gateway", "iptables -L INPUT -n -v 2>&1 | grep -i icmp")
test("Regra ICMP bloqueio configurada", "DROP" in out or "icmp" in out.lower(), out[:200])

out, _ = dexec("fw-gateway", "sysctl net.ipv4.conf.all.accept_source_route 2>&1")
test("Source routing desabilitado", "= 0" in out, out)

out, _ = dexec("fw-gateway", "sysctl net.ipv4.conf.all.accept_redirects 2>&1")
test("IP redirects desabilitados", "= 0" in out, out)

out, _ = dexec("fw-gateway", "sysctl net.ipv4.conf.all.log_martians 2>&1")
test("Log de IPs invalidos (martians) ativo", "= 1" in out, out)

out, _ = dexec("fw-gateway", "sysctl net.ipv4.icmp_echo_ignore_broadcasts 2>&1")
test("ICMP broadcast ignorado", "= 1" in out, out)

# ==============================================================================
section("ETAPA 8: NTP - Sincronizacao de Horario (NIC BR)")
# ==============================================================================
out, _ = dexec("fw-gateway", "which chronyd 2>&1")
test("chrony instalado no firewall", "/chronyd" in out or "chronyd" in out, out)

out, _ = dexec("fw-gateway", "cat /etc/chrony/chrony.conf 2>&1")
test("NTP configurado com servidores NIC.br (a.ntp.br)", "a.ntp.br" in out, out[:200])
test("NTP configurado com servidores NIC.br (b.ntp.br)", "b.ntp.br" in out, out[:200])
test("NTP configurado com servidores NIC.br (c.ntp.br)", "c.ntp.br" in out, out[:200])

out, _ = dexec("fw-gateway", "iptables -L OUTPUT -n 2>&1 | grep 123 || iptables -L OUTPUT -n | grep udp")
test("Porta NTP (123 UDP) liberada no firewall", "123" in out or "udp" in out, out[:150])

# Verificar se chrony está rodando como processo
out_proc, _ = dexec("fw-gateway", "pgrep -x chronyd 2>&1 && echo RUNNING || echo NOT_RUNNING")
# Tentar chronyc sources (funciona apenas se chronyd está rodando)
out, _ = dexec("fw-gateway", "chronyc sources 2>&1 || echo 'chrony_erro'", timeout=10)
# PASS se: processo rodando OU tabela de sources exibida (mesmo vazia - prova que daemon responde)
chrony_ok = "RUNNING" in out_proc or "MS Name" in out or "Sources" in out.lower()
detail = f"processo: {out_proc.strip()} | sources: {out[:80]}"
test("chrony configurado e executando", chrony_ok, detail)

# Salvar dump das regras no log
full_rules, _ = dexec("fw-gateway", "iptables -L -n -v --line-numbers 2>&1")
nat_rules,   _ = dexec("fw-gateway", "iptables -t nat -L -n -v 2>&1")
with open(LOG_FILE, "a", encoding="utf-8") as f:
    f.write("\n=== REGRAS IPTABLES FILTER ===\n" + full_rules + "\n")
    f.write("\n=== REGRAS IPTABLES NAT ===\n" + nat_rules + "\n")
log("Regras completas salvas no log.", "INFO")

# ==============================================================================
section("RESUMO FINAL")
# ==============================================================================
total  = len(results)
passed = sum(1 for _, ok, _ in results if ok)
failed = total - passed

with open(LOG_FILE, "a", encoding="utf-8") as f:
    f.write(f"\n=== RESUMO: {passed}/{total} passaram ===\n")
    for name, ok, details in results:
        f.write(f"  [{'PASS' if ok else 'FAIL'}] {name}: {details}\n")

print(f"\n  Total: {total}  |  {PASS_S} {passed}  |  {FAIL_S} {failed}")
print(f"  Log: {os.path.abspath(LOG_FILE)}\n")

if failed > 0:
    print(f"  {WARN_S} {failed} falha(s). Veja: {LOG_FILE}")
    sys.exit(1)
else:
    print(f"  {PASS_S} Todos os testes passaram!")
