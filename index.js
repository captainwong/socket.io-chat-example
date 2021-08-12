const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require("socket.io")(server);
const port = process.env.PORT || 3000;


server.listen(port, () => {
    console.log('listening on *:%d', port);
});

app.use(express.static(path.join(__dirname, 'public')));

let numUsers = 0;

io.on('connection', (socket) => {
    console.log('on connection');
    let addedUser = false;

    socket.on('new message', (data) => {
        console.log('on new message:');
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });

    socket.on('add user', (username) => {
        console.log('on add user:', username);
        if(addedUser) return;

        socket.username = username;
        ++numUsers;
        addedUser = true;

        socket.emit('login', {
            numUsers: numUsers
        });

        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    socket.on('typing', () => {
        console.log('on typing:', socket.username);
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    socket.on('stop typing', () => {
        console.log('on stop typing:', socket.username);
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });

    socket.on('disconnect', () => {
        console.log('on disconnect:', socket.username);
        if(addedUser){
            --numUsers;
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    })
})
