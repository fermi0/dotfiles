#!/bin/bash

ufw reset

iptables --flush -v
iptables --delete-chain -v
iptables --list-rules

ufw enable

ufw status verbose

#echo "net.ipv6.conf.all.disable_ipv6 = 1" >> /etc/sysctl.conf
#echo "net.ipv6.conf.default.disable_ipv6 = 1" >> /etc/sysctl.conf
#echo "net.ipv6.conf.lo.disable_ipv6 = 1" >> /etc/sysctl.conf
#sysctl -p

ufw default deny incoming && ufw default deny outgoing 
ufw deny incoming from fe80::ab15:d653:ff1:1da7 proto tcp
ufw deny incoming from fe80::ab15:d653:ff1:1da7 proto udp
ufw deny incoming from 2400:1a00:b050:aa08:68fe:7602:c8a5:39d3 proto tcp
ufw deny incoming from 2400:1a00:b050:aa08:68fe:7602:c8a5:39d3 proto udp
ufw deny outgoing from any to fe80::ab15:d653:ff1:1da7 proto tcp
ufw deny outgoing from any to fe80::ab15:d653:ff1:1da7 proto udp
ufw deny outgoing from any to 2400:1a00:b050:aa08:68fe:7602:c8a5:39d3 proto tcp
ufw deny outgoing from any to 2400:1a00:b050:aa08:68fe:7602:c8a5:39d3 proto udp

ufw allow from 192.168.10.75 to any port 1714:1764 proto tcp
ufw allow from 192.168.10.75 to any port 1714:1764 proto udp
ufw allow out from any to 192.168.10.75 port 1714:1764 proto tcp
ufw allow out from any to 192.168.10.75 port 1714:1764 proto udp

ufw allow from 192.168.10.75 to any port 5037 proto tcp
ufw allow from 192.168.10.75 to any port 22 proto tcp
ufw allow out from any to 192.168.10.75 port 5555 proto tcp
ufw allow out from any to 192.168.10.75 port 22 proto tcp

####################################Laptop#####################################

ufw allow from 192.168.10.65 to any port 1714:1764 proto tcp
ufw allow from 192.168.10.65 to any port 1714:1764 proto udp
ufw allow out from any to 192.168.10.65 port 1714:1764 proto tcp
ufw allow out from any to 192.168.10.65 port 1714:1764 proto udp

ufw allow from 192.168.10.65 to any port 22 proto tcp
ufw allow out from any to 192.168.10.65 port 22 proto tcp

####################################Desktop#####################################

#ufw allow from 192.168.10.66 to any port 1714:1764 proto tcp
#ufw allow from 192.168.10.66 to any port 1714:1764 proto udp
#ufw allow out from any to 192.168.10.66 port 1714:1764 proto tcp
#ufw allow out from any to 192.168.10.66 port 1714:1764 proto udp

#ufw allow from 192.168.10.66 to any port 22 proto tcp
#ufw allow out from any to 192.168.10.66 port 22 proto tcp

################################################################################

ufw allow out from any to 8.8.8.8 port 53 proto tcp
ufw allow out from any to 8.8.8.8 port 53 proto udp
ufw allow out from any to 8.8.4.4 port 53 proto tcp
ufw allow out from any to 8.8.4.4 port 53 proto udp

ufw allow out 443

ufw allow out from any to 91.189.95.83 port 80 proto tcp
ufw allow out from any to 91.189.95.83 port 80 proto udp

ufw status verbose

ifconfig | grep inet

ufw reload
