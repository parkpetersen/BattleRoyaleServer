'use strict';

const present = require('present');
const Player = require('./player');
const Missile = require('./missile');
const Pickup = require('./pickup.js');
const NetworkIds = require('../shared/network-ids');
const Queue = require('../shared/queue.js');
const Circle = require('./circle.js');

const SIMULATION_UPDATE_RATE_MS = 10;
const STATE_UPDATE_RATE_MS = 50;
let lastUpdate = 0;
let quit = false;
let activeClients = {};
let newMissiles = [];
let activeMissiles = [];
let pickups = [];
let hits = [];
let inputQueue = Queue.create();
let nextMissileId = 1;
let shieldCircle = null;
let gameTimer = 0;
let shieldWarningSent = false;
let updateDistance = 900 / 4800;
let gameState = 'waiting';
let minPlayers = 2;
let gameStartSent = false;
let timeSinceLastMessage = 0;
let alivePlayers = {};
let countDownTime = 30000;
let islands = [];
let numIslands = 25;

function createCircle() {
    shieldCircle = Circle.create();
}

function createIslands() {
    let islandOptions = ['10x10_dirt', '10x10_grass', '5x5_dirt', '5x5_rock', '10x10_tree', '10x10_wall',
        '7x7_rock', '7x7_grass', '7x7_dirt'];

    for (let i = 0; i < numIslands; i++) {
        let randomX = Math.random();
        let randomY = Math.random();
        let positionObject = {
            position: {
                x: randomX,
                y: randomY
            }
        }
        for (let checkIsland in islands) {
            while (distance(positionObject, islands[checkIsland]) < .095) {
                randomX = Math.random();
                randomY = Math.random();
                positionObject = {
                    position: {
                        x: randomX,
                        y: randomY
                    }
                }
            }
        }
        let randomName = islandOptions[Math.floor(Math.random() * islandOptions.length)];
        let islandHeight = 0;
        let islandWidth = 0;
        if (randomName === '10x10_dirt') {
            islandHeight = .066667;
            islandWidth = .066667;
        }
        else if (randomName === '10x10_grass') {
            islandHeight = .066667;
            islandWidth = .066667;
        }
        else if (randomName === '5x5_dirt') {
            islandHeight = .03333;
            islandWidth = .03333;
        }
        else if (randomName === '5x5_rock') {
            islandHeight = .03333;
            islandWidth = .03333;
        }
        else if (randomName === '10x10_tree') {
            islandHeight = .066667;
            islandWidth = .066667;
        }
        else if (randomName === '10x10_wall') {
            islandHeight = .066667;
            islandWidth = .066667;
        }
        else if (randomName === '7x7_dirt') {
            islandHeight = .04667;
            islandWidth = .04667;
        }
        else if (randomName === '7x7_grass') {
            islandHeight = .04667;
            islandWidth = .04667;
        }
        else if (randomName === '7x7_rock') {
            islandHeight = .04667;
            islandWidth = .04667;
        }
        islands.push({
            position: {
                x: randomX,
                y: randomY
            },
            size: {
                width: islandWidth,
                height: islandHeight
            },
            top: randomY,
            bottom: randomY + islandHeight,
            left: randomX,
            right: randomX + islandWidth,
            name: randomName
        });
    }
}

function createPickups() {
    let variety = ['scope', 'health', 'damage']
    for (var i = 0; i < 50; i++) {
        pickups.push({
            id: 1,
            position: {
                x: Math.random(),
                y: Math.random()
            },
            type: variety[Math.floor(Math.random() * variety.length)],
            radius: .0075
        });
    }
}

function createMissile(clientId, playerModel, moving) {
    let momentum = 0;
    if (moving) {
        momentum = Math.PI / 8;
    }
    let missile1 = Missile.create({
        id: nextMissileId++,
        clientId: clientId,
        position: {
            x: playerModel.position.x,
            y: playerModel.position.y
        },
        direction: playerModel.direction + (Math.PI / 2) - momentum,
        speed: playerModel.speed,
        missileDamage: playerModel.playerDamage
    });

    newMissiles.push(missile1);

    let missile2 = Missile.create({
        id: nextMissileId++,
        clientId: clientId,
        position: {
            x: playerModel.position.x,
            y: playerModel.position.y
        },
        direction: playerModel.direction - (Math.PI / 2) + momentum,
        speed: playerModel.speed,
        missileDamage: playerModel.playerDamage
    });

    newMissiles.push(missile2);


}

function processInput(elapsedTime) {
    let processMe = inputQueue;
    inputQueue = Queue.create();

    while (!processMe.empty) {
        let input = processMe.dequeue();
        let client = activeClients[input.clientId];
        client.lastMessageId = input.message.id;
        switch (input.message.type) {
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
                createMissile(input.clientId, client.player, input.message.moving);
                break;
        }
    }
}

function collided(obj1, obj2) {
    let distance = Math.sqrt(Math.pow(obj1.position.x - obj2.position.x, 2) + Math.pow(obj1.position.y - obj2.position.y, 2));
    let radii = obj1.radius + obj2.radius;

    return distance <= radii;
}

function distance(obj1, obj2) {
    let distance = Math.sqrt(Math.pow(obj1.position.x - obj2.position.x, 2) + Math.pow(obj1.position.y - obj2.position.y, 2));
    return distance;
}

function update(elapsedTime, currentTime) {
    gameTimer += elapsedTime;
    if (gameState === 'waiting') {
        timeSinceLastMessage += elapsedTime;
        if (timeSinceLastMessage > 1000) {
            let waitingMessage = 'Waiting for more players';
            for (let clientId in activeClients) {
                activeClients[clientId].socket.emit(NetworkIds.DRAW_TEXT, {
                    message: waitingMessage,
                    position: activeClients[clientId].player.position,
                    duration: 1000,
                    speed: 0
                });
            }
            timeSinceLastMessage = 0;
        }
        if (Object.keys(activeClients).length >= minPlayers) {
            gameState = 'countDown';
            gameTimer = 0;
            timeSinceLastMessage = 0;
        }
    }
    if (gameState === 'countDown') {
        timeSinceLastMessage += elapsedTime;
        if (timeSinceLastMessage > 1000) {
            let countdownMessage = 'Game begins in : ' + (Math.floor((countDownTime - gameTimer) / 1000)).toString() + ' seconds';
            for (let clientId in activeClients) {
                activeClients[clientId].socket.emit(NetworkIds.DRAW_TEXT, {
                    message: countdownMessage,
                    position: activeClients[clientId].player.position,
                    duration: 1000,
                    speed: 0
                });
            }
            timeSinceLastMessage = 0;
        }

        if (!gameStartSent && gameTimer >= countDownTime) {
            gameState = 'gamePlay';
            gameStartSent = true;
            for (let clientId in activeClients) {
                let client = activeClients[clientId];
                let message = {};
                client.socket.emit(NetworkIds.START_GAME, message);
            }
            timeSinceLastMessage = 0;
        }
    }
    if (!shieldWarningSent && gameState === 'gamePlay' && gameTimer >= countDownTime + 5000) {
        let message = "Circle Starting in 10 seconds!";
        for (let clientId in activeClients) {
            activeClients[clientId].socket.emit(NetworkIds.DRAW_TEXT, {
                message: message,
                position: activeClients[clientId].player.position,
                duration: 5000, //milliseconds
                speed: .00002
            });
        }
        shieldWarningSent = true;
    }
    if (gameState === 'gamePlay') {
        shieldCircle.update(elapsedTime);
    }
    for (let clientId in activeClients) {
        let player = activeClients[clientId].player;
        player.update(currentTime);
        if (!shieldCircle.within(player)) {
            player.health -= (20 / 1000) * elapsedTime;
        }
    }

    for (let missile = 0; missile < newMissiles.length; missile++) {
        newMissiles[missile].update(elapsedTime);
    }

    let keepMissiles = [];
    for (let missile = 0; missile < activeMissiles.length; missile++) {
        //update returns false if the object has disappeared, meaning
        //we don't want to keep it.
        if (activeMissiles[missile].update(elapsedTime)) {
            keepMissiles.push(activeMissiles[missile]);
        }
    }

    activeMissiles = keepMissiles;

    keepMissiles = [];

    for (let missile = 0; missile < activeMissiles.length; missile++) {
        let hit = false;
        for (let clientId in activeClients) {
            //Don't allow a missile to hit the player it was fired from.
            if (clientId !== activeMissiles[missile].clientId) {
                if (collided(activeMissiles[missile], activeClients[clientId].player)) {
                    hit = true;
                    activeClients[clientId].player.missileHit(activeMissiles[missile].missileDamage);
                    hits.push({
                        clientId: clientId,
                        missileId: activeMissiles[missile].id,
                        position: activeClients[clientId].player.position,
                        damageDealt: activeMissiles[missile].missileDamage
                    });
                }
            }
        }
        for (let island in islands) {
            if (activeMissiles[missile].position.y >= islands[island].position.y &&
                activeMissiles[missile].position.y <= islands[island].position.y + islands[island].size.height) {
                if (activeMissiles[missile].position.x >= islands[island].position.x &&
                    activeMissiles[missile].position.x <= islands[island].position.x + islands[island].size.width) {
                    hit = true;
                    hits.push({
                        clientId: 0,
                        missileId: activeMissiles[missile].id,
                        position: activeMissiles[missile].position,
                        damageDealt: 0
                    });
                }
            }
        }
        if (!hit) {
            keepMissiles.push(activeMissiles[missile]);
        }
    }
    activeMissiles = keepMissiles;

    //
    // Pickup collision detection
    for (let pickup = 0; pickup < pickups.length; pickup++) {
        for (let clientId in activeClients) {
            if (collided(pickups[pickup], activeClients[clientId].player)) {
                let message = 'default';
                if (pickups[pickup].type === 'scope') {
                    activeClients[clientId].player.vision.radius *= 1.25;
                    message = '+vision';
                }
                else if (pickups[pickup].type === 'damage') {
                    activeClients[clientId].player.playerDamage *= 1.25;
                    message = '+damage';
                }
                else if (pickups[pickup].type === 'health') {
                    activeClients[clientId].player.health = 100;
                    message = '+health';
                }

                activeClients[clientId].socket.emit(NetworkIds.DRAW_TEXT, {
                    message: message,
                    position: activeClients[clientId].player.position,
                    duration: 2000, //milliseconds
                    speed: .00002
                });
                //remove pickup from list
                pickups = pickups.filter(function (item) {
                    return item !== pickups[pickup];
                });
                break;
            }
        }
    }

    //player-island collisions
    for (let clientId in activeClients) {
        for (let island in islands) {
            if (activeClients[clientId].player.position.y >= islands[island].position.y &&
                activeClients[clientId].player.position.y <= islands[island].position.y + islands[island].size.height) {
                if (activeClients[clientId].player.position.x >= islands[island].position.x &&
                    activeClients[clientId].player.position.x <= islands[island].position.x + islands[island].size.width) {
                    let distanceToTop = activeClients[clientId].player.position.y - islands[island].top;
                    let distanceToBottom = islands[island].bottom - activeClients[clientId].player.position.y;
                    let distanceToLeft = activeClients[clientId].player.position.x - islands[island].left;
                    let distanceToRight = islands[island].right - activeClients[clientId].player.position.x;
                    let distanceArray = [distanceToTop, distanceToBottom, distanceToLeft, distanceToRight];
                    let min = Math.min(...distanceArray);
                    if (min == distanceToTop) {
                        activeClients[clientId].player.position.y = islands[island].top;
                        activeClients[clientId].player.reportUpdate = true;
                    }
                    else if (min == distanceToBottom) {
                        activeClients[clientId].player.position.y = islands[island].bottom;
                        activeClients[clientId].player.reportUpdate = true;
                    }
                    else if (min == distanceToLeft) {
                        activeClients[clientId].player.position.x = islands[island].left;
                        activeClients[clientId].player.reportUpdate = true;
                    }
                    else if (min == distanceToRight) {
                        activeClients[clientId].player.position.x = islands[island].right;
                        activeClients[clientId].player.reportUpdate = true;
                    }
                }
            }
        }
    }
}

function updateClients(elapsedTime) {
    lastUpdate += elapsedTime;
    if (lastUpdate < STATE_UPDATE_RATE_MS) {
        return;
    }

    let missileMessages = [];
    for (let item = 0; item < newMissiles.length; item++) {
        let missile = newMissiles[item];
        missileMessages.push({
            id: missile.id,
            direction: missile.direction,
            position: {
                x: missile.position.x,
                y: missile.position.y
            },
            radius: missile.radius,
            speed: missile.speed,
            timeRemaining: missile.timeRemaining,
            missileDamage: missile.missileDamage
        });
    }

    if (gameState === 'waiting' || gameState === 'countDown') {
        for (let client in activeClients) {
            activeClients[client].socket.emit(NetworkIds.ISLANDS, islands);
        }
    }

    for (let missile = 0; missile < newMissiles.length; missile++) {
        activeMissiles.push(newMissiles[missile]);
    }
    newMissiles.length = 0;
    for (let clientId in activeClients) {
        let client = activeClients[clientId];
        let update = {
            clientId: clientId,
            lastMessageId: client.lastMessageId,
            direction: client.player.direction,
            position: client.player.position,
            updateWindow: lastUpdate,
            health: client.player.health,
            vision: client.player.vision,
            state: client.player.state,
            playerCount: Object.keys(alivePlayers).length
        };
        if (client.player.reportUpdate) {
            client.socket.emit(NetworkIds.UPDATE_SELF, update);

            for (let otherId in activeClients) {
                if (otherId !== clientId && distance(client.player, activeClients[otherId].player) <= updateDistance) {
                    activeClients[otherId].socket.emit(NetworkIds.UPDATE_OTHER, update);
                }
            }
        }
        client.socket.emit(NetworkIds.PICKUPS, pickups);
        let messageCircle = {
            position: {
                x: shieldCircle.position.x,
                y: shieldCircle.position.y
            },
            radius: shieldCircle.radius,
            shrinkingSpeed: shieldCircle.shrinkingSpeed
        };

        client.socket.emit(NetworkIds.UPDATE_CIRCLE, messageCircle);

        for (let missile = 0; missile < missileMessages.length; missile++) {
            if (distance(client.player, missileMessages[missile]) <= updateDistance) {
                client.socket.emit(NetworkIds.MISSILE_NEW, missileMessages[missile]);
            }
        }

        for (let hit = 0; hit < hits.length; hit++) {
            if (distance(client.player, hits[hit]) <= updateDistance) {
                client.socket.emit(NetworkIds.MISSILE_HIT, hits[hit]);
                if (hits[hit].clientId == clientId) {
                    let update = {
                        clientId: clientId,
                        lastMessageId: client.lastMessageId,
                        direction: client.player.direction,
                        position: client.player.position,
                        updateWindow: lastUpdate,
                        health: client.player.health,
                        vision: client.player.vision,
                        state: client.player.state
                    };
                    client.socket.emit(NetworkIds.UPDATE_SELF, update);
                }
            }
        }

        if (client.player.health <= 0 && client.player.state === 'alive') {
            let update = {
                clientId: clientId,
                message: 'You are dead. Better luck next time matey.'
            };
            client.socket.emit(NetworkIds.DEAD, update);
            client.player.state = 'sinking';
            client.player.reportUpdate = true;
            delete alivePlayers[client.socket.id];
        }
    }

    if (gameState === 'gamePlay' && Object.keys(alivePlayers).length === 1) {
        let winMessage = 'You are the winner matey!';

        for (let id in activeClients) {
            if (activeClients[id].player.health > 0) {
                let winUpdate = {
                    clientId: id,
                    message: winMessage
                };
                activeClients[id].socket.emit(NetworkIds.WIN, winUpdate);
            }
        }
        resetGame();
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

function resetGame() {
    for (let client in activeClients) {
        activeClients[client].socket.disconnect();
    }
    activeClients = {};
    gameState = 'waiting';
    islands = [];
    lastUpdate = 0;
    quit = false;
    newMissiles = [];
    activeMissiles = [];
    pickups = [];
    hits = [];
    inputQueue = Queue.create();
    nextMissileId = 1;
    shieldCircle = null;
    gameTimer = 0;
    shieldWarningSent = false;
    gameStartSent = false;
    timeSinceLastMessage = 0;
    alivePlayers = {};
    createIslands();
    createPickups();
    createCircle();
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

    io.on('connection', function (socket) {
        console.log('Connection established: ', socket.id);
        if (gameState == 'waiting' || gameState == 'countDown') {
            let newPlayer = Player.create()
            newPlayer.clientId = socket.id;
            activeClients[socket.id] = {
                socket: socket,
                player: newPlayer
            };
            alivePlayers[socket.id] = newPlayer;
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

            socket.on('disconnect', function () {
                delete activeClients[socket.id];
                notifyDisconnect(socket.id);
            });
            socket.on('chat message', function(msg){
                io.emit('chat message', msg);
            });

            notifyConnect(socket, newPlayer);
        }
        else {
            let lateMessage = "Game already in progress, please wait for game to end and refresh.";
            socket.emit(NetworkIds.DEAD, {
                message: lateMessage
            });
        }
    });
}

function initialize(httpServer) {
    initializeSocketIO(httpServer);
    createPickups();
    createCircle();
    createIslands();
    gameLoop(present(), 0);
}


function terminate() {
    this.quit = true;
}

module.exports.initialize = initialize;