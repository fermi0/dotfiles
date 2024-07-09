#!/bin/bash

sudo iptables -F -v
sudo iptables --delete-chain -v
sudo iptables -L -n

sudo iptables -P OUTPUT DROP
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
###############################################################################################################################################

#https
sudo iptables -A OUTPUT -p tcp --dport 443 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p tcp --sport 443 -m state --state ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A OUTPUT -p udp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p udp --sport 443 -j ACCEPT

#http
sudo iptables -A OUTPUT -p tcp --dport 80 -d 91.189.95.83 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p tcp --sport 80 -s 91.189.95.83 -m state --state ESTABLISHED,RELATED -j ACCEPT

#DNS
sudo iptables -A OUTPUT -p tcp --dport 53 -d 1.1.1.1,1.0.0.1 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p tcp --sport 53 -s 1.1.1.1,1.0.0.1 -m state --state ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A OUTPUT -p udp --dport 53 -d 1.1.1.1,1.0.0.1 -j ACCEPT
sudo iptables -A INPUT -p udp --sport 53 -s 1.1.1.1,1.0.0.1 -j ACCEPT

#SSH Phone
sudo iptables -A OUTPUT -p tcp --dport 22 -d 192.168.10.75 -j ACCEPT
sudo iptables -A INPUT -p tcp --sport 22 -s 192.168.10.75 -m mac --mac-source 18:3a:2d:f3:6c:06 -j ACCEPT
sudo iptables -A OUTPUT -p tcp --sport 22 -d 192.168.10.75 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -s 192.168.10.75 -m mac --mac-source 18:3a:2d:f3:6c:06 -j ACCEPT

#SSH Laptop
sudo iptables -A OUTPUT -p tcp --dport 22 -d 192.168.10.66 -j ACCEPT
sudo iptables -A INPUT -p tcp --sport 22 -s 192.168.10.66 -m mac --mac-source 28:e3:47:2c:86:a9 -j ACCEPT
sudo iptables -A OUTPUT -p tcp --sport 22 -d 192.168.10.66 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -s 192.168.10.66 -m mac --mac-source 28:e3:47:2c:86:a9 -j ACCEPT

#KDE Connect Phone
sudo iptables -A OUTPUT -p tcp --dport 1714:1764 -d 192.168.10.75 -j ACCEPT
sudo iptables -A INPUT -p tcp --sport 1714:1764 -s 192.168.10.75 -m mac --mac-source 18:3a:2d:f3:6c:06 -j ACCEPT
sudo iptables -A OUTPUT -p tcp --sport 1714:1764 -d 192.168.10.75 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 1714:1764 -s 192.168.10.75 -m mac --mac-source 18:3a:2d:f3:6c:06 -j ACCEPT

sudo iptables -A OUTPUT -p udp --dport 1714:1764 -d 192.168.10.75 -j ACCEPT
sudo iptables -A INPUT -p udp --sport 1714:1764 -s 192.168.10.75 -m mac --mac-source 18:3a:2d:f3:6c:06 -j ACCEPT
sudo iptables -A OUTPUT -p udp --sport 1714:1764 -d 192.168.10.75 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 1714:1764 -s 192.168.10.75 -m mac --mac-source 18:3a:2d:f3:6c:06 -j ACCEPT

#KDE Connect Laptop
sudo iptables -A OUTPUT -p tcp --dport 1714:1764 -d 192.168.10.66 -j ACCEPT
sudo iptables -A INPUT -p tcp --sport 1714:1764 -s 192.168.10.66 -m mac --mac-source 28:E3:47:2C:86:A9 -j ACCEPT
sudo iptables -A OUTPUT -p tcp --sport 1714:1764 -d 192.168.10.66 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 1714:1764 -s 192.168.10.66 -m mac --mac-source 28:E3:47:2C:86:A9 -j ACCEPT

sudo iptables -A OUTPUT -p udp --dport 1714:1764 -d 192.168.10.66 -j ACCEPT
sudo iptables -A INPUT -p udp --sport 1714:1764 -s 192.168.10.66 -m mac --mac-source 28:E3:47:2C:86:A9 -j ACCEPT
sudo iptables -A OUTPUT -p udp --sport 1714:1764 -d 192.168.10.66 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 1714:1764 -s 192.168.10.66 -m mac --mac-source 28:E3:47:2C:86:A9 -j ACCEPT

sudo iptables -L -n
