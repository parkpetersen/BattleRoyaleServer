MyGame.components.ParticleEngine = (function(particles) {

    function ParticleEngine() {
        let that = {};
        let particleSystems = [];

        that.createParticleSystem = function(position) {
            console.log('create');
            let angle = Math.random() * 2 * Math.PI
            let spec = {
                position: {
                    x: position.x,
                    y: position.y
                },
                fill: '#f47442'
            }
            let newSystem = particles.ParticleSystem(spec);
            particleSystems.push(newSystem);
        }

        that.update = function(elapsedTime) {
            console.log('update: ', particleSystems.length);
            for (let system = 0; system < particleSystems.length; system++) {
                particleSystems[system].update(elapsedTime);
                if (!particleSystems[system].isAlive()) {
                    particleSystems.splice(system, 1);
                }
            }
        }

        that.render = function(context) {
            for (let system = 0; system < particleSystems.length; system++) {
                particleSystems[system].render(context);
            }
        }

        return that;
    }

    return {
        ParticleEngine : ParticleEngine
    };
}(MyGame.components.ParticleSystem));