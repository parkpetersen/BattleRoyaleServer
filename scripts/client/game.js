//------------------------------------------------------------------
//
// This function provides the "game" code.
//
//------------------------------------------------------------------
let cannonFire = new Howl({ src: ['assets/audio/cannon_fire.mp3'], volume: 0.20 });
let cannonHit = new Howl({ src: ['assets/audio/hit.mp3'], volume: 0.20 });
let sinkSound = new Howl({ src: ['assets/audio/ship-sinking.wav'], volume: 0.20 });
let music = new Howl({ src: ['assets/audio/song.mp3'], loop: true, volume: 0.20 });
let Mplay = false; //music
let Splay = false; //sound

MyGame.main = (function (graphics, renderer, input, components) {
    'use strict';

    let lastTimeStamp = performance.now(),
        myKeyboard = input.Keyboard(),
        playerSelf = {
            model: components.Player(),
            texture: MyGame.assets['player-self-east']
        },
        playerOthers = {},
        clip = {
            clipping: false
        },
        missiles = {},
        explosions = {},
        pickups = [],
        textMessages = [],
        messageHistory = Queue.create(),
        messageId = 1,
        nextExplosionId = 1,
        socket = io(),
        networkQueue = Queue.create(),
        upIdKey = 0,
        leftIdKey = 0,
        rightIdKey = 0,
        downIdKey = 0,
        upIdKey2 = 0,
        leftIdKey2 = 0,
        rightIdKey2 = 0,
        downIdKey2 = 0,
        fireIdKey = 0,
        shieldCircle = components.Circle(),
        particleEngine = components.ParticleEngine.ParticleEngine(),
        islands = [];



    socket.on(NetworkIds.CONNECT_ACK, data => {
        networkQueue.enqueue({
            type: NetworkIds.CONNECT_ACK,
            data: data
        });
    });

    socket.on(NetworkIds.CONNECT_OTHER, data => {
        networkQueue.enqueue({
            type: NetworkIds.CONNECT_OTHER,
            data: data
        });
    });

    socket.on(NetworkIds.DISCONNECT_OTHER, data => {
        networkQueue.enqueue({
            type: NetworkIds.DISCONNECT_OTHER,
            data: data
        });
    });

    socket.on(NetworkIds.UPDATE_SELF, data => {
        networkQueue.enqueue({
            type: NetworkIds.UPDATE_SELF,
            data: data
        });
    });

    socket.on(NetworkIds.UPDATE_OTHER, data => {
        networkQueue.enqueue({
            type: NetworkIds.UPDATE_OTHER,
            data: data
        });
    });

    socket.on(NetworkIds.MISSILE_NEW, data => {
        networkQueue.enqueue({
            type: NetworkIds.MISSILE_NEW,
            data: data
        });
    });

    socket.on(NetworkIds.MISSILE_HIT, data => {
        networkQueue.enqueue({
            type: NetworkIds.MISSILE_HIT,
            data: data
        });
    });

    socket.on(NetworkIds.DEAD, data => {
        networkQueue.enqueue({
            type: NetworkIds.DEAD,
            data: data
        });
    });
    socket.on(NetworkIds.PICKUPS, data => {
        networkQueue.enqueue({
            type: NetworkIds.PICKUPS,
            data: data
        });
    });
    socket.on(NetworkIds.DRAW_TEXT, data => {
        networkQueue.enqueue({
            type: NetworkIds.DRAW_TEXT,
            data: data
        });
    });
    socket.on(NetworkIds.UPDATE_CIRCLE, data => {
        networkQueue.enqueue({
            type: NetworkIds.UPDATE_CIRCLE,
            data: data
        });
    });
    socket.on(NetworkIds.START_GAME, data => {
        networkQueue.enqueue({
            type: NetworkIds.START_GAME,
            data: data
        });
    });
    socket.on(NetworkIds.WIN, data => {
        networkQueue.enqueue({
            type: NetworkIds.WIN,
            data: data
        });
    });
    socket.on(NetworkIds.ISLANDS, data => {
        networkQueue.enqueue({
            type: NetworkIds.ISLANDS,
            data: data
        });
    });

    //------------------------------------------------------------------
    //
    // Handler for when the server ack's the socket connection.  We receive
    // the state of the newly connected player model.
    //
    //------------------------------------------------------------------
    function connectPlayerSelf(data) {
        playerSelf.model.position.x = data.position.x;
        playerSelf.model.position.y = data.position.y;

        playerSelf.model.size.x = data.size.x;
        playerSelf.model.size.y = data.size.y;

        playerSelf.model.direction = data.direction;
        playerSelf.model.speed = data.speed;
        playerSelf.model.rotateRate = data.rotateRate;
    }

    //------------------------------------------------------------------
    //
    // Handler for when a new player connects to the game.  We receive
    // the state of the newly connected player model.
    //
    //------------------------------------------------------------------
    function connectPlayerOther(data) {
        let model = components.PlayerRemote();
        model.state.position.x = data.position.x;
        model.state.position.y = data.position.y;
        model.state.direction = data.direction;
        model.state.lastUpdate = performance.now();
        model.state.state = 'alive';

        model.goal.position.x = data.position.x;
        model.goal.position.y = data.position.y;
        model.goal.direction = data.direction;
        model.goal.updateWindow = 0;
        model.goal.state = 'alive';

        model.size.x = data.size.x;
        model.size.y = data.size.y;

        playerOthers[data.clientId] = {
            model: model,
            texture: MyGame.assets['player-other-east']
        };
    }

    //------------------------------------------------------------------
    //
    // Handler for when another player disconnects from the game.
    //
    //------------------------------------------------------------------
    function disconnectPlayerOther(data) {
        delete playerOthers[data.clientId];
    }

    //------------------------------------------------------------------
    //
    // Handler for receiving state updates about the self player.
    //
    //------------------------------------------------------------------
    function updatePlayerSelf(data) {
        playerSelf.model.position.x = data.position.x;
        playerSelf.model.position.y = data.position.y;
        playerSelf.model.direction = data.direction;
        playerSelf.model.health = data.health;
        playerSelf.model.vision = data.vision;
        let textureString = 'player-self-' + getTexture(playerSelf.model.direction);
        playerSelf.texture = MyGame.assets[textureString];
        playerSelf.model.state = data.state;


        //
        // Remove messages from the queue up through the last one identified
        // by the server as having been processed.
        let done = false;
        while (!done && !messageHistory.empty) {
            if (messageHistory.front.id === data.lastMessageId) {
                done = true;
            }
            messageHistory.dequeue();
        }

        //
        // Update the client simulation since this last server update, by
        // replaying the remaining inputs.
        let memory = Queue.create();
        while (!messageHistory.empty) {
            let message = messageHistory.dequeue();
            switch (message.type) {
                case 'move':
                    playerSelf.model.move(message.elapsedTime);
                    break;
                case 'rotate-right':
                    playerSelf.model.rotateRight(message.elapsedTime);
                    break;
                case 'rotate-left':
                    playerSelf.model.rotateLeft(message.elapsedTime);
                    break;
            }
            memory.enqueue(message);
        }
        messageHistory = memory;
    }

    //------------------------------------------------------------------
    //
    // Handler for receiving state updates about other players.
    //
    //------------------------------------------------------------------
    function updatePlayerOther(data) {
        if (playerOthers.hasOwnProperty(data.clientId)) {
            let model = playerOthers[data.clientId].model;
            model.goal.updateWindow = data.updateWindow;

            model.goal.position.x = data.position.x;
            model.goal.position.y = data.position.y
            model.goal.direction = data.direction;
            model.goal.health = data.health;
            model.goal.state = data.state;
        }
    }

    function getTexture(direction, state) {
        let prefix = '';
        let postfix = '';
        if (state === 'sinking') {
            prefix = 'sinking-';
            postfix = '-2';
        }
        let myDirection = direction % (2 * Math.PI);
        if (myDirection === 0 || Math.abs(myDirection) === 2 * Math.PI) {
            return prefix + 'east' + postfix;
        }
        if (myDirection >= 2 * Math.PI) {
            myDirection = myDirection % (2 * Math.PI);
        }
        else if (myDirection < 0 && myDirection > -2 * Math.PI) {
            myDirection = (2 * Math.PI) - (Math.abs(myDirection));
        }
        else if (myDirection <= -2 * Math.PI) {
            myDirection = -((2 * Math.PI) - (Math.abs(myDirection) % (2 * Math.PI)))
        }
        if (myDirection > Math.PI / 12 && myDirection < 5 * Math.PI / 12) {
            return prefix + 'south-east' + postfix;
        }
        else if (myDirection >= 5 * Math.PI / 12 && myDirection <= 7 * Math.PI / 12) {
            return prefix + 'south' + postfix;
        }
        else if (myDirection > 7 * Math.PI / 12 && myDirection < 11 * Math.PI / 12) {
            return prefix + 'south-west' + postfix;
        }
        else if (myDirection >= 11 * Math.PI / 12 && myDirection <= 13 * Math.PI / 12) {
            return prefix + 'west' + postfix;
        }
        else if (myDirection > 13 * Math.PI / 12 && myDirection < 17 * Math.PI / 12) {
            return prefix + 'north-west' + postfix;
        }
        else if (myDirection >= 17 * Math.PI / 12 && myDirection <= 19 * Math.PI / 12) {
            return prefix + 'north' + postfix;
        }
        else if (myDirection > 19 * Math.PI / 12 && myDirection < 23 * Math.PI / 12) {
            return prefix + 'north-east' + postfix;
        }
        else if (myDirection <= Math.PI / 12 && myDirection >= 0) {
            return prefix + 'east' + postfix;
        }
        else if (myDirection >= 23 * Math.PI / 12 && myDirection <= 2 * Math.PI) {
            return prefix + 'east' + postfix;
        }
    }

    //------------------------------------------------------------------
    //
    // Handler for receiving notice of a new missile in the environment.
    //
    //------------------------------------------------------------------
    function missileNew(data) {
        missiles[data.id] = components.Missile({
            id: data.id,
            radius: data.radius,
            speed: data.speed,
            direction: data.direction,
            position: {
                x: data.position.x,
                y: data.position.y
            },
            timeRemaining: data.timeRemaining
        });
    }

    //------------------------------------------------------------------
    //
    // Handler for receiving notice that a missile has hit a player.
    //
    //------------------------------------------------------------------
    function missileHit(data) {
        explosions[nextExplosionId] = components.AnimatedSprite({
            id: nextExplosionId++,
            spriteSheet: MyGame.assets['explosion'],
            spriteSize: { width: 0.07, height: 0.07 },
            spriteCenter: data.position,
            spriteCount: 16,
            spriteTime: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
        });
        particleEngine.createParticleSystem(data.position);

        //
        // When we receive a hit notification, go ahead and remove the
        // associated missle from the client model.
        delete missiles[data.missileId];
    }

    function killPlayer(data) {
        myKeyboard.unregisterHandler(MyGame.input.KeyEvent.DOM_VK_UP, upIdKey);
        myKeyboard.unregisterHandler(MyGame.input.KeyEvent.DOM_VK_RIGHT, rightIdKey);
        myKeyboard.unregisterHandler(MyGame.input.KeyEvent.DOM_VK_LEFT, leftIdKey);
        myKeyboard.unregisterHandler(MyGame.input.KeyEvent.DOM_VK_SPACE, fireIdKey);

        myKeyboard.unregisterHandler(MyGame.input.KeyEvent.DOM_VK_W, upIdKey2);
        myKeyboard.unregisterHandler(MyGame.input.KeyEvent.DOM_VK_D, rightIdKey2);
        myKeyboard.unregisterHandler(MyGame.input.KeyEvent.DOM_VK_A, leftIdKey2);

        playerSelf.model.state = 'sinking';
        let message = {
            id: messageId++,
            elapsedTime: 10,
            type: NetworkIds.INPUT_ROTATE_LEFT
        };
        socket.emit(NetworkIds.INPUT, message);
        messageHistory.enqueue(message);
        alert(data.message);
    }

    function setIslands(data) {
        islands = data;
    }

    function registerControls() {
        upIdKey = myKeyboard.registerHandler(elapsedTime => {
            let message = {
                id: messageId++,
                elapsedTime: elapsedTime,
                type: NetworkIds.INPUT_MOVE
            };
            socket.emit(NetworkIds.INPUT, message);
            messageHistory.enqueue(message);
            playerSelf.model.move(elapsedTime);
        },
            MyGame.input.KeyEvent.DOM_VK_UP, true);

        upIdKey2 = myKeyboard.registerHandler(elapsedTime => {
            let message = {
                id: messageId++,
                elapsedTime: elapsedTime,
                type: NetworkIds.INPUT_MOVE
            };
            socket.emit(NetworkIds.INPUT, message);
            messageHistory.enqueue(message);
            playerSelf.model.move(elapsedTime);
        },
            MyGame.input.KeyEvent.DOM_VK_W, true);

        rightIdKey = myKeyboard.registerHandler(elapsedTime => {
            let message = {
                id: messageId++,
                elapsedTime: elapsedTime,
                type: NetworkIds.INPUT_ROTATE_RIGHT
            };
            socket.emit(NetworkIds.INPUT, message);
            messageHistory.enqueue(message);
            playerSelf.model.rotateRight(elapsedTime);
        },
            MyGame.input.KeyEvent.DOM_VK_RIGHT, true);

        rightIdKey2 = myKeyboard.registerHandler(elapsedTime => {
            let message = {
                id: messageId++,
                elapsedTime: elapsedTime,
                type: NetworkIds.INPUT_ROTATE_RIGHT
            };
            socket.emit(NetworkIds.INPUT, message);
            messageHistory.enqueue(message);
            playerSelf.model.rotateRight(elapsedTime);
        },
            MyGame.input.KeyEvent.DOM_VK_D, true);

        leftIdKey = myKeyboard.registerHandler(elapsedTime => {
            let message = {
                id: messageId++,
                elapsedTime: elapsedTime,
                type: NetworkIds.INPUT_ROTATE_LEFT
            };
            socket.emit(NetworkIds.INPUT, message);
            messageHistory.enqueue(message);
            playerSelf.model.rotateLeft(elapsedTime);
        },
            MyGame.input.KeyEvent.DOM_VK_LEFT, true);

        leftIdKey2 = myKeyboard.registerHandler(elapsedTime => {
            let message = {
                id: messageId++,
                elapsedTime: elapsedTime,
                type: NetworkIds.INPUT_ROTATE_LEFT
            };
            socket.emit(NetworkIds.INPUT, message);
            messageHistory.enqueue(message);
            playerSelf.model.rotateLeft(elapsedTime);
        },
            MyGame.input.KeyEvent.DOM_VK_A, true);

        fireIdKey = myKeyboard.registerHandler(elapsedTime => {
            let message = {
                id: messageId++,
                elapsedTime: elapsedTime,
                type: NetworkIds.INPUT_FIRE
            };
            socket.emit(NetworkIds.INPUT, message);
        },
            MyGame.input.KeyEvent.DOM_VK_SPACE, false);
    }

    function checkCollisions() {
        for (let island in islands) {
            if (playerSelf.model.position.y >= islands[island].position.y &&
                playerSelf.model.position.y <= islands[island].position.y + islands[island].size.height) {
                if (playerSelf.model.position.x >= islands[island].position.x &&
                    playerSelf.model.position.x <= islands[island].position.x + islands[island].size.width) {
                    let distanceToTop = playerSelf.model.position.y - islands[island].top;
                    let distanceToBottom = islands[island].bottom - playerSelf.model.position.y;
                    let distanceToLeft = playerSelf.model.position.x - islands[island].left;
                    let distanceToRight = islands[island].right - playerSelf.model.position.x;
                    let distanceArray = [distanceToTop, distanceToBottom, distanceToLeft, distanceToRight];
                    let min = Math.min(distanceArray);
                    if (min == distanceToTop) {
                        playerSelf.model.position.y = islands[island].top;
                        playerSelf.model.reportUpdate = true;
                    }
                    else if (min == distanceToBottom) {
                        playerSelf.model.position.y = islands[island].bottom;
                        playerSelf.model.reportUpdate = true;
                    }
                    else if (min == distanceToLeft) {
                        playerSelf.model.position.x = islands[island].left;
                        playerSelf.model.reportUpdate = true;
                    }
                    else if (min == distanceToRight) {
                        playerSelf.model.position.x = islands[island].right;
                        playerSelf.model.reportUpdate = true;
                    }
                }
            }
        }
    }

    function updatePickups(data) {
        pickups = data;
    }

    function updateTextMessages(data) {
        textMessages.push(data);
    }

    function updateCircle(data) {
        shieldCircle.radius = data.radius;
        shieldCircle.position = data.position;
        shieldCircle.shrinkingSpeed = data.shrinkingSpeed;
    }

    function win(data) {
        messageHistory.enqueue(data.message);
        alert(data.message);
    }
    //------------------------------------------------------------------
    //
    // Process the registered input handlers here.
    //
    //------------------------------------------------------------------
    function processInput(elapsedTime) {
        //
        // Start with the keyboard updates so those messages can get in transit
        // while the local updating of received network messages are processed.
        myKeyboard.update(elapsedTime);

        //
        // Double buffering on the queue so we don't asynchronously receive messages
        // while processing.
        let processMe = networkQueue;
        networkQueue = networkQueue = Queue.create();
        while (!processMe.empty) {
            let message = processMe.dequeue();
            switch (message.type) {
                case NetworkIds.CONNECT_ACK:
                    connectPlayerSelf(message.data);
                    break;
                case NetworkIds.CONNECT_OTHER:
                    connectPlayerOther(message.data);
                    break;
                case NetworkIds.DISCONNECT_OTHER:
                    disconnectPlayerOther(message.data);
                    break;
                case NetworkIds.UPDATE_SELF:
                    updatePlayerSelf(message.data);
                    break;
                case NetworkIds.UPDATE_OTHER:
                    updatePlayerOther(message.data);
                    break;
                case NetworkIds.MISSILE_NEW:
                    missileNew(message.data);
                    cannonFire.play();
                    break;
                case NetworkIds.MISSILE_HIT:
                    missileHit(message.data);
                    cannonHit.play();
                    break;
                case NetworkIds.DEAD:
                    killPlayer(message.data);
                    break;
                case NetworkIds.PICKUPS:
                    updatePickups(message.data);
                    break;
                case NetworkIds.DRAW_TEXT:
                    updateTextMessages(message.data);
                    break;
                case NetworkIds.UPDATE_CIRCLE:
                    updateCircle(message.data);
                    break;
                case NetworkIds.START_GAME:
                    registerControls();
                    break;
                case NetworkIds.WIN:
                    win(message.data);
                    break;
                case NetworkIds.ISLANDS:
                    setIslands(message.data);
                    break;
            }
        }
    }

    //------------------------------------------------------------------
    //
    // Update the game simulation
    //
    //------------------------------------------------------------------
    function update(elapsedTime) {
        checkCollisions();
        playerSelf.model.update(elapsedTime);
        particleEngine.update(elapsedTime);
        for (let id in playerOthers) {
            playerOthers[id].model.update(elapsedTime);
        }

        let removeMissiles = [];
        for (let missile in missiles) {
            if (!missiles[missile].update(elapsedTime)) {
                removeMissiles.push(missiles[missile]);
            }
        }

        for (let missile = 0; missile < removeMissiles.length; missile++) {
            delete missiles[removeMissiles[missile].id];
        }

        for (let id in explosions) {
            if (!explosions[id].update(elapsedTime)) {
                delete explosions[id];
            }
        }
        for (let message in textMessages) {
            textMessages[message].duration -= elapsedTime;
            textMessages[message].position.y -= textMessages[message].speed * elapsedTime;

            if (textMessages[message].duration <= 0) {
                textMessages = textMessages.filter(function (item) {
                    return item !== textMessages[message];
                });
                break;
            }
        }
    }

    //------------------------------------------------------------------
    //
    // Render the current state of the game simulation
    //
    //------------------------------------------------------------------
    function render() {
        graphics.clear();

        let textureString = 'player-self-' + getTexture(playerSelf.model.direction, playerSelf.model.state);
        playerSelf.texture = MyGame.assets[textureString];
        //graphics.drawWorldBoundary(1, 1);
        graphics.setCamera(playerSelf.model, 0, 4800, 0, 4800);
        graphics.drawMiniMap(playerSelf.model, shieldCircle, islands);
        graphics.drawBackground();
        renderer.Island.render(islands);
        renderer.Circle.render(shieldCircle);
        renderer.Player.render(playerSelf.model, playerSelf.texture);

        for (let message in textMessages) {
            graphics.drawText(textMessages[message]);
        }

        graphics.enableClipping(playerSelf.model, clip);

        for (let id in playerOthers) {
            let player = playerOthers[id];
            let textureKey = 'player-other-' + getTexture(player.model.state.direction, player.model.state.state);
            renderer.PlayerRemote.render(player.model, MyGame.assets[textureKey]);
        }

        for (let missile in missiles) {
            renderer.Missile.render(missiles[missile]);
        }

        for (let pickup in pickups) {
            renderer.Pickup.render(pickups[pickup], MyGame.assets['chest']);
        }

        graphics.disableClipping(clip);
        graphics.renderParticleSystems(particleEngine);

        for (let id in explosions) {
            renderer.AnimatedSprite.render(explosions[id]);
        }
    }

    //---------------------------------------------------------------
    //
    // Add some game play music
    //
    //---------------------------------------------------------------
    function getMusicValue() {
        var checked = document.getElementById('checkMusic').checked;

        if (checked == true && Mplay == false) {
            music.play();
            Mplay = true;
        }
        if (checked == false) {
            music.pause();
            Mplay = false;
        }
    }

    //---------------------------------------------------------------
    //
    // Enable Disable Sounds
    //
    //---------------------------------------------------------------
    function getSoundValue() {
        var checked = document.getElementById('checkSound').checked;
        if (checked == true && Splay == false) {
            Howler.volume(.20);
            Splay = true;
        }
        if (checked == false) {
            Howler.volume(0);
            Splay = false;
        }
    }

    //------------------------------------------------------------------
    //
    // Client-side game loop
    //
    //------------------------------------------------------------------
    function gameLoop(time) {
        let elapsedTime = time - lastTimeStamp;
        lastTimeStamp = time;
        processInput(elapsedTime);
        update(elapsedTime);
        render();
        getMusicValue();
        getSoundValue();
        requestAnimationFrame(gameLoop);
    };

    //------------------------------------------------------------------
    //
    // Public function used to get the game initialized and then up
    // and running.
    //
    //------------------------------------------------------------------
    function initialize() {
        console.log('game initializing...');
        //
        // Get the game loop started
        requestAnimationFrame(gameLoop);
    }

    return {
        initialize: initialize
    };

}(MyGame.graphics, MyGame.renderer, MyGame.input, MyGame.components));
