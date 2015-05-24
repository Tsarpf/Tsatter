#!/bin/bash
cd dockerhost
vagrant ssh -- 'docker rm -f $(docker ps -a -q)'
