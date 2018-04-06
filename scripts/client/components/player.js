//------------------------------------------------------------------
//
// Model for each player in the game.
//
//------------------------------------------------------------------
MyGame.components.Player = function() {
    'use strict';
    let that = {};
    let position = {
        x: -1,
        y: -1
    };
    let size = {
        width: 0.1,
        height: 0.1
    };

    let direction = 0;
    let rotateRate = 0;
    let speed = 0;
    let health = 100;
    let vision = {
        x : position.x,
        y : position.y,
        radius : .3,
        start : direction + Math.PI/2,
        end : direction - Math.PI/2
    };
    Object.defineProperty(that, 'direction', {
        get: () => direction,
        set: (value) => { direction = value }
    });

    Object.defineProperty(that, 'speed', {
        get: () => speed,
        set: value => { speed = value; }
    });

    Object.defineProperty(that, 'rotateRate', {
        get: () => rotateRate,
        set: value => { rotateRate = value; }
    });

    Object.defineProperty(that, 'position', {
        get: () => position
    });

    Object.defineProperty(that, 'size', {
        get: () => size
    });

    Object.defineProperty(that, 'health',{
        get: () => health,
        set: (value) => {health = value}
    });

    Object.defineProperty(that, 'vision', {
        get: () => vision,
        set : (value) => vision = value
    });

    //------------------------------------------------------------------
    //
    // Public function that moves the player in the current direction.
    //
    //------------------------------------------------------------------
    that.move = function(elapsedTime) {
        let vectorX = Math.cos(direction);
        let vectorY = Math.sin(direction);

        position.x += (vectorX * elapsedTime * speed);
        position.y += (vectorY * elapsedTime * speed);
        
        vision.x = position.x;
        vision.y = position.y;
        
        vision.start = direction - Math.PI/2;
        vision.end = direction + Math.PI/2;

        console.log(direction);
    };

    //------------------------------------------------------------------
    //
    // Public function that rotates the player right.
    //
    //------------------------------------------------------------------
    that.rotateRight = function(elapsedTime) {
        direction += (rotateRate * elapsedTime);
        vision.start = direction - Math.PI/2;
        vision.end = direction + Math.PI/2;
        if(direction >= 2*Math.PI) direction -= 2*Math.PI;
        console.log(direction);
    };

    //------------------------------------------------------------------
    //
    // Public function that rotates the player left.
    //
    //------------------------------------------------------------------
    that.rotateLeft = function(elapsedTime) {
        direction -= (rotateRate * elapsedTime);
        vision.start = direction - Math.PI/2;
        vision.end = direction + Math.PI/2;
        if(direction < 0) direction += 2*Math.PI;
        console.log(direction);
    };

    that.update = function(elapsedTime) {
    };

    return that;
};
