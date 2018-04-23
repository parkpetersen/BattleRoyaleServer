let random = require('./random');

function createCircle() {
    let that = {};
    let position = {
        x: random.nextDouble(),
        y: random.nextDouble()
    };
    let radius = .75;
    let shrinkingSpeed = .000005;
    let countdown = 15;

    Object.defineProperty(that, 'position', {
        get: () => position
    });

    Object.defineProperty(that, 'radius', {
        get: () => radius,
        set: (value) => { radius = value }
    });

    Object.defineProperty(that, 'shrinkingSpeed', {
        get: () => shrinkingSpeed
    });

    that.update = function (elapsedTime) {
        if (countdown > 0) {
            countdown -= elapsedTime / 1000;
        }
        else {
            if (radius > 0) {
                radius -= shrinkingSpeed * elapsedTime;
            }
        }
    }

    that.within = function (player) {
        if (countdown > 0) {
            return true;
        }
        else {
            let distance = Math.sqrt(Math.pow(player.position.x - position.x, 2) +
                Math.pow(player.position.y - position.y, 2));
            return distance < radius;
        }
    }

    return that;
}

module.exports.create = () => createCircle();