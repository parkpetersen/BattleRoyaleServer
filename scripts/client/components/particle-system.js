MyGame.components.ParticleSystem = (function(){
    'use strict';

    function ParticleSystem(spec){
        let that = {};
        let particles = [];
        let lifeTime = 500;
        for(let particle = 0; particle < 50; particle++){
            let angle = Math.random() * 2 * Math.PI;
            let p = {
                position: { 
                    x: spec.position.x,
                    y: spec.position.y
                },
                direction: {
                    x: Math.cos(angle),
                    y: Math.sin(angle)
                },
                speed: .000008,
                lifetime: 1500,
                alive: 0,
                size: 0.001225,
                fill: spec.fill,
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