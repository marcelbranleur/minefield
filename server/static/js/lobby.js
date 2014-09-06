
/* global Part */

function Lobby($elt, socket) {
    var self = Part($elt, '.lobby');
    self.state = null;
    self.socket = socket;

    self.init = function() {
        self.init_network();
        self.init_beat();

        self.find('.new-game').click(self.new_game);
        self.$elt.on('click', '.join', self.join);
        self.find('input').keyup(function(e) {
            if (e.which == 13) {
                e.preventDefault();
                this.blur();
                self.login();
            }
        });

        self.find('input[name=nick]').val(localStorage.getItem('nick') || '');
    };

    self.init_network = function() {
        self.socket.on('games', function(data) {
            self.update_games(data);
        });
        self.socket.on('join_failed', function(message) {
            self.reset_state();
            self.trigger('join_failed', message);
        });
    };

    self.init_beat = function() {
        var beat_delay = 1000;
        function beat() {
            if (self.state != 'inactive')
                self.socket.emit('get_games');
            setTimeout(beat, beat_delay);
        }
        setTimeout(beat, 0);
    };

    self.new_game = function() {
        var nick = self.find('input[name=nick]').val();
        if (!self.testing)
            localStorage.setItem('nick', nick);
        self.set_state('joining');
        self.socket.emit('new_game', nick);
    };

    self.join = function() {
        var nick = self.find('input[name=nick]').val();
        var key = $(this).data('key');
        self.set_state('joining');
        self.socket.emit('join', nick, key);
    };

    self.reset_state = function() {
        self.find('button').prop('disabled', false);
        self.find('input[name=nick]').prop('disabled', false);
    };

    self.set_state = function(state) {
        self.reset_state();
        if (state == 'joining' || state == 'inactive') {
            self.find('button').prop('disabled', true);
            self.find('input[name=nick]').prop('disabled', true);
        }
        self.state = state;
    };

    self.update_games = function(data) {
        function make_row(item) {
            var $row = $('<tr>');
            if (item.type == 'game') {
                $row.append($('<td>').text(item.nicks[0] || 'Anonymous'));
                $row.append($('<td class="vs">vs</td>'));
                $row.append($('<td>').text(item.nicks[1] || 'Anonymous'));
            } else if (item.type == 'player') {
                $row.append($('<td>').text(item.nick || 'Anonymous'));
                $row.append($('<td class="vs"></td>'));
                var $join_button = $('<button class="join">Join</button>');
                if (item.key) {
                    $join_button.text('Join');
                    $join_button.data('key', item.key);
                    if (self.state !== null)
                        $join_button.prop('disabled', true);
                } else {
                    $join_button.text('private');
                    $join_button.prop('disabled', true);
                }
                $row.append($('<td>').append($join_button));
            }

            if (!(item.type == 'player' && item.key)) {
                $row.addClass('inactive');
            }
            return $row;
        }
        var $table = self.find('.games table');
        $table.empty();
        $.each(data, function(i, item) {
            self.find('.games table').append(make_row(item));
        });

    };

    self.init();
    return self;
}
