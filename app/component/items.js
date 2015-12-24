'use strict';

var _ = require('lodash'),
    electron = require('electron'),
    moment = require('moment'),
    mousetrap = require('mousetrap'),
    request = require('request'),
    React = require('react'),
    Modal = require('react-modal'),
    Setting = require('../setting'),
    State = require('../state'),
    Cookie = require('../cookie'),
    Meta = require('../component/meta');

var remote = electron.remote,
    shell = electron.shell;

var dialog = remote.dialog;

moment.locale('ja');

var style = {
	title: {
		marginBottom: '4px',
		fontSize: '20px',
		fontWeight: 'bold',
		cursor: 'pointer'
	},
	description: {
		marginBottom: '20px',
		fontSize: '14px',
		color: '#aaaaaa'
	},
	created: {
		marginRight: '6px'
	},
	author: {
		marginRight: '6px'
	},
	category: {
		marginRight: '6px'
	},
	modal: {
		content: {
			padding: 0
		}
	},
	browser: {
		display: 'inline-block',
		width: '100%',
		height: '100%'
	}
};

module.exports = React.createClass({
	displayName: 'items',
	getInitialState: function getInitialState() {
		return {
			collapse: false,
			modalIsOpen: false,
			active: null,
			url: ''
		};
	},
	doOpen: function doOpen(index) {
		this.setState({
			modalIsOpen: true,
			url: this.props.items[index].link
		});

		document.getElementById('browser').addEventListener('dom-ready', function () {
			document.getElementById('browser').focus();
		});

		remote.getCurrentWindow().focusOnWebView();
	},
	doClose: function doClose() {
		remote.getCurrentWindow().blurWebView();

		this.setState({
			modalIsOpen: false
		});
	},
	doPrev: function doPrev() {
		var index = _.isNull(this.state.active) ? 0 : this.state.active - 1;
		if (index < 0) {
			index = 0;
		}

		document.getElementById(this.props.items[index].id).scrollIntoView();
		this.setState({
			active: index
		});

		State.merge({
			category: 'meta',
			content: {
				items: index
			}
		});
	},
	doNext: function doNext() {
		var index = _.isNull(this.state.active) ? 0 : this.state.active + 1;
		if (index >= this.props.items.length) {
			index = this.props.items.length - 1;
		}

		document.getElementById(this.props.items[index].id).scrollIntoView();
		this.setState({
			active: index
		});

		State.merge({
			category: 'meta',
			content: {
				items: index
			}
		});
	},
	doCollapse: function doCollapse() {
		this.props.items.map(function (item) {
			document.getElementById(item.id).children[2].style.display = !this.state.collapse ? 'none' : 'block';
		}, this);

		this.setState({
			collapse: !this.state.collapse
		});
	},
	doModal: function doModal() {
		if (this.state.modalIsOpen) {
			this.doClose();
			document.getElementById('feeds').style.overflowY = 'auto';
			document.getElementById('items').style.overflowY = 'auto';
		} else {
			this.doOpen(_.isNull(this.state.active) ? 0 : this.state.active);
			document.getElementById('feeds').style.overflowY = 'hidden';
			document.getElementById('items').style.overflowY = 'hidden';
		}
	},
	doPinning: function doPinning() {
		var index = _.isNull(this.state.active) ? 0 : this.state.active,
		    item = this.props.items[index];

		request.post('http://reader.livedoor.com/api/pin/all', {
			headers: {
				'User-Agent': remote.getCurrentWindow().webContents.getUserAgent(),
				Cookie: Cookie.get()
			}
		}, (function (error, response, body) {
			if (error) {
				return;
			}

			var json,
			    pins = this.props.pins;

			try {
				json = JSON.parse(body);
			} catch (e) {
				return;
			}

			var url = 'http://reader.livedoor.com/api/pin/',
			    form = {},
			    haspin = _.where(json, { link: item.link }).length > 0;

			if (haspin) {
				url += 'remove';
				form = {
					link: item.link
				};
			} else {
				url += 'add';
				form = {
					link: item.link,
					title: item.title
				};
			}

			request.post(url, {
				headers: {
					'User-Agent': remote.getCurrentWindow().webContents.getUserAgent(),
					Cookie: Cookie.get() + '; reader_sid=' + Cookie.parseApiKey(response.headers['set-cookie'])
				},
				form: form
			}, function (error, response, body) {
				if (error) {
					return;
				}

				var json;

				try {
					json = JSON.parse(body);
				} catch (e) {
					return;
				}

				if (json.isSuccess) {
					if (haspin) {
						document.getElementById(item.id).classList.remove('haspin');

						State.merge({
							category: 'meta',
							content: {
								pins: _.filter(pins, function (pin) {
									return pin.link !== item.link;
								})
							}
						});
					} else {
						document.getElementById(item.id).classList.add('haspin');

						pins.push({
							link: item.link,
							title: item.title
						});

						State.merge({
							category: 'meta',
							content: {
								pins: pins
							}
						});
					}
				}
			});
		}).bind(this));
	},
	doBrowser: function doBrowser() {
		var index = _.isNull(this.state.active) ? 0 : this.state.active;

		shell.openExternal(this.props.items[index].link);
	},
	doUnsubscribe: function doUnsubscribe() {
		dialog.showMessageBox(remote.getCurrentWindow(), {
			type: 'question',
			buttons: ['キャンセル', '解除する'],
			message: '「' + this.props.feed.title + '」の登録を解除しますか？',
			cancelId: 0
		}, (function (e) {
			if (e === 0) {
				return;
			}

			request.post('http://reader.livedoor.com/api/all', {
				headers: {
					'User-Agent': remote.getCurrentWindow().webContents.getUserAgent(),
					Cookie: Cookie.get()
				},
				form: {
					subscribe_id: this.props.feed.subscribe_id,
					offset: 0,
					limit: 1
				}
			}, (function (error, response, body) {
				if (error) {
					return;
				}

				request.post('http://reader.livedoor.com/api/feed/unsubscribe', {
					headers: {
						'User-Agent': remote.getCurrentWindow().webContents.getUserAgent(),
						Cookie: Cookie.get() + '; reader_sid=' + Cookie.parseApiKey(response.headers['set-cookie'])
					},
					form: {
						subscribe_id: this.props.feed.subscribe_id
					}
				}, function (error, response, body) {});
			}).bind(this));
		}).bind(this));
	},
	componentDidMount: function componentDidMount() {
		mousetrap.bind('k', this.doPrev);
		mousetrap.bind('j', this.doNext);
		mousetrap.bind('c', this.doCollapse);
		mousetrap.bind('v', this.doModal);
		mousetrap.bind('p', this.doPinning);
		mousetrap.bind('b', this.doBrowser);
		mousetrap.bind('del', this.doUnsubscribe);

		if (this.props.items[0]) {
			document.getElementById(this.props.items[0].id).scrollIntoView();
			this.setState({
				active: 0
			});
		}

		var setting = Setting.get();

		if (State.exists({ category: 'meta' }) && (_.isUndefined(setting, 'state') || setting.state)) {
			var meta = State.load({
				category: 'meta'
			});

			if (meta.items && this.props.items[meta.items]) {
				document.getElementById(this.props.items[meta.items].id).scrollIntoView();
				this.setState({
					active: meta.items
				});
			}
		}

		document.getElementById('items').focus();
	},
	componentWillUnmount: function componentWillUnmount() {
		mousetrap.unbind('k');
		mousetrap.unbind('j');
		mousetrap.unbind('c');
		mousetrap.unbind('v');
		mousetrap.unbind('p');
		mousetrap.unbind('b');
		mousetrap.unbind('del');

		State.merge({
			category: 'meta',
			content: {
				items: 0
			}
		});
	},
	render: function render() {
		var setting = Setting.get(),
		    font = {
			fontFamily: setting.fontfamily,
			fontSize: setting.fontsize
		};

		return React.createElement(
			'ul',
			null,
			React.createElement(Meta, { feed: this.props.feed }),
			this.props.items.map(function (item, index) {
				var haspin = '';

				if (_.where(this.props.pins, { link: item.link }).length > 0) {
					haspin = ' haspin';
				}

				return React.createElement(
					'li',
					{ id: item.id, className: haspin, key: item.id },
					React.createElement(
						'p',
						{ style: style.title, onClick: this.doOpen.bind(this, index) },
						item.title
					),
					React.createElement(
						'p',
						{ style: style.description },
						React.createElement(
							'span',
							{ style: style.created },
							moment(item.created_on * 1000).fromNow()
						),
						React.createElement(
							'span',
							{ style: style.author },
							'by ',
							item.author
						),
						React.createElement(
							'span',
							{ style: style.category },
							item.category
						)
					),
					React.createElement('div', { style: font, dangerouslySetInnerHTML: { __html: item.body } })
				);
			}, this),
			React.createElement(
				Modal,
				{ isOpen: this.state.modalIsOpen, onRequestClose: this.doClose, style: style.modal },
				React.createElement('webview', { id: 'browser', src: this.state.url, style: style.browser, autosize: 'on' })
			)
		);
	}
});