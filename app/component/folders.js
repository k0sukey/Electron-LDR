'use strict';

var _ = require('lodash'),
    mousetrap = require('mousetrap'),
    remote = require('remote'),
    request = require('request'),
    app = remote.require('app'),
    dialog = remote.require('dialog'),
    ipc = remote.require('ipc'),
    React = require('react'),
    Cookie = require('../cookie'),
    State = require('../state');

module.exports = React.createClass({
	displayName: 'folders',
	getInitialState: function getInitialState() {
		return {
			active: null,
			touch: 0
		};
	},
	doMouseOver: function doMouseOver(index) {
		if (index !== this.state.active) {
			var ul = document.getElementById('folders').children[0];
			React.findDOMNode(ul).childNodes[index].style.opacity = 1.0;
		}
	},
	doMouseOut: function doMouseOut(index) {
		if (index !== this.state.active) {
			var ul = document.getElementById('folders').children[0];
			React.findDOMNode(ul).childNodes[index].style.opacity = 0.4;
		}
	},
	doMouseDown: function doMouseDown(index) {
		this.setState({
			touch: Date.now()
		});
	},
	doMouseUp: function doMouseUp(index) {
		if (Date.now() - this.state.touch < 1000) {
			this.doClick(index);
			return;
		}

		if (index === 0 || index === -1) {
			return;
		}

		dialog.showMessageBox(remote.getCurrentWindow(), {
			type: 'question',
			buttons: ['キャンセル', '削除する'],
			message: '「' + this.props.folders.names[index] + '」フォルダを削除しますか？（中のフィードは削除されません）',
			cancelId: 0
		}, (function (e) {
			if (e === 0) {
				return;
			}

			request.post('http://reader.livedoor.com/api/folders', {
				headers: {
					'User-Agent': remote.getCurrentWindow().useragent,
					Cookie: Cookie.get()
				}
			}, (function (error, response, body) {
				if (error) {
					return;
				}

				var json;

				try {
					json = JSON.parse(body);
				} catch (e) {
					return;
				}

				if (!_.has(json.name2id, this.props.folders.names[index])) {
					return;
				}

				request.post('http://reader.livedoor.com/api/folder/delete', {
					headers: {
						'User-Agent': remote.getCurrentWindow().useragent,
						Cookie: Cookie.get() + '; reader_sid=' + Cookie.parseApiKey(response.headers['set-cookie'])
					},
					form: {
						folder_id: json.name2id[this.props.folders.names[index]]
					}
				}, function (error, response, body) {
					if (error) {
						return;
					}

					ipc.emit('reload');
				});
			}).bind(this));
		}).bind(this));
	},
	doClick: function doClick(index) {
		this.setState({
			active: index
		});

		var me,
		    ul = document.getElementById('folders').children[0];

		_.each(React.findDOMNode(ul).childNodes, function (child, i) {
			if (index === i) {
				me = child;

				child.style.opacity = 1.0;
			} else {
				child.style.opacity = 0.4;
			}
		});

		State.merge({
			category: 'meta',
			content: {
				folder: this.props.folders.names[index]
			}
		});

		ipc.emit('folder');
	},
	componentDidMount: function componentDidMount() {
		var ul = document.getElementById('folders').children[0];

		_.each(React.findDOMNode(ul).childNodes, (function (item, index) {
			var name = '';

			_.each(item.children[0].attributes, function (attribute, i) {
				if (attribute.name === 'data-value') {
					name = attribute.textContent;
				}
			});

			if (this.props.folder === name) {
				this.setState({
					active: index
				});

				item.style.opacity = 1.0;
			}

			if (index < 10) {
				mousetrap.bind(['command+' + (index + 1), 'ctrl' + (index + 1)], (function () {
					this.doClick(index);
				}).bind(this));
			}
		}).bind(this));
	},
	componentWillUnmount: function componentWillUnmount() {
		var ul = document.getElementById('folders').children[0];

		_.each(React.findDOMNode(ul).childNodes, (function (item, index) {
			if (index < 10) {
				mousetrap.unbind(['command+' + (index + 1), 'ctrl' + (index + 1)]);
			}
		}).bind(this));
	},
	render: function render() {
		var setting = Setting.get(),
		    font = {
			fontFamily: setting.fontfamily
		};

		return React.createElement(
			'ul',
			null,
			this.props.folders.names.map(function (item, index) {
				return React.createElement(
					'li',
					{ key: this.props.folders.name2id[item],
						style: font,
						onMouseOver: this.doMouseOver.bind(this, index),
						onMouseOut: this.doMouseOut.bind(this, index),
						onMouseDown: this.doMouseDown.bind(this, index),
						onMouseUp: this.doMouseUp.bind(this, index) },
					React.createElement(
						'p',
						{ 'data-value': item,
							'data-tip': item,
							'data-place': 'right',
							'data-type': 'light',
							'data-effect': 'solid' },
						item.substr(0, 1)
					)
				);
			}, this)
		);
	}
});