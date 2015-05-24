sudo docker images |xargs -L1 echo $line | sudo docker rmi -f `awk '{print $3}'`
sudo docker ps -a |sudo docker rm -f `awk '{print $1}'`
