#! /bin/bash

#configuring nftables

#sudo apt purge iptables*
#sudo apt install nftables

sudo nft list tables
sudo nft flush ruleset
sudo nft delete table inet filter
sudo nft delete table ip filter
sudo nft delete table ip netfilter
sudo nft delete table ip6 netfilter
sudo nft add table ip netfilter
sudo nft add table ip6 netfilter
sudo nft 'add chain ip netfilter input {type filter hook input priority 0; policy drop;}'
sudo nft 'add chain ip netfilter output {type filter hook output priority 0; policy drop;}'
sudo nft 'add chain ip6 netfilter input {type filter hook input priority 0; policy drop;}'
sudo nft 'add chain ip6 netfilter output {type filter hook output priority 0; policy drop;}'

#configuring rules
sudo nft 'add rule ip netfilter output meta l4proto{tcp, udp}th dport 443 ct state new,established,related accept comment "accept HTTPS"'
sudo nft 'add rule ip netfilter input meta l4proto{tcp, udp}th sport 443 ct state established,related accept comment "accept HTTPS"'

sudo nft 'add rule ip netfilter output meta l4proto{tcp, udp}th dport 80 ct state new,established,related accept comment "accept HTTP"'
sudo nft 'add rule ip netfilter input meta l4proto{tcp, udp}th sport 80 ct state established,related accept comment "accept HTTP"'

sudo nft 'add rule ip netfilter output meta l4proto{tcp, udp}th dport 22 ct state new,established,related accept comment "accept HTTPS"'
sudo nft 'add rule ip netfilter input meta l4proto{tcp, udp}th sport 22 ct state established,related accept comment "accept HTTPS"'

sudo nft 'add rule ip netfilter output ip daddr 127.0.0.1 accept comment "accept localhost"'
sudo nft 'add rule ip netfilter input ip saddr 127.0.0.1 accept comment "accept localhost"'

sudo nft 'add rule ip netfilter output meta l4proto{tcp, udp}th dport 53 ip daddr{1.1.1.1, 1.0.0.1} ct state new,established,related accept comment "accept cloudflare DNS"'
sudo nft 'add rule ip netfilter input meta l4proto{tcp, udp}th sport 53 ip saddr{1.1.1.1, 1.0.0.1} ct state established,related accept comment "accept cloudflare  DNS"'

#sudo nft 'add rule ip netfilter output meta l4proto{tcp, udp}th dport 53 ct state new,established,related accept comment "accept DNS"'
#sudo nft 'add rule ip netfilter input meta l4proto{tcp, udp}th sport 53 ct state established,related accept comment "accept DNS"'

sudo nft 'add rule ip netfilter output ip daddr 192.168.1.64 accept comment "accept for phone"'
sudo nft 'add rule ip netfilter input ip saddr 192.168.1.64 accept comment "accept for phone"'

sudo nft 'add rule ip netfilter output ip daddr 192.168.1.82 accept comment "accept for laptop"'
sudo nft 'add rule ip netfilter input ip saddr 192.168.1.82 accept comment "accept for laptop"'
#ipv6
#sudo nft 'add rule ip6 netfilter output meta l4proto{tcp, udp}th dport 80 ip6 daddr 2001:67c:1560:8008::15 ct state new,established,related accept comment "accept ppa:firefox-next"'
#sudo nft 'add rule ip6 netfilter input meta l4proto{tcp, udp}th sport 80 ip6 saddr 2001:67c:1560:8008::15 ct state established,related accept comment "accept ppa:firefox-next"'
