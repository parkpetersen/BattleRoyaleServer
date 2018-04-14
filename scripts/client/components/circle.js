MyGame.components.Circle = function(){
    let that = {};
    let position = {
        x: -1,
        y: -1
    }
    let radius = .75;
    let shrinkingSpeed = .000025;

    Object.defineProperty(that, 'position', {
        get: () => position,
        set: (value) => {position = value}
    });

    Object.defineProperty(that, 'radius', {
        get: () => radius,
        set: (value) => {radius = value}
    });

    Object.defineProperty(that, 'shrinkingSpeed', {
        get: () => shrinkingSpeed,
        set: (value) => {shrinkingSpeed = value}
    });

    that.update = function(elapsedTime){
        radius -= shrinkingSpeed * elapsedTime;
    }

    that.within = function(player){
        let distance = Math.sqrt(Math.pow(player.position.x - position.x, 2) +
        Math.pow(player.position.y - position.y, 2));
        return distance < radius;
    }

    return that;
}