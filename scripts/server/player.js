let random = require ('./random');

function createPlayer(){
    let that = {};

    let position = {
        x: random.nextDouble(),
        y: random.nextDouble()
    };

    let size = {
        width: 0.01,
        height: 0.01,
        radius: 0.02
        //may need to change values here
    };

    let direction = random.nextDouble() * 2 * Math.PI; //angle facing at start
    let rotateRate = Math.PI / 1000;
    let speed = .0002;
    let reportUpdate = false;

    Object.defineProperty(that, 'direction', {
        get: () => direction
    });

    Object.defineProperty(that, 'position', {
        get: () => position
    });

    Object.defineProperty(that, 'size', {
        get: () => size
    });

    Object.defineProperty(that, 'speed', {
        get: () => speed
    })

    Object.defineProperty(that, 'rotateRate', {
        get: () => rotateRate
    });

    Object.defineProperty(that, 'reportUpdate', {
        get: () => reportUpdate,
        set: value => reportUpdate = value
    });

    Object.defineProperty(that, 'radius', {
        get: () => size.radius
    });

    that.move = function(elapsedTime) {
        reportUpdate = true;
        let vectorX = Math.cos(direction);
        let vectorY = Math.sin(direction);

        position.x += (vectorX * elapsedTime * speed);
        position.y += (vectorY * elapsedTime * speed);
    };

    that.rotateRight = function(elapsedTime){
        reportUpdate = true;
        direction += (rotateRate * elapsedTime);
    };

    that.rotateLeft = function(elapsedTime){
        reportUpdate = true;
        direction -= (rotateRate * elapsedTime);
    };

    that.update = function(when){
    };

    return that;
}

module.exports.create = () => createPlayer();