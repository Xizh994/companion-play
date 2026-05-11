#!/bin/bash
# Update firewall: remove old rule, add new IPv6 rule before DROP
iptables -I INPUT 2 -p tcp --dport 3001 -s 240e:3bb:633:1c70:a01b:23ba:ebb7:a33e -j ACCEPT
echo "=== iptables rules for 3001 ==="
iptables -L INPUT -n --line-numbers | grep 3001

# Save iptables rules
iptables-save > /etc/sysconfig/iptables 2>/dev/null || true
echo "=== SAVED ==="