'use strict';

var _ = require('lodash'),
    mousetrap = require('mousetrap'),
    progress = require('request-progress'),
    remote = require('remote'),
    request = require('request'),
    watchr = require('watchr'),
    React = require('react'),
    Cookie = require('../cookie'),
    Setting = require('../setting'),
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

		var me,
		    ul = document.getElementById('feeds').children[0];

		_.each(React.findDOMNode(ul).childNodes, function (child, i) {
			if (index === i) {
				me = child;

				child.style.color = '#7fdbff';
				child.style.backgroundColor = '#001f3f';
			} else {
				child.style.color = '#ffffff';
				child.style.backgroundColor = 'transparent';
			}
		});

		var url = 'http://reader.livedoor.com/api/unread',
		    feed = this.props.feeds[index],
		    pins = [];

		if (parseInt(me.children[3].textContent, 10) === 0) {
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

				React.render(React.createElement(Items, {
					items: json.items,
					pins: pins
				}), document.getElementById('items'));
			});

			me.children[3].textContent = 0;

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
		document.getElementById('tools').style.display = this.state.toggle ? 'none' : 'block';
		document.getElementById('feeds').style.display = this.state.toggle ? 'none' : 'block';
		document.getElementById('items').style.paddingLeft = this.state.toggle ? '20px' : '260px';
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
				return React.createElement(
					'li',
					{ key: item.subscribe_id,
						onMouseOver: this.doMouseOver.bind(this, index),
						onMouseOut: this.doMouseOut.bind(this, index),
						onClick: this.doClick.bind(this, index) },
					React.createElement('img', { src: item.icon, style: favicon }),
					item.title,
					'（',
					React.createElement(
						'span',
						null,
						item.unread_count
					),
					'）'
				);
			}, this)
		);
	}
});