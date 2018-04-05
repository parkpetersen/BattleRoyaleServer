let random = require ('./random');

function createPlayer(){
    let that = {};

    let position = {
        x: random.nextDouble(),
        y: random.nextDouble()
    };

    let size = {
        width: 0.05,
        height: 0.05,
        radius: 0.06
        //may need to change values here
    };

    let vision = [
        {
            x : position.x,
            y : position.y
        },
        {
            x : position.x-50,
            y : position.y+100
        },
        {
            x : position.x+50,
            y : position.y+100
        }];

    let direction = random.nextDouble() * 2 * Math.PI; //angle facing at start
    let rotateRate = Math.PI / 1000;
    let speed = .0002;
    let reportUpdate = false;

    let health = 100;
    let playerDamage = 20;

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

    Object.defineProperty(that, 'playerDamage',{
        get: () => playerDamage,
        set: (value) => {playerDamage = value},
        increase: (value) => {playerDamage += value},
        decrease: (value) => {playerDamage -= value}
    });

    Object.defineProperty(that, 'health', {
        get: () => health,
        set: (value) => health = value,
        increase: (value) => {health += value},
        decrease: (value) => {health -= value}
    });

    Object.defineProperty(that, 'vision', {
        get : () => vision,
        set : (value) => vision = value
    });

    that.move = function(elapsedTime) {
        reportUpdate = true;
        let vectorX = Math.cos(direction);
        let vectorY = Math.sin(direction);

        position.x += (vectorX * elapsedTime * speed);
        position.y += (vectorY * elapsedTime * speed);

        console.log(vision);
        vision[0].x = position.x;
        vision[0].y = position.y;
    };

    that.rotateRight = function(elapsedTime){
        reportUpdate = true;
        direction += (rotateRate * elapsedTime);
    };

    that.rotateLeft = function(elapsedTime){
        reportUpdate = true;
        direction -= (rotateRate * elapsedTime);
    };

    that.missileHit = function(damage){
        health -= damage;
    };

    that.update = function(when){
    };

    return that;
}

module.exports.create = () => createPlayer();