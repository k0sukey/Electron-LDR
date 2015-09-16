var _ = require('lodash'),
	mousetrap = require('mousetrap'),
	remote = require('remote'),
	request = require('request'),
	React = require('react'),
	Cookie = require('../cookie'),
	Feeds = require('../component/feeds');

var sidebar;

var render = function(){
	request.post('http://reader.livedoor.com/api/subs', {
		headers: {
			'User-Agent': remote.getCurrentWindow().useragent,
			Cookie: Cookie.get()
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
		} catch (e) {
			Cookie.set('');
			remote.getCurrentWindow().close();
		}
	});
};
render();

mousetrap.bind('r', render);