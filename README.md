Tsatter
=======
[![Build Status](https://travis-ci.org/Tsarpf/Tsatter.svg?branch=master)](https://magnum.travis-ci.com/Tsarpf/Tsatter)

####Probably running the newest version here: http://tsatter.com
####You can also join the same channels by connecting to prototyping.xyz using your favorite IRC-client. 

###How to deploy
- install docker
- run setup.sh
- tests should pass and the server should start

###How to develop
- install docker
- run setup.sh
- edit files in the environment folder, changes are automatically synced to the container and the server within the container restarted (using nodemon or forever)

####About:
An over-engineered lightweight chatting web application I've done in my free time using MongoDB, Express, AngularJS, NodeJS, Docker, etc.

- Backend building on top of a normal IRC-server (Inspircd)
- Dockerized development and deployment environments for simplified installs on new machines!
- BDD development using should.
- Automated tests using Mocha
- Layout and look using Twitter Bootstrap

Used to have and will have again in the future:
- Continuous Integration using Travis-CI
- Continuous Deployment


