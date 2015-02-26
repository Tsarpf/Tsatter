#!/bin/sh
while ! curl http://db_1:27017
do
  echo "$(date) - still trying - this takes something like 30 - 60 seconds"
  sleep 1
done
echo "$(date) - connected successfully"

grunt deps

cd src
npm test
forever start -c "npm start" ./
forever list

