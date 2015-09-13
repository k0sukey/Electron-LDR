var _ = require('lodash'),
	moment = require('moment'),
	path = require('path'),
	remote = require('remote'),
	request = require('request'),
	React = require('react'),
	Items = require('../component/items'),
	Token = remote.getCurrentWindow().token;


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

	var json = JSON.parse(body).sort(function(a, b){
		return b.unread_count - a.unread_count;
	});

	React.render(React.createElement(Items, {
		items: json,
	}), document.querySelector('#sidebar'));
});