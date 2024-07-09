##!/bin/bash
#
sudo ip6tables -F -v
sudo ip6tables --delete-chain -v
sudo ip6tables -L -v -n

sudo ip6tables -P OUTPUT DROP
sudo ip6tables -P INPUT DROP
sudo ip6tables -P FORWARD DROP
#
## Phone
#sudo ip6tables -A OUTPUT -p tcp --dport 1714:1764 -d fe80::1a3a:2dff:fef3:6c06 -j ACCEPT
#sudo ip6tables -A INPUT -p tcp --sport 1714:1764 -s fe80::1a3a:2dff:fef3:6c06 -m mac --mac-source 18:3a:2d:f3:6c:06 -j ACCEPT
#sudo ip6tables -A OUTPUT -p udp --dport 1714:1764 -d fe80::1a3a:2dff:fef3:6c06 -j ACCEPT
#sudo ip6tables -A INPUT -p udp --sport 1714:1764 -s fe80::1a3a:2dff:fef3:6c06 -m mac --mac-source 18:3a:2d:f3:6c:06 -j ACCEPT
#
#sudo ip6tables -A OUTPUT -p tcp --sport 1714:1764 -d fe80::1a3a:2dff:fef3:6c06  -j ACCEPT
#sudo ip6tables -A INPUT -p tcp --dport 1714:1764 -s fe80::1a3a:2dff:fef3:6c06 -m mac --mac-source 18:3a:2d:f3:6c:06 -j ACCEPT
#sudo ip6tables -A OUTPUT -p udp --sport 1714:1764 -d fe80::1a3a:2dff:fef3:6c06 -j ACCEPT
#sudo ip6tables -A INPUT -p udp --dport 1714:1764 -s fe80::1a3a:2dff:fef3:6c06 -m mac --mac-source 18:3a:2d:f3:6c:06 -j ACCEPT
################################################################################################################################################
#
## Laptop
#sudo ip6tables -A OUTPUT -p tcp --dport 1714:1764 -d 2400:1a00:b050:2aa0:7823:e6e0:9981:b493 -j ACCEPT
#sudo ip6tables -A INPUT -p tcp --sport 1714:1764 -s 2400:1a00:b050:2aa0:7823:e6e0:9981:b493 -m mac --mac-source 28:e3:47:2c:86:a9 -j ACCEPT
#sudo ip6tables -A OUTPUT -p udp --dport 1714:1764 -d 2400:1a00:b050:2aa0:7823:e6e0:9981:b493 -j ACCEPT
#sudo ip6tables -A INPUT -p udp --sport 1714:1764 -s 2400:1a00:b050:2aa0:7823:e6e0:9981:b493 -m mac --mac-source 28:e3:47:2c:86:a9 -j ACCEPT
#
#sudo ip6tables -A OUTPUT -p tcp -sport 1714:1764 -d 2400:1a00:b050:2aa0:7823:e6e0:9981:b493 -j ACCEPT
#sudo ip6tables -A INPUT -p tcp --dport 1714:1764 -s 2400:1a00:b050:2aa0:7823:e6e0:9981:b493 -m mac --mac-source 28:e3:47:2c:86:a9 -j ACCEPT
#sudo ip6tables -A OUTPUT -p udp --sport 1714:1764 -d 2400:1a00:b050:2aa0:7823:e6e0:9981:b493 -j ACCEPT
#sudo ip6tables -A INPUT -p udp --dport 1714:1764 -s 2400:1a00:b050:2aa0:7823:e6e0:9981:b493 -m mac --mac-source 28:e3:47:2c:86:a9 -j ACCEPT
#
#sudo ip6tables -A OUTPUT -p tcp --dport 1714:1764 -d fe80::1ba5:7f52:5fef:b18c -j ACCEPT
#sudo ip6tables -A INPUT -p tcp --sport 1714:1764 -s fe80::1ba5:7f52:5fef:b18c -m mac --mac-source 28:e3:47:2c:86:a9 -j ACCEPT
#sudo ip6tables -A OUTPUT -p udp --dport 1714:1764 -d fe80::1ba5:7f52:5fef:b18c -j ACCEPT
#sudo ip6tables -A INPUT -p udp --sport 1714:1764 -s fe80::1ba5:7f52:5fef:b18c -m mac --mac-source 28:e3:47:2c:86:a9 -j ACCEPT
#
#sudo ip6tables -A OUTPUT -p tcp -sport 1714:1764 -d fe80::1ba5:7f52:5fef:b18c -j ACCEPT
#sudo ip6tables -A INPUT -p tcp --dport 1714:1764 -s fe80::1ba5:7f52:5fef:b18c -m mac --mac-source 28:e3:47:2c:86:a9 -j ACCEPT
#sudo ip6tables -A OUTPUT -p udp --sport 1714:1764 -d fe80::1ba5:7f52:5fef:b18c -j ACCEPT
#sudo ip6tables -A INPUT -p udp --dport 1714:1764 -s fe80::1ba5:7f52:5fef:b18c -m mac --mac-source 28:e3:47:2c:86:a9 -j ACCEPT

#sudo ip6tables -L -n
