var _ = require('lodash'),
	mousetrap = require('mousetrap'),
	path = require('path'),
	progress = require('request-progress'),
	remote = require('remote'),
	request = require('request'),
	app = remote.require('app'),
	ipc = remote.require('ipc'),
	React = require('react'),
	ReactDnD = require('react-dnd'),
	ReactTooltip = require('react-tooltip'),
	HTML5Backend = require('react-dnd/modules/backends/HTML5'),
	Cookie = require('../cookie'),
	Setting = require('../setting'),
	State = require('../state'),
	Feeds = require('../component/feeds'),
	Folders = require('../component/folders');

if (!State.exists({ category: 'meta'})) {
	State.save({
		category: 'meta',
		content: {}
	});
}

var App = React.createClass({
	displayName: 'app',
	getInitialState: function(){
		return {
			order: 'modified_on',
			filter: '',
			folders: {
				name2id: {},
				names: []
			},
			folder: '全て',
			feeds: []
		};
	},
	doOrder: function(){
		var element = document.getElementById('order'),
			index = element.selectedIndex;

		var order = element.options[index].value;
		Setting.set('order', order);

		this.setState({
			order: order
		});

		this.doFeeds({
			order: order
		});
	},
	doFilter: function(){
		var filter = document.getElementById('filter').value;

		this.setState({
			filter: filter
		});

		this.doFeeds({
			filter: filter
		});
	},
	doFolders: function(){
		var folders = State.load({
			category: 'folders'
		});

		this.setState({
			folders: folders
		});

		var meta = State.load({
			category: 'meta'
		});

		if (_.has(meta, 'folder')) {
			this.setState({
				folder: meta.folder
			});

			this.doFeeds({
				folder: meta.folder
			});
		} else {
			this.doFeeds();
		}
	},
	doFeeds: function(params){
		params = params || {};

		params = _.extend({
			order: this.state.order,
			filter: this.state.filter,
			folder: this.state.folder
		}, params);

		var feeds = State.load({
			category: 'feeds'
		});

		if (process.platform === 'darwin') {
			var badge = 0;

			_.each(feeds, function(feed){
				badge += feed.unread_count
			});

			app.dock.setBadge('' + badge);
		}

		if (params.folder === '未分類') {
			feeds = _.filter(feeds, function(feed){
				return feed.folder === '';
			});
		} else if (params.folder !== '' && params.folder !== '全て') {
			feeds = _.filter(feeds, function(feed){
				return feed.folder === params.folder;
			}.bind(this));
		}

		if (params.filter !== '') {
			var regex = new RegExp(params.filter, 'i');

			feeds = _.filter(feeds, function(feed){
				return regex.test(feed.title);
			});
		}

		feeds = feeds.sort(function(a, b){
			switch (params.order) {
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
		}.bind(this));

		var setting = Setting.get();

		if (_.has(setting, 'unread') && !setting.unread) {
			feeds = _.filter(feeds, function(feed){
				return feed.unread_count;
			});
		}

		this.setState({
			feeds: feeds
		});
	},
	doFetch: function(){
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

			var feeds;

			try {
				feeds = JSON.parse(body);
			} catch (e) {
				return;
			}

			State.save({
				category: 'feeds',
				content: feeds
			});

			document.getElementById('progressbar').style.width = '50%';

			progress(request.post('http://reader.livedoor.com/api/folders', {
				headers: {
					'User-Agent': remote.getCurrentWindow().useragent,
					Cookie: Cookie.get()
				}
			}, function(error, response, body){
				if (error) {
					return;
				}

				var folders;

				try {
					folders = JSON.parse(body);
				} catch (e) {
					return;
				}

				folders.name2id = _.extend({
					'全て': '-1'
				}, folders.name2id);
				folders.name2id = _.extend({
					'未分類': '0'
				}, folders.name2id);

				folders.names.unshift('未分類');
				folders.names.unshift('全て');

				State.save({
					category: 'folders',
					content: folders
				});

				document.getElementById('progressbar').style.width = '100%';

				_.delay(function(){
					document.getElementById('progressbar').style.width = '0%';
				}, 500);

				this.doFolders();
			}.bind(this)), {
				throttle: 100
			}).on('progress', function(state){
				document.getElementById('progressbar').style.width = (state.percent * 0.5 + 50) + '%';
			});
		}.bind(this)), {
			throttle: 100
		}).on('progress', function(state){
			document.getElementById('progressbar').style.width = (state.percent * 0.5) + '%';
		});
	},
	componentDidMount: function(){
		var setting = Setting.get(),
			meta = State.load({
				category: 'meta'
			});

		document.getElementsByTagName('body')[0].style.fontFamily = setting.fontfamily;

		_.each(document.getElementById('order').options, function(item, index){
			if (item.value === setting.order) {
				item.selected = 'selected';
			}
		}.bind(this));


		if (State.exists({ category: 'feeds'}) &&
			State.exists({ category: 'folders'}) &&
			_.has(meta, 'folder') &&
			(_.isUndefined(setting, 'state') || setting.state)) {
			this.setState({
				folders: State.load({
						category: 'folders'
					})
			});

			this.setState({
				folder: meta.folder
			});

			this.doFeeds({
				order: setting.order,
				folder: meta.folder
			});
		} else {
			this.doFetch();
		}

		ipc.on('folders', this.doFolders);
		ipc.on('setting', this.doFeeds);
		ipc.on('reload', this.doFetch);
		mousetrap.bind('r', this.doFetch);
	},
	componentWillUnmount: function(){
	},
	render: function(){
		return (
			<div id="wrapper">
				<div id='extend'><div id='folders'><Folders folders={this.state.folders} folder={this.state.folder}/></div></div>
				<div id='sidebar'>
					<div id='tools'>
						<select id='order' onChange={this.doOrder}>
							<option value='modified_on'>新着順</option>
							<option value='modified_on:reverse'>旧着順</option>
							<option value='unread_count'>未読が多い</option>
							<option value='unread_count:reverse'>未読が少ない</option>
							<option value='title:reverse'>タイトル</option>
							<option value='rate'>レート</option>
							<option value='subscribers_count'>読者が多い</option>
							<option value='subscribers_count:reverse'>読者が少ない</option>
						</select>
						<input id='filter' type='test' onKeyUp={this.doFilter}/>
					</div>
					<div id='feeds'><Feeds feeds={this.state.feeds}/></div>
				</div>
				<div id='content'>
					<div id='items' tabindex='-1'></div>
				</div>
			</div>
		);
	}
});
App = ReactDnD.DragDropContext(HTML5Backend)(App);
React.render(React.createElement(App), document.getElementById('app'));
React.render(React.createElement(ReactTooltip), document.getElementById('tooltip'));

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