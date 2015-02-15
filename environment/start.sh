#!/bin/sh
while ! curl http://db_1:27017
do
  echo "$(date) - still trying - this takes something like 30 - 60 seconds"
  sleep 1
done
echo "$(date) - connected successfully"
mkdir -p src/public/libs/css
mkdir -p src/public/libs/js
cp bower_components/bootstrap/dist/css/bootstrap.min.css src/public/libs/css/
cp bower_components/angular/angular.min.js src/public/libs/js/
cp bower_components/angular/angular.min.js.map src/public/libs/js/
cp bower_components/angular-animate/angular-animate.min.js src/public/libs/js/
cp bower_components/angular-animate/angular-animate.min.js.map src/public/libs/js/
cp bower_components/socket.io-client/socket.io.js src/public/libs/js/
cp bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js src/public/libs/js/

cp -r bower_components src/public/libs/bower_components

cp bower_components/bootstrap/dist/css/bootstrap.css src/public/libs/css/
cp bower_components/bootstrap/dist/css/bootstrap.css.map src/public/libs/css/
cp bower_components/angular/angular.js src/public/libs/js/
cp bower_components/angular/angular.js.map src/public/libs/js/
cp bower_components/angular-animate/angular-animate.js src/public/libs/js/
cp bower_components/angular-animate/angular-animate.js.map src/public/libs/js/
cp bower_components/socket.io-client/socket.io.js src/public/libs/js/
cp bower_components/angular-bootstrap/ui-bootstrap-tpls.js src/public/libs/js/
cd src
npm test
npm start
