#!/usr/bin/zsh

apt update -y && apt full-upgrade -y && apt autopurge -y && apt autoclean -y && apt clean -y
