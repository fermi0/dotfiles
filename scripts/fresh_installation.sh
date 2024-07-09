#! /bin/bash

#installation
#updating repository
#echo "Updating sources.list...."
#sudo echo "deb https://ftp.acc.umu.se/mirror/kali.org/kali kali-rolling main non-free contrib" | sudo tee /etc/apt/sources.list
#cat /etc/apt/sources.list
#sleep 5

#installoing lolcat
#echo "installing lolcat...."
#sudo apt update
#sudo apt install lolcat
#sudo ln -s -v /usr/games/lolcat /usr/bin/
#sleep 5

#upgrading system
#echo "Upgrading your system...." | lolcat
#sleep 5
#sudo apt update |lolcat && sudo apt dist-upgrade |lolcat
#sleep 5

#installing tools
#echo "Installing your applications...." | lolcat
#sleep 5
#sudo apt update --fix-missing -y
#sudo apt install xorg xinit libxcb-shape0-dev libxcb-keysyms1-dev libpango1.0-dev libxcb-util0-dev xcb libxcb1-dev libxcb-icccm4-dev libyajl-dev libev-dev libxcb-xkb-dev libxcb-cursor-dev libxkbcommon-dev libxcb-xinerama0-dev libxkbcommon-x11-dev libstartup-notification0-dev libxcb-randr0-dev libxcb-xrm0 libxcb-xrm-dev libfuse-dev libcurl4-openssl-dev libxml2-dev mime-support libtool lxappearance yakuake thunar konsole
#
#sudo apt install i3 i3blocks feh vim-gtk kali-desktop-i3 i3-gaps kali-themes kali-desktop-core kali-desktop-base light gtk-chtheme x11proto-dev dolphin breeze-icon-theme arandr qt5ct network-manager qt5-style-kvantum-themes qt5-style-plugins qt5-style-kvantum adb fastboot libavahi-compat-libdnssd-dev
#
#sudo apt install qt5-gtk2-platformtheme qt5-gtk-platformtheme libqt5multimedia5-plugins qml-module-qtmultimedia 
#sudo apt install imagemagick calibre bleachbit fonts-fantasque-sans git build-essential pkg-config rofi virtualbox audacious xterm guake kdeconnect evince eog artha gnome-disk-utility pavucontrol autoconf automake byobu compton htop neofetch lm-sensors mpv cheese pulseaudio-utils scrot qbittorrent breeze-cursor-theme gnome-themes-extra mtp-tools jmtpfs sshfs vlc audacity gvfs* sox sddm libsox-fmt-mp3 pulseaudio-module-bluetooth crunch mdk4 hashcat hostapd dhcpd sslstrip lighttpd dsniff bettercap beef hostapd-wpe asleap openssl scrcpy python3-pip nftables firejail gimp redshift network-manager-gnome apparmor-profiles apparmor-profiles-extra 




#i3-gaps
#cd ~
#echo "installing i3-gaps...." | lolcat
#sleep 7
#rm -rfv gui
#mkdir gui && cd gui
#git clone https://www.github.com/airblader/i3 i3-gaps
#cd i3-gaps
#autoreconf --force --install
#rm -rf build/
#mkdir -p build && cd build/
#../configure --prefix=/usr --sysconfdir=/etc --disable-sanitizers
#make -j8
#sudo make install
#cd ~
#sleep 7

#adding ppa
#echo "adding ppa repository...." | lolcat
#sleep 5
#sudo apt install software-properties-common -y
#sudo apt-get install apt-file -y
#sudo apt-file update
#sudo apt-file search add-apt-repository
#sudo cp -v ~/Documents/My_Documents/My_Configuration_Files/files/add-apt-repository /usr/sbin/
#sudo chmod o+x /usr/sbin/add-apt-repository
#sleep 7
#
##installing firefox
#sudo add-apt-repository ppa:mozillateam/firefox-next
#sudo apt update
#sudo apt install firefox
#
##installing indicator-kdeconnect
#echo "installing indicator-kdeconnect...." | lolcat
#sleep 2
#sudo add-apt-repository ppa:webupd8team/indicator-kdeconnect
#sudo apt update
#sudo apt install indicator-kdeconnect -y
#sleep 3

#installing miscellaneous
#google text-to-speech
sudo pip3 install gTTS
#wikipedia from terminal
sudo apt install nodejs npm | lolcat
sudo npm install wikit

#purging unnecessary tools
sudo apt autopurge
sudo apt autoclean
sudo apt purge iptables

#configurations
#updatedb for locate
echo "running updatedb...." | lolcat
sudo updatedb

#touchpad for tap to click and edge scrolling
#echo "making your touchpad ready...." | lolcat
#sleep 5
#sudo mkdir -p /etc/x11/xorg.conf.d
#sudo cp -v /home/oppenheimer/Documents/My_Documents/My_Configuration_Files/files/90-touchpad.conf /etc/x11/xorg.conf.d/
#ls -l /etc/x11/xorg.conf.d/ | grep 90-touchpad.conf
#sleep 7

#byobu prompt and vim gutter
echo "starting byobu prompt and preparing vim...." | lolcat
byobu-prompt
#sudo echo "set number" | sudo tee -a /etc/vim/vimrc
#cat /etc/vim/vimrc | grep number
sleep 7

#configuring grub image
#echo "changing grub image...." | lolcat
#sudo mv -v /usr/share/images/desktop-base/desktop-grub.png desktop-grub.png.bak
#sudo cp -v ~/Documents/My_Documents/My_Configuration_Files/images/desktop-grub.png /usr/share/images/desktop-base/
#sudo mv -v /boot/grub/themes/kali/background.png background.png.bak
#sudo cp -v ~/Documents/My_Documents/My_Configuration_Files/images/background.png /boot/grub/themes/kali/

#sudo update-grub
#sudo update-grub2
#sleep 7

#configuring sddm
echo "configuring sddm delicious...." | lolcat
git clone https://github.com/stuomas/delicious-sddm-theme.git
cd delicious-sddm-theme
./install.sh
sleep 5

#configuring firejail
echo "configuring firejail...." | lolcat
sudo firecfg
firecfg --fix
firecfg --fix-sound
firecfg --list
sleep 7

echo "export EDITOR="/usr/bin/vim.gtk3"" >> ~/.bashrc
echo "#export QT_QPA_PLATFORMTHEME="qt5ct"" >> ~/.bashrc

#setting up firewall
echo "setting up nftables...."
~/Documents/My_Documents/My_Configuration_Files/scripts/nftrules.sh

#changing permissions
echo "managing permissions...." | lolcat
sleep 5
sudo chown -R -v oppenheimer /home/oppenheimer/ | lolcat
sudo chmod -R -v 700 oppenheimer /home/oppenheimer | lolcat
sleep 5
