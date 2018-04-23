MyGame.renderer.Island = (function (graphics) {
    'use strict'
    let that = {};

    that.render = function (islands) {
        for (let island in islands) {
            graphics.drawIsland(islands[island])
        }
    }

    return that;

}(MyGame.graphics));