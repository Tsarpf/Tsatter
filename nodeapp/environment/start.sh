#!/bin/bash
sudo service ssh start
while ! curl http://db_1:27017
do
  echo "$(date) - still trying - this takes something like 30 - 60 seconds"
  sleep 1
done
echo "$(date) - connected successfully"

cd src

grunt deps

npm test

grunt build

forever start --minUptime 8000 -a -l ./forever.log -o ./server-out.log -e ./err.log -c "npm start" ./
forever list

grunt watchStatic

#echo "tail -f src/out.log to see what the server is doing"
#echo "Executing: $@"
#exec "$@"



