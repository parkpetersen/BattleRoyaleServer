'use strict';

function createMissile(spec){
    let that = {};

    let radius = 0.0025;
    let speed = spec.speed*2; //faster than players speed.
    let timeRemaining = 1500;
    //values may need to be changed
    let missileDamage = spec.missileDamage;

    Object.defineProperty(that, 'clientId', {
        get: () => spec.clientId
    });

    Object.defineProperty(that, 'id', {
        get: () => spec.id
    });

    Object.defineProperty(that, 'direction', {
        get: () => spec.direction
    });

    Object.defineProperty(that, 'position', {
        get: () => spec.position
    });

    Object.defineProperty(that, 'radius', {
        get: () => radius
    });

    Object.defineProperty(that, 'speed', {
        get: () => speed
    });

    Object.defineProperty(that, 'timeRemaining', {
        get: () => timeRemaining
    });

    Object.defineProperty(that, 'missileDamage',{
        get: () => missileDamage,
        set: (value) => {missileDamage = value}
    });

    that.update = function(elapsedTime){
        let vectorX = Math.cos(spec.direction);
        let vectorY = Math.sin(spec.direction);

        spec.position.x += (vectorX * elapsedTime * speed);
        spec.position.y += (vectorY * elapsedTime * speed);

        timeRemaining -= elapsedTime;

        if(timeRemaining <= 0){
            return false;
        }
        else{
            return true;
        }
    };

    return that;
}

module.exports.create = (spec) => createMissile(spec);