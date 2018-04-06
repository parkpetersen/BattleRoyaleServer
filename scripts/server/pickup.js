'use strict';

function createPickup(spec){
    let that = {};
    
    let radius = 15;

    Object.defineProperty(that, 'id', {
        get: () => spec.id
    });

    Object.defineProperty(that, 'position', {
        get: () => spec.position
    });

    Object.defineProperty(that, 'radius', {
        get: () => radius
    });

    Object.defineProperty(that, 'type', {
        get: () => spec.type
    });

    return that;
}

module.exports.create = () => createPickUp();