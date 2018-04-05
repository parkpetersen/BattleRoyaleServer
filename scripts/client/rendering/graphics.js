// ------------------------------------------------------------------
//
// This is the graphics rendering code for the game.
//
// ------------------------------------------------------------------
MyGame.graphics = (function() {
    'use strict';

    let canvas = document.getElementById('canvas-main');
    let context = canvas.getContext('2d')

    //------------------------------------------------------------------
    //
    // Place a 'clear' function on the Canvas prototype, this makes it a part
    // of the canvas, rather than making a function that calls and does it.
    //
    //------------------------------------------------------------------
    CanvasRenderingContext2D.prototype.clear = function() {
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

    //------------------------------------------------------------------
    //
    // Draw an image into the local canvas coordinate system.
    //
    //------------------------------------------------------------------
    function drawImage(texture, center, size) {
        let localCenter = {
            x: center.x * canvas.width,
            y: center.y * canvas.width
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
            x: center.x * canvas.width,
            y: center.y * canvas.width
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
        context.arc(center.x * canvas.width, center.y * canvas.width, 2 * radius * canvas.width, 2 * Math.PI, false);
        context.closePath();
        context.fillStyle = color;
        context.fill();
    }

    function drawAimer(startPos, direction){
        context.save();
        context.beginPath();
        let xVector = Math.cos(direction);
        let yVector = Math.sin(direction);
        context.moveTo(startPos.x * canvas.width, startPos.y * canvas.width);
        context.lineTo((startPos.x * canvas.width) + (xVector * 200), (startPos.y * canvas.width) + (yVector * 200));
        context.strokeStyle = 'black';
        context.fillStyle = 'black';
        context.setLineDash([10, 15]);
        context.stroke();
        context.fill();
        context.closePath();
        context.restore();

    }

    function drawVision(vision){
        context.save();
        context.beginPath();
        context.arc(vision.x*canvas.width, vision.y*canvas.width, vision.radius*canvas.width, vision.start, vision.end);
        context.strokeStyle = "#FFFFFF";
        context.fillStyle = "#808080";
        context.stroke();
        context.fill();
        context.closePath();
        context.restore();
    }

    //------------------------------------------------------------------
    //
    // Function for enabling clipping vision for the player
    //
    //------------------------------------------------------------------

    function enableClipping(player, clip){
        if(!clip.clipping){
            context.save();
            clip.clipping = true;

            context.beginPath();
            context.arc(player.vision.x*canvas.width, player.vision.y*canvas.width, player.vision.radius*canvas.width, player.vision.start, player.vision.end);
            context.closePath();
            context.clip();
        }
    }

    //------------------------------------------------------------------
    //
    // Function for enabling clipping vision for the player
    //
    //------------------------------------------------------------------

    function disableClipping(clip){
        if(clip.clipping){
            context.restore();
            clip.clipping = false;
        }
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
        enableClipping : enableClipping,
        disableClipping : disableClipping
    };
}());
