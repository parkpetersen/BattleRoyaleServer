// ------------------------------------------------------------------
//
// This is the graphics rendering code for the game.
//
// ------------------------------------------------------------------
MyGame.graphics = (function () {
    'use strict';

    let canvas = document.getElementById('canvas-main');
    let context = canvas.getContext('2d')
    let image = new Image();
    image.src = '../../../assets/background/cropped.jpg';

    //------------------------------------------------------------------
    //
    // Place a 'clear' function on the Canvas prototype, this makes it a part
    // of the canvas, rather than making a function that calls and does it.
    //
    //------------------------------------------------------------------
    CanvasRenderingContext2D.prototype.clear = function () {
        this.save();
        this.setTransform(1, 0, 0, 1, 0, 0);
        this.clearRect(0, 0, canvas.width, canvas.height);
        this.restore();
    };

    //------------------------------------------------------------------
    //
    // Public function that allows the client code to clear the canvas.
    //
    //------------------------------------------------------------------
    function clear() {
        context.clear();
    }

    //------------------------------------------------------------------
    //
    // Simple pass-through to save the canvas context.
    //
    //------------------------------------------------------------------
    function saveContext() {
        context.save();
    }

    //------------------------------------------------------------------
    //
    // Simple pass-through the restore the canvas context.
    //
    //------------------------------------------------------------------
    function restoreContext() {
        context.restore();
    }

    //------------------------------------------------------------------
    //
    // Rotate the canvas to prepare it for rendering of a rotated object.
    //
    //------------------------------------------------------------------
    function rotateCanvas(center, rotation) {
        context.translate(center.x * canvas.width, center.y * canvas.width);
        context.rotate(rotation);
        context.translate(-center.x * canvas.width, -center.y * canvas.width);
    }

    function drawText(message) {
        context.fillStyle = 'red';
        context.font = '24px serif';
        context.fillText(message.message, message.position.x * 4800, message.position.y * 4800);
    }

    //------------------------------------------------------------------
    //
    // Draw an image into the local canvas coordinate system.
    //
    //------------------------------------------------------------------
    function drawImage(texture, center, size) {
        let localCenter = {
            x: center.x * 4800,
            y: center.y * 4800
        };
        let localSize = {
            width: size.width * canvas.width,
            height: size.height * canvas.height
        };

        context.drawImage(texture,
            localCenter.x - localSize.width / 2,
            localCenter.y - localSize.height / 2,
            localSize.width,
            localSize.height);
    }

    //------------------------------------------------------------------
    //
    // Draw an image out of a spritesheet into the local canvas coordinate system.
    //
    //------------------------------------------------------------------
    function drawImageSpriteSheet(spriteSheet, spriteSize, sprite, center, size) {
        let localCenter = {
            x: center.x * 4800,
            y: center.y * 4800
        };
        let localSize = {
            width: size.width * canvas.width,
            height: size.height * canvas.height
        };

        context.drawImage(spriteSheet,
            sprite * spriteSize.width, 0,                 // which sprite to render
            spriteSize.width, spriteSize.height,    // size in the spritesheet
            localCenter.x - localSize.width / 2,
            localCenter.y - localSize.height / 2,
            localSize.width, localSize.height);
    }

    //------------------------------------------------------------------
    //
    // Draw a circle into the local canvas coordinate system.
    //
    //------------------------------------------------------------------
    function drawCircle(center, radius, color) {
        context.beginPath();
        context.arc(center.x * 4800, center.y * 4800, 2 * .0025 * canvas.width, 2 * Math.PI, false);
        context.closePath();
        context.fillStyle = color;
        context.fill();
    }

    function drawAimer(startPos, direction) {
        context.save();
        context.beginPath();
        let xVector = Math.cos(direction);
        let yVector = Math.sin(direction);
        context.moveTo(startPos.x * 4800, startPos.y * 4800);
        context.lineTo((startPos.x * 4800) + (xVector * 200), (startPos.y * 4800) + (yVector * 200));
        context.strokeStyle = 'black';
        context.fillStyle = 'black';
        context.setLineDash([10, 15]);
        context.stroke();
        context.fill();
        context.closePath();
        context.beginPath();
        context.moveTo(startPos.x * 4800, startPos.y * 4800);
        xVector = Math.cos(direction + (Math.PI/2));
        yVector = Math.sin(direction + (Math.PI/2));
        context.lineTo((startPos.x * 4800) + (xVector * 200), (startPos.y * 4800) + (yVector * 200));
        context.strokeStyle = 'red';
        context.fillStyle = 'red';
        context.setLineDash([10, 15]);
        context.stroke();
        context.fill();
        context.closePath();
        context.beginPath();
        context.moveTo(startPos.x * 4800, startPos.y * 4800);
        xVector = Math.cos(direction - (Math.PI/2));
        yVector = Math.sin(direction - (Math.PI/2));
        context.lineTo((startPos.x * 4800) + (xVector * 200), (startPos.y * 4800) + (yVector * 200));
        context.strokeStyle = 'red';
        context.fillStyle = 'red';
        context.setLineDash([10, 15]);
        context.stroke();
        context.fill();
        context.closePath();
        context.restore();

    }

    function drawVision(vision) {
        context.save();
        context.beginPath();
        context.arc(vision.x * 4800, vision.y * 4800, vision.radius * canvas.width, vision.start-(Math.PI/4), vision.end + (Math.PI/4));
        context.strokeStyle = "rgba(50,250,250, 0.1"; //This allows for a bit opacity so we can see what's under the FOV
        context.fillStyle = "rgba(50,250,250, 0.1";
        context.fill();
        context.stroke();
    }

    function drawWorldBoundary(width, height) {
        context.beginPath();
        context.rect(0, 0, width, height);
        context.strokeStyle = 'red';
        context.stroke();
        context.closePath();
    }

    function drawHealthBar(position, size, health) {
        let localPosition = {
            x: position.x * 4800,
            y: position.y * 4800
        };
        let localSize = {
            width: size.width * canvas.width,
            height: size.height * canvas.height
        };

        context.save();
        context.beginPath();
        let healthFraction = health / 100;
        let missingFraction = 1 - healthFraction;
        context.fill();
        context.rect(localPosition.x - (localSize.width / 2), localPosition.y + (localSize.height / 2), localSize.width * healthFraction, localSize.height / 8);
        context.fillStyle = 'green';
        context.fill();
        context.closePath();
        context.restore();
    }

    //------------------------------------------------------------------
    //
    // Function for enabling clipping vision for the player
    //
    //------------------------------------------------------------------

    function enableClipping(player, clip) {
        if (!clip.clipping) {
            context.save();
            clip.clipping = true;

            context.beginPath();
            context.arc(player.vision.x * 4800, player.vision.y * 4800, player.vision.radius * canvas.width,
                 player.vision.start - (Math.PI/4), player.vision.end + (Math.PI/4));
            context.closePath();
            context.clip();
        }
    }

    //------------------------------------------------------------------
    //
    // Function for enabling clipping vision for the player
    //
    //------------------------------------------------------------------

    function disableClipping(clip) {
        if (clip.clipping) {
            context.restore();
            clip.clipping = false;
        }
    }

    // reference: https://stackoverflow.com/questions/16919601/html5-canvas-camera-viewport-how-to-actally-do-it
    function setCamera(player, minX, maxX, minY, maxY) {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clear();
        let camX = clamp((-player.position.x * 4800) + (canvas.width / 2), minX, maxX - (canvas.width));
        let camY = clamp((-player.position.y * 4800) + (canvas.height / 2), minY, maxY - (canvas.height));
        context.translate(camX, camY);

    }

    function clamp(value, min, max) {
        if (-value < min) return min;
        else if (-value > max) return -max;
        return value;
    }

    function drawBackground() {
        context.drawImage(MyGame.assets['background'], 0, 0, 4800, 4800); //should be 0,0,4800,4800?
    }

    function drawMiniMap(player, circle, islands) {
        let smallCanvas = document.getElementById('mini-map');
        let ctx = smallCanvas.getContext('2d')
        ctx.clear();
        ctx.save();
        for (let island of islands) {
            ctx.drawImage(MyGame.assets[island.name], island.position.x * 200, island.position.y * 200, island.size.width * 200, island.size.height * 200);
        }
        ctx.beginPath();
        ctx.fillStyle = "#FFFF00";
        ctx.fillRect(player.position.x * 200, player.position.y * 200, 5, 5);
        let circleRadius = (circle.radius > 0) ? circle.radius : 0;
        ctx.arc(circle.position.x * 200, circle.position.y * 200, circleRadius * 200, 0, 2 * Math.PI);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = .5;
        ctx.stroke();
        ctx.closePath();
        ctx.restore();

        //let smallImage = new Image();
        //smallImage.src = '../../../assets/background/mini_map.jpg';

    }

    function drawShieldCircle(circle) {
        context.save();
        context.beginPath();
        let circleRadius = (circle.radius > 0) ? circle.radius : 0;
        context.arc(circle.position.x * 4800, circle.position.y * 4800, circleRadius * 4800, 0, 2 * Math.PI);
        context.strokeStyle = 'red';
        context.lineWidth = 10;
        context.stroke();
        context.closePath();
        context.restore();
    }

    function renderParticleSystems(particleEngine) {
        particleEngine.render(context);
    }

    function drawIsland(island) {
        context.save();
        context.beginPath();
        context.drawImage(MyGame.assets[island.name], island.position.x * 4800, island.position.y * 4800, island.size.width * 4800, island.size.height * 4800);
        // context.fillStyle = '#996a15';
        // context.fillRect(island.position.x * 4800, island.position.y * 4800, island.size.width * 4800, island.size.height * 4800);
        // context.closePath();
        // context.beginPath();
        // context.fillStyle = '#2b6806';
        // context.fillRect((island.position.x + (island.size.width*.1)) * 4800, (island.position.y + (island.size.height*.1)) * 4800, (island.size.width * .8) * 4800, (island.size.height * .8) * 4800);
        context.closePath();
        context.restore();

    }


    return {
        clear: clear,
        saveContext: saveContext,
        restoreContext: restoreContext,
        rotateCanvas: rotateCanvas,
        drawImage: drawImage,
        drawImageSpriteSheet: drawImageSpriteSheet,
        drawAimer: drawAimer,
        drawCircle: drawCircle,
        drawVision: drawVision,
        enableClipping: enableClipping,
        disableClipping: disableClipping,
        drawHealthBar: drawHealthBar,
        drawCircle: drawCircle,
        drawText: drawText,
        setCamera: setCamera,
        drawWorldBoundary: drawWorldBoundary,
        drawBackground: drawBackground,
        drawMiniMap: drawMiniMap,
        drawShieldCircle: drawShieldCircle,
        renderParticleSystems: renderParticleSystems,
        drawIsland: drawIsland
    };
}());
