//----------------------------------------------------------------
//
// Provide a landing page for the user with options to
// join a game lobby (or wait as a spectator for a game in
// progress to complete), create/edit a profile, change options
// (like controls, music, sounds, volumes (maybe?)),
// view the leaderboard, and view credits about the authors
//
//----------------------------------------------------------------
MyGame.menu = (function() {
    'use strict';

    //
    // hide given element
    function hide(el) {
        el.style.display = 'none';
    }

    //
    // displays given element
    function show(el) {
        el.style.display = 'block';
    }

    //
    // when "Play" button is clicked, hide main menu, display game canvases, and initialize game
    let playNode = document.querySelectorAll('.play')[0].addEventListener('click', function() {
        hide(document.getElementById('menu'));
        show(document.getElementById('game'));
        MyGame.main.initialize(); //probably shouldn't initialize every time the button is clicked... (fix later)
    });

    let creditNode = document.querySelectorAll('.credits')[0].addEventListener('click', function() {
        hide(document.getElementById('main'));
        show(document.getElementById('credits'));
        show(document.getElementById('back'));
    });

    //TODO: back button hides overlayed screen, and back button
    let back = document.querySelectorAll('.back')[0].addEventListener('click', function() {
        show(document.getElementById('main'));
        hide(document.getElementById('credits'));
        hide(document.getElementById('back'));
    });

}());