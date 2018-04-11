// ------------------------------------------------------------------
//
// Rendering function for a Player object.
//
// ------------------------------------------------------------------
MyGame.renderer.Player = (function(graphics) {
    'use strict';
    let that = {};

    // ------------------------------------------------------------------
    //
    // Renders a Player model.
    //
    // ------------------------------------------------------------------
    that.render = function(model, texture, xViewport, yViewport) {
        graphics.saveContext();
        //graphics.rotateCanvas(model.position, model.direction);
        graphics.drawVision(model.vision, xViewport, yViewport);
        graphics.drawAimer(model.position, model.direction, xViewport, yViewport);
        graphics.drawImage(texture, model.position, model.size, xViewport, yViewport);
        graphics.drawHealthBar(model.position, model.size, model.health, xViewport, yViewport);
        graphics.restoreContext();
    };

    return that;

}(MyGame.graphics));
