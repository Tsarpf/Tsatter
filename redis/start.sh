sudo docker stop redisdb
sudo docker rm -f redisdb
sudo docker run --name redisdb -v $(pwd)/redisdata/:/data -d redis redis-server --appendonly yes 
