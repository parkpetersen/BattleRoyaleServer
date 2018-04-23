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
    // when login modal's "Login" button is clicked, hide all modals, buttons
    // and display main menu
    let loginNode = document.querySelectorAll('.login')[0].addEventListener('click', function() {
        hide(document.getElementById('login-modal'));
        hide(document.getElementById('signup-modal'));
        hide(document.getElementById('login-btn'));
        hide(document.getElementById('signup-btn'));
        show(document.getElementById('main'));
        MyGame.main.createUser(document.getElementById('loginUsernameText').value);
    });

    //
    // when sign-up modal's "Sign Up" button is clicked, hide all modals, buttons
    // and display main menu
    let signupNode = document.querySelectorAll('.signup')[0].addEventListener('click', function() {
        hide(document.getElementById('signup-modal'));
        hide(document.getElementById('login-modal'));
        hide(document.getElementById('signup-btn'));
        hide(document.getElementById('login-btn'));
        show(document.getElementById('main'));
        MyGame.main.createUser(document.getElementById('signupUsernameText').value);
    });

    //
    // when "Play" button is clicked, hide main menu, display game canvases,
    // and initialize game
    let playNode = document.querySelectorAll('.play')[0].addEventListener('click', function() {
        hide(document.getElementById('menu'));
        show(document.getElementById('game'));
        MyGame.main.initialize(); //probably shouldn't initialize every time the button is clicked... (fix later)
    });
}());