#!/bin/bash

# Docker install
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose install
sudo curl -L https://github.com/docker/compose/releases/download/1.25.5/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

sudo mkdir -p /opt/app/upload
sudo chmod -R 777 /opt/app

sudo groupadd docker
sudo gpasswd -a $USER docker
