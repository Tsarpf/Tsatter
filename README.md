Tsatter
=======
Tests currently do not work on travis. Should work locally though.
[![Build Status](https://travis-ci.org/Tsarpf/Tsatter.svg?branch=master)](https://magnum.travis-ci.com/Tsarpf/Tsatter)

###Probably running the newest development version here: http://prototyping.xyz/

###How to deploy
- install docker
- run setup.sh
- tests should pass and the server should start

###How to develop
- install docker
- run setup.sh
- edit files in the environment folder, changes are automatically synced to the container and the server within the container restarted (using nodemon)

####About:
An over-engineered lightweight chatting web application I've done in my free time using MongoDB, Express, AngularJS, NodeJS, Docker, etc.

- Backend building on top of a normal IRC-server (Inspircd)
- Dockerized development and deployment environments for simplified installs on new machines!
- BDD development using should.
- Automated tests using Mocha
- Dynamic HTML templates using Jade.
- Sensitive data secured by using Passport.js for logins. (SSL/TLS support will be added before release)
- Layout and look using Twitter Bootstrap

Used to have and will have again in the future:
- Continuous Integration using Travis-CI
- Continuous Deployment

####Current features:
- Persistent chat rooms, users' login data and messages.
- Login sessions saved to a (encrypted) cookie so login sessions persistent over page changes.
- 50 message backlog from chat room sent upon joining.
- When logged in joined rooms are saved to user data and reopened automatically on login.
- Dynamically updated list of recently active chat rooms.
etc.

