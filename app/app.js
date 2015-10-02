var _ = require('lodash'),
	mousetrap = require('mousetrap'),
	path = require('path'),
	progress = require('request-progress'),
	remote = require('remote'),
	request = require('request'),
	watchr = require('watchr'),
	app = remote.require('app'),
	React = require('react'),
	Cookie = require('../cookie'),
	Setting = require('../setting'),
	State = require('../state'),
	Feeds = require('../component/feeds');

var feeds = [],
	order = 'modified_on',
	filter = '',
	setting = Setting.get();

if (process.platform === 'darwin') {
	document.getElementById('tools').style.paddingTop = '30px';
}

document.getElementsByTagName('body')[0].style.fontFamily = setting.fontfamily;

_.each(document.getElementById('order').options, function(item, index){
	if (item.value === setting.order) {
		item.selected = 'selected';
	}
});

function doOrder() {
	var element = document.getElementById('order'),
		index = element.selectedIndex;

	order = element.options[index].value;
	Setting.set('order', order);

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

	_feeds = _feeds.sort(function(a, b){
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

	var setting = Setting.get();

	if (_.has(setting, 'unread') && !setting.unread) {
		_feeds = _.filter(_feeds, function(feed){
			return feed.unread_count;
		});
	}

	React.unmountComponentAtNode(document.getElementById('feeds'));

	React.render(React.createElement(Feeds, {
		feeds: _feeds,
	}), document.getElementById('feeds'));
}

function fetch(reload) {
	document.getElementById('progressbar').style.width = '0%';

	progress(request.post('http://reader.livedoor.com/api/subs', {
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
			State.save({
				category: 'feeds',
				content: feeds
			});

			if (process.platform === 'darwin') {
				var badge = 0;

				_.each(feeds, function(feed){
					badge += feed.unread_count
				});

				app.dock.setBadge('' + badge);
			}

			render();
		} catch (e) {
			Cookie.set('');
			remote.getCurrentWindow().close();
		}

		document.getElementById('progressbar').style.width = '100%';
		_.delay(function(){
			document.getElementById('progressbar').style.width = '0%';
		}, 500);
	}), {
		throttle: 100
	}).on('progress', function(state){
		document.getElementById('progressbar').style.width = state.percent + '%';
	});
}

if (State.exists({ category: 'feeds'})) {
	feeds = State.load({
		category: 'feeds'
	});
	render();
} else {
	fetch(true);
}

mousetrap.bind('r', function(){
	fetch(true);
});

var doShortcut = function(){
	var element = document.getElementById('help');

	if (element.style.display === '' ||
		element.style.display === 'none') {
		element.style.display = 'block';
	} else {
		element.style.display = 'none';
	}
};
mousetrap.bind('?', doShortcut);
remote.getCurrentWindow().on('shortcut', doShortcut);

mousetrap.bind('f', function(){
	_.defer(function(){
		document.getElementById('filter').focus();
	});
});

watchr.watch({
	path: path.join(__dirname, '..', 'data', 'setting.json'),
	listener: render
});