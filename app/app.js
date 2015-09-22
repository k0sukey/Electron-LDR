var _ = require('lodash'),
	fs = require('fs'),
	mousetrap = require('mousetrap'),
	path = require('path'),
	remote = require('remote'),
	request = require('request'),
	React = require('react'),
	Cookie = require('../cookie'),
	Feeds = require('../component/feeds');

var feeds = [],
	order = 'modified_on',
	filter = '';

if (fs.existsSync(path.join(__dirname, '..', 'data', 'order.dat'))) {
	order = fs.readFileSync(path.join(__dirname, '..', 'data', 'order.dat'), {
		encoding: 'utf8'
	});

	_.each(document.getElementById('order').options, function(item, index){
		if (item.value === order) {
			item.selected = 'selected';
		}
	});
}

function doOrder() {
	var element = document.getElementById('order'),
		index = element.selectedIndex;

	order = element.options[index].value;
	fs.writeFileSync(path.join(__dirname, '..', 'data', 'order.dat'), order);

	render();
}

function doFilter() {
	var element = document.getElementById('filter');

	filter = element.value;

	render();
}

function render() {
	var _feeds = feeds;

	if (filter !== '') {
		var regex = new RegExp(filter, 'i');

		_feeds = _.filter(_feeds, function(feed){
			return regex.test(feed.title);
		});
	}

	feeds = feeds.sort(function(a, b){
		switch (order) {
			case 'modified_on':
				return b.modified_on - a.modified_on;
			case 'modified_on:reverse':
				return a.modified_on - b.modified_on;
			case 'unread_count':
				return b.unread_count - a.unread_count;
			case 'unread_count:reverse':
				return a.unread_count - b.unread_count;
			case 'title:reverse':
				return a.title - b.title;
			case 'rate':
				return b.rate - a.rate;
			case 'subscribers_count':
				return b.subscribers_count - a.subscribers_count;
			case 'subscribers_count:reverse':
				return a.subscribers_count - b.subscribers_count;
		}
	});

	React.unmountComponentAtNode(document.querySelector('#feeds'));

	React.render(React.createElement(Feeds, {
		feeds: _feeds,
	}), document.querySelector('#feeds'));
}

function fetch(reload) {
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

		try {
			feeds = JSON.parse(body);
			render();
		} catch (e) {
			Cookie.set('');
			remote.getCurrentWindow().close();
		}
	});
}
fetch(true);

mousetrap.bind('r', function(){
	fetch(true);
});