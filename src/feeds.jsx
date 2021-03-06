var _ = require('lodash'),
	electron = require('electron'),
	mousetrap = require('mousetrap'),
	progress = require('request-progress'),
	request = require('request'),
	React = require('react'),
	ReactDnD = require('react-dnd'),
	Cookie = require('../cookie'),
	Setting = require('../setting'),
	State = require('../state'),
	Feed = require('./feed'),
	Items = require('./items');

var ipc = electron.ipcRenderer,
	remote = electron.remote;

var app = remote.app;

module.exports = React.createClass({
	displayName: 'feeds',
	getInitialState: function(){
		return {
			active: null,
			toggle: true
		};
	},
	doActive: function(index){
		this.setState({
			active: index
		});
	},
	doMouseEnter: function(index){
		if (index !== this.state.active) {
			var ul = document.getElementById('feeds').children[0];
			React.findDOMNode(ul).childNodes[index].style.color = '#7fdbff';
			React.findDOMNode(ul).childNodes[index].style.backgroundColor = '#001f3f';
		}
	},
	doMouseLeave: function(index){
		if (index !== this.state.active) {
			var ul = document.getElementById('feeds').children[0];
			React.findDOMNode(ul).childNodes[index].style.color = '#ffffff';
			React.findDOMNode(ul).childNodes[index].style.backgroundColor = 'transparent';
		}
	},
	doClick: function(index){
		this.setState({
			active: index
		});

		var me,
			ul = document.getElementById('feeds').children[0];

		_.each(React.findDOMNode(ul).childNodes, function(child, i){
			if (index === i) {
				me = child;

				child.style.color = '#7fdbff';
				child.style.backgroundColor = '#001f3f';
			} else {
				child.style.color = '#ffffff';
				child.style.backgroundColor = 'transparent';
			}
		});

		if (process.platform === 'darwin') {
			app.dock.setBadge('' + (parseInt(app.dock.getBadge(), 10) - parseInt(me.children[2].textContent, 10)));
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
				'User-Agent': remote.getCurrentWindow().webContents.getUserAgent(),
				Cookie: Cookie.get()
			},
			form: {
				subscribe_id: feed.subscribe_id
			}
		}, function(error, response, body){
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
					'User-Agent': remote.getCurrentWindow().webContents.getUserAgent(),
					Cookie: Cookie.get()
				}
			}, function(error, response, body){
				if (!error) {
					try {
						pins = JSON.parse(body);
					} catch (e) {}
				}

				State.merge({
					category: 'meta',
					content: {
						subscribe_id: feed.subscribe_id,
						title: feed.title,
						pins: pins
					}
				});

				React.render(React.createElement(Items, {
					feed: feed,
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
					'User-Agent': remote.getCurrentWindow().webContents.getUserAgent(),
					Cookie: Cookie.get() + '; reader_sid=' + Cookie.parseApiKey(response.headers['set-cookie'])
				},
				form: {
					subscribe_id: feed.subscribe_id
				}
			}, function(error, response, body){});

			document.getElementById('progressbar').style.width = '100%';
			_.delay(function(){
				document.getElementById('progressbar').style.width = '0%';
			}, 500);
		}.bind(this)), {
			throttle: 100
		}).on('progress', function(state){
			document.getElementById('progressbar').style.width = state.percent + '%';
		});
	},
	doPrev: function(){
		var index = _.isNull(this.state.active) ? 0 : this.state.active - 1;
		if (index < 0) {
			index = 0;
		}

		document.getElementById(this.props.feeds[index].subscribe_id).scrollIntoView();

		this.doClick(index);
	},
	doNext: function(){
		var index = _.isNull(this.state.active) ? 0 : this.state.active + 1;
		if (index >= this.props.feeds.length) {
			index = this.props.feeds.length - 1;
		}

		document.getElementById(this.props.feeds[index].subscribe_id).scrollIntoView();

		this.doClick(index);
	},
	doToggle: function(){
		document.getElementById('folders').style.display = this.state.toggle ? 'none' : 'block';
		document.getElementById('sidebar').style.display = this.state.toggle ? 'none' : 'block';
		document.getElementById('items').style.left = this.state.toggle ? 0 : '316px';
		this.setState({
			toggle: !this.state.toggle
		});
	},
	componentDidMount: function(){
		ipc.on('feed:mouseenter', this.doMouseEnter);
		ipc.on('feed:mouseleave', this.doMouseLeave);
		ipc.on('feed:click', this.doClick);
		ipc.on('feed:active', this.doActive);

		mousetrap.bind('a', this.doPrev);
		mousetrap.bind('s', this.doNext);
		mousetrap.bind('z', this.doToggle);

		var setting = Setting.get();

		if (State.exists({ category: 'feeds' }) &&
			State.exists({ category: 'items' }) &&
			State.exists({ category: 'meta' }) &&
			(_.isUndefined(setting, 'state') || setting.state)) {
			var feeds = State.load({
					category: 'feeds'
				}),
				items = State.load({
					category: 'items'
				}),
				meta = State.load({
					category: 'meta'
				});

			React.render(React.createElement(Items, {
				feed: _.filter(feeds, function(item){
					return item.subscribe_id === meta.subscribe_id;
				})[0],
				items: items,
				pins: meta.pins
			}), document.getElementById('items'));
		}
	},
	componentDidUpdate: function(){
		var setting = Setting.get();

		if (State.exists({ category: 'feeds' }) &&
			State.exists({ category: 'items' }) &&
			State.exists({ category: 'meta' }) &&
			(_.isUndefined(setting, 'state') || setting.state)) {
			var feeds = State.load({
					category: 'feeds'
				}),
				items = State.load({
					category: 'items'
				}),
				meta = State.load({
					category: 'meta'
				});

			React.render(React.createElement(Items, {
				feed: _.filter(feeds, function(item){
					return item.subscribe_id === meta.subscribe_id;
				})[0],
				items: items,
				pins: meta.pins
			}), document.getElementById('items'));
		}
	},
	componentWillReceiveProps: function(){
		this.setState({
			active: null
		});
	},
	componentWillUnmount: function(){
		ipc.removeListener('feed:mouseenter', this.doMouseEnter);
		ipc.removeListener('feed:mouseleave', this.doMouseLeave);
		ipc.removeListener('feed:click', this.doClick);
		ipc.removeListener('feed:active', this.doActive);

		mousetrap.unbind('a');
		mousetrap.unbind('s');
		mousetrap.unbind('z');
	},
	render: function(){
		var setting = Setting.get(),
			favicon = {
				display: setting.favicon ? 'inline' : 'none'
			},
			font = {
				fontFamily: setting.fontfamily
			};

		return (
			<ul>{this.props.feeds.map(function(item, index){
					var feed = 'feed',
						badge = 'badge';

					if (item.unread_count === 0) {
						feed += ' feed-zero';
						badge += ' badge-zero';
					}

					return (
						<Feed key={item.subscribe_id}
							subscribe_id={item.subscribe_id}
							index={index}
							font={font}
							icon={item.icon}
							favicon={favicon}
							feed={feed}
							title={item.title}
							badge={badge}
							unread_count={item.unread_count}
							folder={item.folder}/>
					);
				}, this)}
			</ul>
		);
	}
});