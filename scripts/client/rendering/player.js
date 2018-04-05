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
    that.render = function(model, texture) {
        graphics.saveContext();
        //graphics.rotateCanvas(model.position, model.direction);
        graphics.drawAimer(model.position, model.direction);
        graphics.drawImage(texture, model.position, model.size);
        graphics.drawHealthBar(model.position, model.size, model.health);
        graphics.restoreContext();
    };

    return that;

}(MyGame.graphics));
