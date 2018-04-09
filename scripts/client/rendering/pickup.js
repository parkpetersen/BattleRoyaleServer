MyGame.renderer.Pickup = (function(graphics) {
    'use strict';
    let that = {};

    // ------------------------------------------------------------------
    //
    // Renders a Player model.
    //
    // ------------------------------------------------------------------
    that.render = function(model) {
        graphics.saveContext();

        graphics.drawCircle(model.position, model.radius, '#FF0000');
        graphics.restoreContext();
    };

    return that;

}(MyGame.graphics)); 