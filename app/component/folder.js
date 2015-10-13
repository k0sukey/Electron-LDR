'use strict';

var _ = require('lodash'),
    remote = require('remote'),
    request = require('request'),
    ipc = remote.require('ipc'),
    React = require('react'),
    ReactDnD = require('react-dnd'),
    Cookie = require('../cookie');

var Folder = React.createClass({
	displayName: 'folder',
	doMouseEnter: function doMouseEnter() {
		ipc.emit('folder:mouseenter', this.props.index);
	},
	doMouseLeave: function doMouseLeave() {
		ipc.emit('folder:mouseleave', this.props.index);
	},
	onMouseDown: function onMouseDown() {
		ipc.emit('folder:mousedown', this.props.index);
	},
	onMouseUp: function onMouseUp() {
		ipc.emit('folder:mouseup', this.props.index);
	},
	render: function render() {
		return this.props.connectDropTarget(React.createElement(
			'li',
			{ style: this.props.style,
				onMouseEnter: this.doMouseEnter,
				onMouseLeave: this.doMouseLeave,
				onMouseDown: this.onMouseDown,
				onMouseUp: this.onMouseUp },
			React.createElement(
				'p',
				{ 'data-value': this.props.name,
					'data-tip': this.props.name,
					'data-place': 'right',
					'data-type': 'light',
					'data-effect': 'solid' },
				this.props.name.substr(0, 1)
			)
		));
	}
});

Folder = ReactDnD.DropTarget('feed', {
	canDrop: function canDrop(props, monitor) {
		return props.name === '全て' || monitor.getItem().folder !== props.name;
	},
	drop: function drop(props, monitor) {
		var to = props.name;

		if (to === '未分類') {
			to = '';
		}

		var subscribe_id = monitor.getItem().subscribe_id;

		request.post('http://reader.livedoor.com/api/folders', {
			headers: {
				'User-Agent': remote.getCurrentWindow().useragent,
				Cookie: Cookie.get()
			}
		}, function (error, response, body) {
			if (error) {
				return;
			}

			var folders;

			try {
				folders = JSON.parse(body);
			} catch (e) {
				return;
			}

			if (to !== '' && !_.has(folders.name2id, to)) {
				return;
			}

			request.post('http://reader.livedoor.com/api/feed/move', {
				headers: {
					'User-Agent': remote.getCurrentWindow().useragent,
					Cookie: Cookie.get() + '; reader_sid=' + Cookie.parseApiKey(response.headers['set-cookie'])
				},
				form: {
					subscribe_id: subscribe_id,
					to: to
				}
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
					ipc.emit('reload');
				}
			});
		});

		return;
	}
}, function (connect) {
	return {
		connectDropTarget: connect.dropTarget()
	};
})(Folder);

module.exports = Folder;