var _ = require('lodash'),
	mousetrap = require('mousetrap'),
	moment = require('moment'),
	path = require('path'),
	remote = require('remote'),
	request = require('request'),
	React = require('react'),
	Feeds = require('../component/feeds'),
	Token = remote.getCurrentWindow().token;

var sidebar;

var render = function(){
	request.post('http://reader.livedoor.com/api/subs', {
		headers: {
			'Authorization': 'Bearer ' + Token
		},
		form: {
			unread: 0
		}
	}, function(error, response, body){
		if (error) {
			return;
		}

		var json;

		try {
			json = JSON.parse(body).sort(function(a, b){
				return b.unread_count - a.unread_count;
			});

			React.unmountComponentAtNode(document.querySelector('#feeds'));

			React.render(React.createElement(Feeds, {
				feeds: json,
			}), document.querySelector('#feeds'));
		} catch (e) {}
	});
};
render();

mousetrap.bind('r', render);