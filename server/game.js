'use strict';

const present = require('present.js');
const Player = require('./player.js');
const Missile = require('./missile.js');
const NetworkIds = require('../shared/netwrok-ids.js');
const Queue = require('..shared/queue.js');

const SIMULATION_UPDATE_RATE_MS = 50;
const STATE_UPDATE_RATE_MS = 100;
let lastUpdate = 0;
let quit = false;
let activeClients = {};
let newMissiles = [];
let activeMissiles = [];
let hits = [];
let inputQueue = Queue.create();
let nextMissileId = 1;

function createMissile(clientId, playerModel){
    let missile = Missile.create({
        id: nextMissileId++,
        clientId: clientId,
        position: {
            x : playerModel.position.x,
            y: playerModel.position.y
        },
        direction: playerModel.direction,
        speed: playerModel.speed
    });

    newMissiles.push(missile);
}

function processInput(elapsedTime){
    let processMe = inputQueue;
    inputQueue = Queue.create();

    while(!processMe.empty){
        let input = processMe.dequeue();
        let client = activeClients[input.clientId];
        client.lastMessageId = input.message.id;
        switch(input.message.type){
            case NetworkIds.INPUT_MOVE:
                client.player.move(input.message.elapsedTime);
                break;
            case NetworkIds.INPUT_ROTATE_LEFT:
                client.player.rotateLeft(input.message.elapsedTime);
                break;
            case NetworkIds.INPUT_ROTATE_RIGHT:
                client.player.rotateRight(input.message.elapsedTime);
                break;
            case NetworkIds.INPUT_FIRE:
                createMissile(input.clientId, client.player);
                break;
        }
    }
}

function collided(obj1, obj2){
    let distance = Math.sqrt(Math.pow(obj1.position.x - obj2.position.x, 2) + Math.pow(obj1.position.y - obj2.position.y, 2));
    let radii = obj1.radius + obj2.radius;

    return distance <= radii;
}

function update(elapsedTime, currentTime){
    for(let clientId in activeClients) {
        activeClients[clientId].player.update(currentTime);
    }

    for(let missile=0; missile < newMissiles.length; missile++){
        newMissiles[missile].update(elapsedTime);
    }

    let keepMissiles = [];
    for(let missile = 0; missile < activeMissiles.length; missile++){
        //update returns false if the object has disappeared, meaning
        //we don't want to keep it.
        if(activeMissiles[missile].update(elapsedTime)){
            keepMissiles.push(activeMissiles[missile]);
        }
    }

    activeMissiles = keepMissiles;

    keepMissiles = [];

    for(let missile = 0; missile < activeMissiles.length; missile++) {
        let hit = false;
        for(let clientId in activeClients) {
            //Don't allow a missile to hit the player it was fired from.
            if(clientId !== activeMissiles[missile].clientId){
                if(collided(activeMissiles[missile], activeClients[clientId].player)){
                    hit = true;
                    hits.push({
                        clientId : clientId,
                        missileId : activeMissiles[missile].id,
                        position: activeClients[clientId].player.position
                    });
                }
            }
        }
        if(!hit){
            keepMissiles.push(activeMissiles[missile]);
        }
    }
    activeMissiles = keepMissiles;
}

function updateClients(elapsedTime){
    lastUpdate += elapsedTime;
    if(lastUpdate < STATE_UPDATE_RATE_MS){
        return;
    }

    let missileMessages = [];
    for(let item = 0; item < newMissiles.length; item++){
        let missile = newMissiles[item];
        missileMessages.push({
            id: missile.id,
            direction: missile.direction,
            position: {
                x : missile.position.x,
                y: missile.position.y
            },
            radius: missile.radius,
            speed: missile.speed,
            timeRemaining: missile.timeRemaining
        });
    }

    for(let missile = 0; missile < newMissiles.length; missile++){
        activeMissiles.push(newMissiles[missile]);
    }
    newMissiles.length = 0;

    for(let clientId in activeClients) {
        let client = activeClients[clientId];
        let update = {
            clientId: clientId,
            lastMessageId: client.lastMessageId,
            direction: client.player.direction,
            position: client.player.position,
            updateWindow: lastUpdate
        };
        if(client.player.reportUpdate) {
            client.socket.emit(NetworkIds.UPDATE_SELF, update);

            for(let otherId in activeClients) {
                if(otherId !== clientId){
                    activeClients[otherId].socket.emit(NetworkIds.UPDATE_OTHER, update);
                }
            }
        }

        for (let missile = 0; missile < missileMessages.length; missile++) {
            client.socket.emit(NetworkIds.MISSILE_NEW, missileMessages[missile]);
        }
        
        for (let hit = 0; hit < hits.length; hit++) {
            client.socket.emit(NetworkIds.MISSILE_HIT, hits[hit]);
        }
    }

    for (let clientId in activeClients) {
        activeClients[clientId].player.reportUpdate = false;
    }

    // Don't need these anymore, clean up
    hits.length = 0;
    // Reset the elapsed time since last update so 
    // we can know when to put out the next update.
    lastUpdate = 0;
}

function gameLoop(currentTime, elapsedTime) {
    processInput(elapsedTime);
    update(elapsedTime, currentTime);
    updateClients(elapsedTime);

    if (!quit) {
        setTimeout(() => {
            let now = present();
            gameLoop(now, now - currentTime);
        }, SIMULATION_UPDATE_RATE_MS);
    }
}

function initializeSocketIO(httpServer) {
    let io = require('socket.io')(httpServer);

    function notifyConnect(socket, newPlayer) {
        for (let clientId in activeClients) {
            let client = activeClients[clientId];
            if (newPlayer.clientId !== clientId) {
                // Tell existing about the newly connected player
                client.socket.emit(NetworkIds.CONNECT_OTHER, {
                    clientId: newPlayer.clientId,
                    direction: newPlayer.direction,
                    position: newPlayer.position,
                    rotateRate: newPlayer.rotateRate,
                    speed: newPlayer.speed,
                    size: newPlayer.size
                });
                // Tell the new player about the already connected player
                socket.emit(NetworkIds.CONNECT_OTHER, {
                    clientId: client.player.clientId,
                    direction: client.player.direction,
                    position: client.player.position,
                    rotateRate: client.player.rotateRate,
                    speed: client.player.speed,
                    size: client.player.size
                });
            }
        }
    }

    function notifyDisconnect(playerId) {
        for (let clientId in activeClients) {
            let client = activeClients[clientId];
            if (playerId !== clientId) {
                client.socket.emit(NetworkIds.DISCONNECT_OTHER, {
                    clientId: playerId
                });
            }
        }
    }
    
    io.on('connection', function(socket) {
        console.log('Connection established: ', socket.id);
        let newPlayer = Player.create()
        newPlayer.clientId = socket.id;
        activeClients[socket.id] = {
            socket: socket,
            player: newPlayer
        };
        socket.emit(NetworkIds.CONNECT_ACK, {
            direction: newPlayer.direction,
            position: newPlayer.position,
            size: newPlayer.size,
            rotateRate: newPlayer.rotateRate,
            speed: newPlayer.speed
        });

        socket.on(NetworkIds.INPUT, data => {
            inputQueue.enqueue({
                clientId: socket.id,
                message: data
            });
        });

        socket.on('disconnect', function() {
            delete activeClients[socket.id];
            notifyDisconnect(socket.id);
        });

        notifyConnect(socket, newPlayer);
    });
}

function initialize(httpServer) {
    initializeSocketIO(httpServer);
    gameLoop(present(), 0);
}


function terminate() {
    this.quit = true;
}

module.exports.initialize = initialize;