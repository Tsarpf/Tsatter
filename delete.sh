sudo docker images |xargs -L1 echo $line | sudo docker rmi -f `awk '{print $3}'`
