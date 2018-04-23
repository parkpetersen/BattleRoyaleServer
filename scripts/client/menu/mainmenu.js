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
        el.style.display = 'inline-block';
    }

    //
    // when "Play" button is clicked, hide main menu, display game canvases, and initialize game
    let registerNode = document.querySelectorAll('.register')[0].addEventListener('click', function() {
        hide(document.getElementById('register'));
        show(document.getElementById('game'));
        MyGame.main.createUser(document.getElementById('name-input').value);
    });

    let playNode = document.querySelectorAll('.play')[0].addEventListener('click', function() {
        hide(document.getElementById('main'));
        show(document.getElementById('register'));
        MyGame.main.initialize(); //probably shouldn't initialize every time the button is clicked... (fix later)
    });

    //
    // when "Leaderboard" button is clicked, hide main menu, display credits screen
    let leaderboardNode = document.querySelectorAll('.leaderboard')[0].addEventListener('click', function() {
        hide(document.getElementById('main'));
        show(document.getElementById('leaderboard'));
        show(document.getElementById('back'));
    });

    //
    // when "Credits" button is clicked, hide main menu, display credits screen
    let creditNode = document.querySelectorAll('.credits')[0].addEventListener('click', function() {
        hide(document.getElementById('main'));
        show(document.getElementById('credits'));
        show(document.getElementById('back'));
    });

    //
    // when "Back" button is clicked, hide current all submenus and display main menu
    let back = document.querySelectorAll('.back')[0].addEventListener('click', function() {
        show(document.getElementById('main'));
        hide(document.getElementById('leaderboard'));
        hide(document.getElementById('credits'));
        hide(document.getElementById('back'));
    });

}());