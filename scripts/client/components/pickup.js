MyGame.components.Pickup = function(){
    'use strict';

    let that = {};

    let radius = .0003125;  //was 15

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