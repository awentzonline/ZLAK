(function (window, document, $, _) {
    function log(msg) {
        $('#console').append('<div>' + msg + '</div>');
    }

    var dataConnections = {};

    var peer = new Peer({key: 'x6wcgg5nrtuzncdi'});
    peer.on('open', function(id) {
        log('Your peer ID is: ' + id);
    });
    peer.on('connection', handleNewConnection);
    peer.on('error', function (err) {
        log('Peer error: ' + err);
    });
    function handleNewConnection(dataConnection) {
        // add some event handlers to new connections
        var peerId = dataConnection.peer;
        //log(peerId + ' connected ');
        dataConnections[peerId] = dataConnection;
        dataConnection.on('data', function (data) { 
            switch (data.type) {
                case 'peers4u':
                    var peerList = data.data;
                    _.forEach(peerList, function (pid) {
                        if (dataConnections[pid] === undefined) {
                            connectTo(pid);
                        }
                    });
                    break;
                case 'chat':
                    logChat(peerId, data.data);
                    break;
            }
        });
        dataConnection.on('open', function () { 
            log(peerId + ' opened');
            sendPeerListTo(peerId);
        });
        dataConnection.on('close', function () {
            delete dataConnections[peerId];
            log(peerId + ' closed');
        });
        dataConnection.on('error', function (err) { 
            log(peerId + ' error: ' + err);
        });
    }
    function connectTo(peerId) {
        if (dataConnections[peerId] === undefined) {
            var connection = peer.connect(peerId);
            handleNewConnection(connection);
        }
    }
    function sendPeerListTo(peerId) {
        // send a list of everyone but the target peer
        var connection = dataConnections[peerId];
        if (!connection) {
            return;
        }
        var peerIds = _.filter(_.keys(dataConnections),
            function (pid) {
                return pid != peerId;  
            }
        );
        sendMessageToPeer(peerId, 'peers4u', peerIds);
    }
    function broadcast(msgType, data) {
        var packet = {
            type: msgType,
            data: data
        }
        _(dataConnections).forEach(function (connection) {
            connection.send(packet);
        });
    }
    function sendMessageToPeer(peerId, msgType, msg) {
        var packet = {
            type: msgType,
            data: msg
        }
        var connection = dataConnections[peerId];
        connection.send(packet);
    }
    $('.add-peer-form').submit(function (event) {
        event.preventDefault();
        var form = $(this);
        var input = form.find('input[type="text"]');
        connectTo(input.val());
        input.val('');
        return false;
    });
    $('.chat-form').submit(function (event) {
        event.preventDefault();
        var form = $(this);
        var input = form.find('input[type="text"]');
        var message = input.val().trim();
        if (message) {
            logChat('You', message);
            broadcast('chat', message);
        }
        input.val('');
        return false;
    });
    function logChat(peerId, message) {
        log(peerId + ': ' + message);
    }
}(window, document, jQuery, _));
