MyGame.menu = (function() {
    'use strict';

    var mainMenu = document.getElementById('main');
    var gameCanvas = document.getElementById('canvas-main');
    mainMenu.style.backgroundImage = 'assets/sea_battle_by_lobzov.jpg';

    function hide(el) {
        el.style.display = 'none';
    }

    function show(el) {
        el.style.display = 'block';
    }

    function mainMenu() {
        show(mainMenu);
        hide(gameCanvas);
    }

    var playNode = document.querySelectorAll('.play')[0].addEventListener('click', function() {
        hide(mainMenu);
        show(gameCanvas);
        MyGame.main.initialize(); //probably shouldn't initialize every time the button is clicked... (fix later)
    });

}());