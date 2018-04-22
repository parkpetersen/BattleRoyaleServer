$(function () {
    $('form').submit(function(){
    MyGame.main.getSocket().emit('chat message', MyGame.main.getName() + ": " + $('#m').val());
    $('#m').val('');
    return false;
    });
    MyGame.main.getSocket().on('chat message', function(msg){
    $('#messages').append($('<li>').text(msg));
        var element = document.getElementById("chat-room");
        element.scrollTop = element.scrollHeight;
    });
});