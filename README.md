Tsatter
=======

[![Build Status](https://travis-ci.org/Tsarpf/Tsatter.svg?branch=master)](https://magnum.travis-ci.com/Tsarpf/Tsatter)

###Probably running the newest development version here: http://prototyping.xyz/

###How to use
- install docker
- run setup.sh


####About:
An over-engineered lightweight chatting web application I've done in my free time using MongoDB, Express, AngularJS, NodeJS, Socket.IO, etc.

- NEW! Dockerized development and deployment environments for super easy install on all machines.
- BDD development using should.
- Automatic tests using Mocha
- Continuous Integration using Travis-CI
- Continuous Deployment
- Dynamic HTML templates using Jade.
- Sensitive data secured by using Passport.js for logins. (SSL/TLS support will be added before release)
- Layout and look using Twitter Bootstrap

####Current features:
- Persistent chat rooms, users' login data and messages.
- Login sessions saved to a (encrypted) cookie so login sessions persistent over page changes.
- 50 message backlog from chat room sent upon joining.
- When logged in joined rooms are saved to user data and reopened automatically on login.
- Dynamically updated list of recently active chat rooms.
etc.

