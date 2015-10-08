'use strict';

var _ = require('lodash'),
    mousetrap = require('mousetrap'),
    progress = require('request-progress'),
    remote = require('remote'),
    request = require('request'),
    watchr = require('watchr'),
    app = remote.require('app'),
    React = require('react'),
    Cookie = require('../cookie'),
    Setting = require('../setting'),
    State = require('../state'),
    Items = require('./items');

module.exports = React.createClass({
	displayName: 'items',
	getInitialState: function getInitialState() {
		return {
			active: null,
			toggle: true
		};
	},
	doMouseOver: function doMouseOver(index) {
		if (index !== this.state.active) {
			var ul = document.getElementById('feeds').children[0];
			React.findDOMNode(ul).childNodes[index].style.color = '#7fdbff';
			React.findDOMNode(ul).childNodes[index].style.backgroundColor = '#001f3f';
		}
	},
	doMouseOut: function doMouseOut(index) {
		if (index !== this.state.active) {
			var ul = document.getElementById('feeds').children[0];
			React.findDOMNode(ul).childNodes[index].style.color = '#ffffff';
			React.findDOMNode(ul).childNodes[index].style.backgroundColor = 'transparent';
		}
	},
	doClick: function doClick(index) {
		this.setState({
			active: index
		});

		var badge = 0,
		    me,
		    ul = document.getElementById('feeds').children[0];

		_.each(React.findDOMNode(ul).childNodes, function (child, i) {
			if (index === i) {
				me = child;

				child.style.color = '#7fdbff';
				child.style.backgroundColor = '#001f3f';
			} else {
				badge += parseInt(child.children[2].textContent, 10);

				child.style.color = '#ffffff';
				child.style.backgroundColor = 'transparent';
			}
		});

		if (process.platform === 'darwin') {
			app.dock.setBadge('' + badge);
		}

		var url = 'http://reader.livedoor.com/api/unread',
		    feed = this.props.feeds[index],
		    pins = [];

		if (parseInt(me.children[2].textContent, 10) === 0) {
			url = 'http://reader.livedoor.com/api/all';
		}

		document.getElementById('progressbar').style.width = '0%';

		progress(request.post(url, {
			headers: {
				'User-Agent': remote.getCurrentWindow().useragent,
				Cookie: Cookie.get()
			},
			form: {
				subscribe_id: feed.subscribe_id
			}
		}, (function (error, response, body) {
			if (error) {
				return;
			}

			React.unmountComponentAtNode(document.getElementById('items'));

			var json;

			try {
				json = JSON.parse(body);
				State.save({
					category: 'items',
					content: json.items
				});
			} catch (e) {
				return;
			}

			request.post('http://reader.livedoor.com/api/pin/all', {
				headers: {
					'User-Agent': remote.getCurrentWindow().useragent,
					Cookie: Cookie.get()
				}
			}, function (error, response, body) {
				if (!error) {
					try {
						pins = JSON.parse(body);
					} catch (e) {}
				}

				State.save({
					category: 'meta',
					content: {
						subscribe_id: feed.subscribe_id,
						title: feed.title,
						pins: pins
					}
				});

				React.render(React.createElement(Items, {
					subscribe_id: feed.subscribe_id,
					title: feed.title,
					items: json.items,
					pins: pins
				}), document.getElementById('items'));
			});

			me.children[2].textContent = 0;

			feed.unread_count = 0;
			State.merge({
				category: 'feeds',
				content: feed
			});

			if (!me.children[1].classList.contains('feed-zero')) {
				me.children[1].classList.add('feed-zero');
			}

			if (!me.children[2].classList.contains('badge-zero')) {
				me.children[2].classList.add('badge-zero');
			}

			request.post('http://reader.livedoor.com/api/touch_all', {
				headers: {
					'User-Agent': remote.getCurrentWindow().useragent,
					Cookie: Cookie.get() + '; reader_sid=' + Cookie.parseApiKey(response.headers['set-cookie'])
				},
				form: {
					subscribe_id: feed.subscribe_id
				}
			}, function (error, response, body) {});

			document.getElementById('progressbar').style.width = '100%';
			_.delay(function () {
				document.getElementById('progressbar').style.width = '0%';
			}, 500);
		}).bind(this)), {
			throttle: 100
		}).on('progress', function (state) {
			document.getElementById('progressbar').style.width = state.percent + '%';
		});
	},
	doPrev: function doPrev() {
		var index = _.isNull(this.state.active) ? 0 : this.state.active - 1;
		if (index < 0) {
			index = 0;
		}

		this.doClick(index);
	},
	doNext: function doNext() {
		var index = _.isNull(this.state.active) ? 0 : this.state.active + 1;
		if (index >= this.props.feeds.length) {
			index = this.props.feeds.length - 1;
		}

		this.doClick(index);
	},
	doToggle: function doToggle() {
		document.getElementById('folders').style.display = this.state.toggle ? 'none' : 'block';
		document.getElementById('sidebar').style.display = this.state.toggle ? 'none' : 'block';
		document.getElementById('items').style.left = this.state.toggle ? 0 : '316px';
		this.setState({
			toggle: !this.state.toggle
		});
	},
	componentDidMount: function componentDidMount() {
		mousetrap.bind('a', this.doPrev);
		mousetrap.bind('s', this.doNext);
		mousetrap.bind('z', this.doToggle);

		watchr.watch({
			path: path.join(__dirname, '..', 'data', 'setting.json'),
			listener: (function () {
				var setting = Setting.get(),
				    ul = document.getElementById('feeds').children[0];

				document.getElementsByTagName('body')[0].style.fontFamily = setting.fontfamily;

				_.each(React.findDOMNode(ul).childNodes, function (item) {
					item.children[0].style.display = setting.favicon ? 'inline' : 'none';
				});
			}).bind(this)
		});

		var setting = Setting.get();

		if (State.exists({ category: 'items' }) && State.exists({ category: 'meta' }) && (_.isUndefined(setting, 'state') || setting.state)) {
			var items = State.load({
				category: 'items'
			}),
			    meta = State.load({
				category: 'meta'
			}),
			    badge = 0;

			_.each(React.findDOMNode(document.getElementById('feeds').children[0]).childNodes, (function (item, index) {
				if (this.props.feeds[index].subscribe_id === meta.subscribe_id) {
					this.setState({
						active: index
					});

					item.style.color = '#7fdbff';
					item.style.backgroundColor = '#001f3f';
				} else {
					badge += parseInt(item.children[2].textContent, 10);

					item.style.color = '#ffffff';
					item.style.backgroundColor = 'transparent';
				}
			}).bind(this));

			if (process.platform === 'darwin') {
				app.dock.setBadge('' + badge);
			}

			React.render(React.createElement(Items, {
				subscribe_id: meta.subscribe_id,
				title: meta.title,
				items: items,
				pins: meta.pins
			}), document.getElementById('items'));
		}
	},
	componentWillUnmount: function componentWillUnmount() {
		mousetrap.unbind('a');
		mousetrap.unbind('s');
		mousetrap.unbind('z');
	},
	render: function render() {
		var setting = Setting.get(),
		    favicon = {
			display: setting.favicon ? 'inline' : 'none'
		};

		return React.createElement(
			'ul',
			null,
			this.props.feeds.map(function (item, index) {
				var feed = 'feed',
				    badge = 'badge';

				if (item.unread_count === 0) {
					feed += ' feed-zero';
					badge += ' badge-zero';
				}

				return React.createElement(
					'li',
					{ key: item.subscribe_id,
						onMouseOver: this.doMouseOver.bind(this, index),
						onMouseOut: this.doMouseOut.bind(this, index),
						onClick: this.doClick.bind(this, index) },
					React.createElement('img', { src: item.icon, style: favicon }),
					React.createElement(
						'span',
						{ className: feed },
						item.title
					),
					React.createElement(
						'span',
						{ className: badge },
						item.unread_count
					)
				);
			}, this)
		);
	}
});