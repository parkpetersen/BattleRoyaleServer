MyGame.components.ParticleSystem = (function(){
    'use strict';

    function ParticleSystem(spec){
        let that = {};
        let particles = [];
        let lifeTime = 500;
        let colors = ['#f47442', '#e02c26', '#d6b511', '#979b96'];
        for(let particle = 0; particle < 50; particle++){
            let angle = Math.random() * 2 * Math.PI;
            let randomColorIndex = Math.ceil(Math.floor(Math.random() * 100)/25);
            let p = {
                position: { 
                    x: spec.position.x,
                    y: spec.position.y
                },
                direction: {
                    x: Math.cos(angle),
                    y: Math.sin(angle)
                },
                speed: .00008,
                lifetime: 1500,
                alive: 0,
                size: 0.001225,
                fill: colors[randomColorIndex],
                stroke: 'rgb(0,0,0)'
            };
            particles.push(p);
        }

        that.render = function(context){
            console.log('render');
            for(let particle = 0; particle < particles.length; particle++){
                context.beginPath();
                context.strokeStyle = particles[particle].stroke;
                context.fillStyle = particles[particle].fill;
                context.arc(particles[particle].position.x * 4800, particles[particle].position.y* 4800, particles[particle].size * 4800, 0, 2*Math.PI);
                context.stroke();
                context.fill();
                context.closePath();
            }
        };

        that.update = function(elapsedTime){
            let keepMe = [];
            for(let particle = 0; particle < particles.length; particle++){
                particles[particle].alive += elapsedTime;
                particles[particle].position.x += (elapsedTime * particles[particle].speed * particles[particle].direction.x);
                particles[particle].position.y += (elapsedTime * particles[particle].speed * particles[particle].direction.y);

                if(particles[particle].alive <= particles[particle].lifetime) {
                    keepMe.push(particles[particle]);
                }
            }
            lifeTime -= elapsedTime;
            particles = keepMe;
            
        };

        that.isAlive = function(){
            if(lifeTime > 0){
                return true;
            }
            else{
                return false;
            }
        }

        return that;
    }

    return {
        ParticleSystem : ParticleSystem
    };
}());

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
                }
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