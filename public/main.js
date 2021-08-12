$(function () {
    const FADE_TIME = 150;
    const TYPING_TIMER_LENGTH = 400;
    const COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

    const $window = $(window);
    const $usernameInput = $('.usernameInput');
    const $messages = $('.messages');
    const $inputMessage = $('.inputMessage');

    const $loginPage = $('.login.page');
    const $chatPage = $('.chat.page');

    const socket = io();

    let username;
    let connected = false;
    let typing = false;
    let lastTypingTime;
    let $currentInput = $usernameInput.focus();

    const addParticipantsMessage = (data) => {
        let message = '';
        if (data.numUsers === 1) {
            message += `there's 1 participant`;
        } else {
            message += `there are ${data.numUsers} participants`;
        }
        log(message);
    }

    const setUsername = () => {
        console.log('setUsername');
        username = cleanInput($usernameInput.val().trim());
        console.log('username=%s', username);
        console.log('loginPage=', $loginPage);
        console.log('chatPage=', $chatPage);
        if (username) {
            console.log('username');
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');
            $currentInput = $inputMessage.focus();

            socket.emit('add user', username);
        }
    }

    const sendMessage = () => {
        let messgae = $inputMessage.val();
        message = cleanInput(messgae);
        if (messgae && connected) {
            $inputMessage.val('');
            addChatMessage({ username, message });
            socket.emit('new message', message);
        }
    }

    const log = (message, options) => {
        const $el = $('<li>').addClass('log').text(message);
        addMessageElement($el, options);
    }

    const addChatMessage = (data, options = {}) => {
        const $typingMessages = getTypingMessages(data);
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        const $usernameDiv = $('<span class="username"/>')
            .text(data.username)
            .css('color', getUsernameColor(data.username));

        const $messageBodyDiv = $('<span class="messageBody">')
            .text(data.message);

        const typingClass = data.typing ? 'typing' : '';
        const $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);

    }

    const addChatTyping = (data) => {
        data.typing = true;
        data.message = 'is typing';
        addChatMessage(data);
    }

    const removeChatTyping = (data) => {
        getTypingMessages(data).fadeOut(function () {
            $(this).remove();
        });
    }

    const addMessageElement = (el, options) => {
        const $el = $(el);
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }

        $messages[0].scrollTop = $messages[0].scrollHeight;
    }

    const cleanInput = (input) => {
        return $('<div/>').text(input).html();
    }

    const updateTyping = () => {
        if (connected) {
            if (!typing) {
                typing = true;
                socket.emit('typing');
            }
            lastTypingTime = (new Date()).getTime();

            setTimeout(() => {
                const typingTimer = (new Date()).getTime();
                const timeDiff = typingTimer - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                    socket.emit('stop typing');
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        }
    }

    const getTypingMessages = (data) => {
        return $('.typing.message').filter(function (i) {
            return $(this).data('username') === data.username;
        });
    }

    const getUsernameColor = (username) => {
        let hash = 7;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        const index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }

    $window.keydown(event => {
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $currentInput.focus();
        }

        // ENTER
        if (event.which === 13) {
            if (username) {
                sendMessage();
                socket.emit('stop typing');
                typing = false;
            } else {
                setUsername();
            }
        }
    });

    $inputMessage.on('input', () => {
        updateTyping();
    });

    $loginPage.click(() => {
        $currentInput.focus();
    });

    socket.on('login', (data) => {
        connected = true;
        const message = 'Welcome to Socket.IO Chat - ';
        log(message, {
            prepend: true
        });
        addParticipantsMessage(data);
    });

    socket.on('new message', (data) => {
        console.log('on new message:', data);
        addChatMessage(data);
    });

    socket.on('user joined', (data) => {
        console.log('on user joined:', data);
        log(`${data.username} joined`);
        addParticipantsMessage(data);
    });

    socket.on('user left', (data) => {
        console.log('on user left:', data);
        log(`${data.username} left`);
        addParticipantsMessage(data);
        removeChatTyping(data);
    });

    socket.on('typing', (data) => {
        console.log('on typing:', data);
        addChatTyping(data);
    });

    socket.on('stop typing', (data) => {
        console.log('on stop typing:', data);
        removeChatTyping(data);
    });

    socket.on('disconnect', () => {
        console.log('you have been disconnected');
        log('you have been disconnected');
    });

    socket.on('reconnect', () => {
        console.log('you have been reconnected');
        log('you have been reconnected');
        if (username) {
            socket.emit('add user', username);
        }
    });

    socket.on('reconnect_error', () => {
        console.log('attempt to reconnect has failed');
        log('attempt to reconnect has failed');
    });

});