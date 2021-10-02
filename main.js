var clientId = 'zpk5giy1ohrc2kownxvfe33j803235';
var redirectURI = 'https://ttching2.github.io/bookish-waffle/';
var scope = 'channel:read:redemptions';
var ws;

function parseFragment(hash) {
            var hashMatch = function(expr) {
                          var match = hash.match(expr);
                          return match ? match[1] : null;
                        };
            var state = hashMatch(/state=(\w+)/);
            if (sessionStorage.twitchOAuthState == state)
                        sessionStorage.twitchOAuthToken = hashMatch(/access_token=(\w+)/);
            return
};

function authUrl() {
            sessionStorage.twitchOAuthState = nonce(15);
            var url = 'https://id.twitch.tv/oauth2/authorize' +
                        '?response_type=token' +
                        '&client_id=' + clientId +
                        '&redirect_uri=' + redirectURI +
                        '&state=' + sessionStorage.twitchOAuthState +
                        '&scope=' + scope;
            return url
}

function nonce(length) {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i < length; i++) {
                            text += possible.charAt(Math.floor(Math.random() * possible.length));
                        }
            return text;
}

function heartbeat() {
            message = {
                            type: 'PING'
                        };
            ws.send(JSON.stringify(message));
}

function listen(topic) {
            message = {
                            type: 'LISTEN',
                            nonce: nonce(15),
                            data: {
                                                topics: [topic],
                                                auth_token: sessionStorage.twitchOAuthToken
                                            }
                        };
            ws.send(JSON.stringify(message));
}

function connect() {
            var heartbeatInterval = 1000 * 180;
            var reconnectInterval = 1000 * 3;
            var heartbeatHandle;

            ws = new WebSocket('wss://pubsub-edge.twitch.tv');

            ws.onopen = function(event) {
                            heartbeat();
                            heartbeatHandle = setInterval(heartbeat, heartbeatInterval);
                    $.ajax({
                                                            url: "https://api.twitch.tv/helix/users",
                                                            method: "GET",
                                                                        headers: {

                        "Client-ID": clientId,

                        "Authorization": "Bearer " + sessionStorage.twitchOAuthToken,

                    }})
                                                .done(function(user) {
                                                                                                listen("channel-points-channel-v1." + user.data[0].id);
                                                                                                            });
                        };

            ws.onerror = function(error) {
                            $('.ws-output').append('ERR:  ' + JSON.stringify(error) + '\n');
                        };

            ws.onmessage = function(event) {
                            message = JSON.parse(event.data);
                            if (message.type == 'RECONNECT') {
                                                setTimeout(connect, reconnectInterval);
                                            }
                    if (message.type == 'MESSAGE') {
                        const json = JSON.parse(message.data.message);
                        const data = json.data.redemption;
                        const redeemed = data.redeemed_at;
                        const user = data.user.display_name;
                        const title = data.reward.title;
                        document.getElementById("sound").play();
                        $('.ws-output').append(redeemed + ": user " + user + " redeemed reward " + title);
                    }
            };

            ws.onclose = function() {
                            clearInterval(heartbeatHandle);
                            setTimeout(connect, reconnectInterval);
                        };

}

$(function() {
            if (document.location.hash.match(/access_token=(\w+)/))
                        parseFragment(document.location.hash);
            if (sessionStorage.twitchOAuthToken) {
                            connect();
                            $('.socket').show();
                        } else {
                                        var url = authUrl()
                                        $('#auth-link').attr("href", url);
                                        $('.auth').show()
                                    }
});
