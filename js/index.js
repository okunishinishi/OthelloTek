
;(function($){
    var plugin = (function($){
        OT.Board.prototype.findDisk = function(square){
            if(! (square instanceof $)) square = $(square);
            var row = square.data('row'),
                column = square.data('column');
            return this.disks[row][column];
        }
        return {
            square:function(command, options){
                if(typeof command != 'string'){
                    options = command;
                    command = 'init';
                }
                var square = $(this);
                switch (command){
                    case 'init':
                        var row = options.row, column = options.column;
                        square.addClass('square')
                            .attr('data-row', row)
                            .attr('data-column', column)
                            .data('row', row)
                            .data('column', column);
                        var inner = $('<div/>').addClass('square-inner').appendTo(square);
                        $('<div/>').addClass('circle').appendTo(inner);

                        return square;
                    case 'draw':
                        var disk = options.disk;
                        var color = OT.COLOR.toString(disk.color), available = false;
                        if(color === 'none'){
                            var player = options.player;
                            if(disk.trappable[player].length > 0){
                                color = player;
                                available = true;
                            }
                        }
                        square.attr('data-color', color)
                            .attr('data-available', available)
                            .removeClass('ready');
                        return square;
                    case 'turn':
                        setTimeout(function(){
                            square.attr('data-color', OT.COLOR.toString(options.color))
                                .attr('data-available', false)
                                .removeClass('ready');
                        }, options.delay);
                        return square;
                }
                return square;
            },
            situationPanel:function(command, options){
                if(typeof command != 'string'){
                    options = command;
                    command = 'init';
                }
                var panel = $(this);
                switch(command){
                    case 'init':
                        panel.addClass('situation-panel');
                        $('<legend/>').appendTo(panel).text('');
                        $.each(['dark', 'light'], function(i, color){
                            var item = $('<div/>').addClass('situation-panel-item')
                                .appendTo(panel).addClass(color);
                            var label = (options.player === color?'you':'CPU') + ':';
                            $('<span/>').addClass('label').text(label).appendTo(item);;
                            $('<span/>').addClass('circle')
                                .addClass(color).appendTo(item);
                            $('<span/>').text('×').appendTo(item).addClass('x-mark');
                            $('<span/>').addClass('score')
                                .appendTo(item);
                        });
                        if(options.score) panel.situationPanel('score', {score:options.score});
                        return panel;
                    case 'score':
                        if(!options.score) return panel;
                        $.each(['dark', 'light'], function(i, color){
                            var score = options.score[color];
                            $('.situation-panel-item.' + color, panel).find('.score')
                                .text(score);
                        });
                        return panel;
                }

                return panel;
            },
            cartridge:function(command, options){
                if(typeof command != 'string'){
                    options = command;
                    command = 'init';
                }
                var cartridge = $(this);
                switch(command){
                    case 'init':
                        cartridge.addClass('cartridge');
                        $('<ul/>').appendTo(cartridge);
                        return cartridge.cartridge('reload');
                    case 'reload':
                        var ul = $('ul', cartridge).empty();
                        for(var i=0; i<30; i++){
                            var li = $('<li/>').addClass('circle')
                                .appendTo(ul);
                            $('<span/>').addClass('left').appendTo(li);
                            $('<span/>').addClass('right').appendTo(li);
                        }
                        return cartridge;
                    case 'shift':
                        $('li:last', cartridge).remove();
                        return cartridge;
                }

                return cartridge;
            },
            display:function(command, options){
                if(typeof command != 'string'){
                    options = command;
                    command = 'init';
                }
                var display = $(this);
                switch (command){
                    case 'init':
                        display.addClass('display').addClass('wait');
                        for(var row=0; row< options.rows; row++){
                            for(var column = 0; column < options.columns; column++){
                                $('<div/>').appendTo(display)
                                    .square({
                                        row:row,
                                        column:column
                                    });
                            }
                        }
                        $('<br/>').addClass('clear').appendTo(display);
                        var cursor = $('<div/>').addClass('circle')
                            .addClass('cursor')
                            .appendTo(display);
                        $('.square', display)
                            .hover(function(){
                                var square = $(this);
                                if(square.is('[data-available=true]')){
                                    cursor.addClass('active');
                                    options.ready.apply(this, arguments);
                                } else {
                                    cursor.removeClass('active');
                                    options.unready.apply(this, arguments);
                                }
                            }, function(){
                                options.unready.apply(this, arguments);
                                cursor.removeClass('active')
                                    .removeClass('down');
                            })
                            .mousedown(function(){
                                cursor.addClass('down');
                            })
                            .click(function(){
                                var square = $(this);
                                if(square.is('[data-available=true]')){
                                    options.put.apply(this, arguments);
                                }
                            });
                        display
                            .hover(function(){
                                cursor.show();
                            }, function(){
                                cursor.hide();
                            })
                            .mousemove(function(e){
                                cursor.css({
                                    left:e.pageX - cursor.width() / 2,
                                    top:e.pageY - cursor.height() / 2
                                });
                            });
                        return display;
                    case 'over':

                        $('.over-cover,.winner,.cursor').remove();
                        var overCover = $('<div/>').insertAfter(display)
                            .addClass('over-cover')
                            .hide()
                            .fadeIn(800, function(){
                                display.addClass('over');
                                var score = options.score;
                                var winner = $('<span/>').addClass('winner')
                                    .appendTo(display).hide()

                                if(score.light === score.dark){
                                    winner.text('DRAW').addClass('blue');
                                } else  if(score.light < score.dark){
                                    winner.text('YOU LOSE').addClass('red');
                                } else {
                                    winner.text('YOU WIN').addClass('yellow');
                                }
                                setTimeout(function(){
                                    winner.hide().fadeIn();
                                    $('#your-turn-message').hide();
                                    $('#thinking-message').hide();
                                    setTimeout(function(){
                                        overCover.click(function(){
                                            $('#retry-btn').trigger('click');
                                            location.reload();
                                        });
                                    }, 200);
                                }, 300);
                            });
                        return display;
                    case 'refresh':
                        var board = options.board;
                        var player = OT.COLOR.toString(board.color);
                        display.attr('data-player',  player);


                        $('.square', display).each(function(){
                            var square = $(this);
                            square.square('draw', {
                                player:player,
                                disk:options.board.findDisk(square)
                            });
                        });



                        return display;
                }
                return display;
            },
            playBox:function(){
                var box = $(this).addClass('play-box');

                var message = {
                    yourTurn:$('#your-turn-message').hide(),
                    thinking:$('#thinking-message').hide()
                };

                function findSquare(disk){
                    if(!disk) return null;
                    var r = '[data-row=' + disk.row + ']',
                        c = '[data-column=' + disk.column + ']';
                    return $('.square' + r + c, display);
                }
                var display = $('<div/>').appendTo(box).display({
                    rows:8, columns:8,
                    ready:function(){
                        var disk = board.findDisk(this);
                        var trappable = disk.trappableForColor(board.color);
                        for(var i=0; i<trappable.length; i++){
                            findSquare(trappable[i]).addClass('ready');
                        }
                    },
                    unready:function(){
                        $('.square.ready', display).removeClass('ready');
                    },
                    put:function(){

                        var player = display.attr('data-player');

                        var disk = board.findDisk(this);
                        disk.put(board.color);
                        findSquare(disk).square('draw', {disk:disk});

                        var maxDelay = 0;
                        var trappableArray = disk.trappableForColor(board.color);
                        for(var i=0; i<trappableArray.length; i++){
                            var trappable = trappableArray[i];
                            trappable.revert();
                            var delay = disk.getDistance(trappable) * 100;
                            if(delay > maxDelay) maxDelay = delay;
                            findSquare(trappable).square('turn', {
                                color:trappable.color,
                                delay:delay
                            });
                        }
                        board.turn();
                        board.refresh();

                        if(board.getAvailableDisks().length == 0){
                            board.turn();
                            board.refresh();
                            if(board.getAvailableDisks().length == 0){
                                board.turn();
                                board.refresh();
                                setTimeout(function(){
                                    display.display('over', {score:board.getScore()});
                                }, 2000);
                            }
                        }

                        var isAi = board.color === ai.color;
                        box.attr('data-player', isAi?'ai':'user');
                        if(isAi){
                            display.siblings('.cartridge.user').cartridge('shift');

                            message.yourTurn.fadeOut(100);
                            message.thinking.fadeIn();
                        } else {
                            message.yourTurn.fadeIn();
                            message.thinking.fadeOut(100);
                        }

                        setTimeout(function(){
                            display.display('refresh', {
                                board:board
                            });

                            if(isAi){
                                display.removeClass('user');
                                setTimeout(function(){
                                    var nextMove = ai.nextMove(board);
                                    var square = findSquare(nextMove);
                                    if(!square || square.size() == 0){
                                        display.display('over', {score:board.getScore()});
                                    }
                                    square.attr('data-color', OT.COLOR.toString(ai.color))
                                    square.attr('data-available', 'false');


                                    var cartridge = display.siblings('.cartridge.ai');
                                    cartridge.cartridge('shift');
                                    if($('li', cartridge).size() === 0) {
                                        setTimeout(function(){
                                            display.display('over', {score:board.getScore()});
                                        }, 2000);
                                        return;
                                    }
                                    var from = cartridge.find('li:last').offset(),
                                        to = square.offset();
                                    var left = from.left - to.left;
                                    var top = from.top - to.top;
                                    var duration = (Math.abs(left) + Math.abs(top)) / display.height() * 300;
                                    $('.square-inner',square)
                                        .css({
                                            left:left,
                                            top:top
                                        }).animate({
                                            left:0, top:0
                                        }, duration, 'linear', function(){
                                            square.attr('data-available', 'true');
                                            square.trigger('click');
                                        });

                                }, 800);
                            } else {
                                display.addClass('user');
                            }

                        }, maxDelay);

                        var cursor = $('.cursor', display).hide();
                        display.one('mousemove', function(){
                            cursor.show();
                        });


                        situationPanel.situationPanel('score', {score:board.getScore()});
                    }
                });
                $('<div/>').cartridge().insertBefore(display).addClass('up').addClass('dark').addClass('ai');
                $('<div/>').cartridge().insertAfter(display).addClass('down').addClass('light').addClass('user');


                var waitCover = $('<div/>').addClass('wait-cover').appendTo(box).html('click<br/>to<br/>start!');
                var startBtn = $('#start-btn').click(function(){
                    display.removeClass('wait');
                    waitCover.remove();
                    message.yourTurn.show();
                    startBtn.hide();
                }).hide();
                waitCover.click(function(){
                    startBtn.trigger('click');
                });

                var board = new OT.Board(8, 8);
                var situationPanel = $('<fieldset/>').situationPanel({
                    score:board.getScore(),
                    player:'light'
                }).appendTo(box);

                var ai = new OT.Ai(OT.COLOR.DARK);

                display.display('refresh', {
                    board:board
                });

                box.attr('data-player', 'user');
                display.addClass('user');

                return box;
            },
            timer:function(command, options){
                if(typeof command != 'string'){
                    options = command;
                    command = 'init';
                }
                var timer = $(this);
                switch(command){
                    case 'init':
                        $('<span/>').addClass('timer-inner')
                            .appendTo(timer);
                        timer.data('time', 0);
                        return timer;
                    case 'start':
                        var interval = setInterval(function(){
                            if(timer.is('.pausing')) return;
                            var time = timer.data('time');
                            time++;
                            timer.data('time', time).timer('draw');
                        }, 1000);
                        timer.data('interval', interval);
                        return timer;
                    case 'pause':
                        timer.addClass('pausing');
                        return timer;
                    case 'resume':
                        timer.removeClass('pausing');
                        return timer;
                    case 'reset':
                        clearInterval(timer.data('interval'));
                        timer.data('time', 0).timer('draw');
                        return timer;
                    case 'restart':
                        return timer.timer('reset').timer('start');
                    case 'draw':
                        var time = timer.data('time');
                        function fillZero(num, digit){
                            num = "" + num;
                            while(num.length < digit){
                                num = "0" + num;
                            }
                            return num;
                        }
                        var min = fillZero(Math.floor(time / 60), 2),
                            sec = fillZero(Math.floor(time % 60), 2);
                        $('.timer-inner', timer).text(min + ':' + sec);
                        return timer;
                }

                return timer;
            }

        }
    })($.sub());

    $.fn.extend(plugin);

})(jQuery);


$(function(){
    var playBox = $('#play-box').playBox();
//    var timer = $('#timer').timer();
//    timer.timer('start');

    switch(navigator.appName){
        case 'Microsoft Internet Explorer':
        case 'Opera':
            $("#play-box[data-player=user] .display .circle.cursor").css('visibility', 'hidden');
            $("#play-box[data-player=user] .display").css('cursor', 'default');
            break;
    }
});