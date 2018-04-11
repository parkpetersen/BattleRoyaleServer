// ------------------------------------------------------------------
//
// Rendering function for a PlayerRemote object.
//
// ------------------------------------------------------------------
MyGame.renderer.PlayerRemote = (function(graphics) {
    'use strict';
    let that = {};

    // ------------------------------------------------------------------
    //
    // Renders a PlayerRemote model.
    //
    // ------------------------------------------------------------------
    that.render = function(model, texture, xViewport, yViewport) {
        graphics.saveContext();
        //graphics.rotateCanvas(model.state.position, model.state.direction);
        graphics.drawImageOtherPlayer(texture, model.state.position, model.size, xViewport*5000, yViewport*5000);
        graphics.restoreContext();
    };

    return that;

}(MyGame.graphics));
