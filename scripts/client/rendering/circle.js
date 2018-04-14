MyGame.renderer.Circle = (function(graphics){
    'use strict'
    let that = {};

    that.render = function(circle){
        graphics.drawShieldCircle(circle);
    }

    return that;

}(MyGame.graphics));