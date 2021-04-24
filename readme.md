# Straight from 10

[Brief description and rules of the game](https://github.com/d1j/straight/wiki/Brief-description-and-rules)

## Back-end service

The service was created to handle an online multiplayer card game. Users of the service can create their personal account and give it a publicly visible username. They can use the account to create or join game lobbies and participate in public/private games.

## Install
---
Before installing, make sure that you have access to an active **MongoDB** service. 

**Node.js** with **NPM** is required.

1. Clone the repo.
2. `npm install` - install the required packages.
3. Create new `./config` directory at the root of the project.
4. Add `default.json` configuration file in the newly created `./config` directory.

#### Example config 
```json
{
  "dbConfig": {
    "name": "straight-dev",
    "port": "27017",
    "host": "localhost"
  },
  "appPort": 3000,
  "userAccCredReqs": {
    "minPassLength": 6,
    "maxPassLength": 128,
    "minUserLength": 3,
    "maxUserLength": 32
  },
  "lobbyReqs": {
    "minLobbyNameLenght": 3,
    "maxPlayerNumber": 6
  },
  "saltWorkFactor": 10,
  "jwtSecret": "randomsecret"
}
```
---

## Tools used to develop the service

* Express.js
* Node.js
* mongoDB/mongoose
* JWT
* Socket.io
* Postman
* Mocha/Chai

## Design

Project structure is somewhat based on the MVC model where `./models` contains mongoose schemas, `views` (./routes) - Express routes, and `./controllers` - service logic. User account and lobby management are strongly based on the MVC. 

The game itself runs with the help of a real-time WebSocket connection. The client initially joins a lobby using an HTTP request. Once the server approves the request and returns the necessary info, the client must join the lobby with a WebSocket connection.

After that, the game state is handled using only WebSocket connections.

## HTTP

More information on HTTP requests can be found in the code [./routes](https://github.com/d1j/straight/tree/master/routes). The comments describe requests that should be passed with the expected return examples. 

## Socket.io

More information on Socket.io events can be found in the code [./socks/index.js](https://github.com/d1j/straight/blob/master/socks/index.js).

## Client

To test out the service, I created a basic front-end application without extensive knowledge of React. Check out the code [here](https://github.com/d1j/straight-client). 

## Postman 

To test the API, you can add the following collection on Postman:
https://www.postman.com/collections/251b7e44c4f1714c12c7


## Future of the project

This was my first bigger project. Naturally, there is a lot of room for improvement.

At the current state, one can play a full game in a perfect case scenario. The back-end service was not adapted for the unforeseen WebSocket disconnects and etc.

I doubt that I will ever return to this project, however, I am glad I gave it a shot. 
