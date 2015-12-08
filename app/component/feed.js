'use strict';

var _ = require('lodash'),
    ipc = require('electron').ipcRenderer,
    React = require('react'),
    ReactDnD = require('react-dnd'),
    State = require('../state');

var Feed = React.createClass({
	displayName: 'feed',
	doMouseEnter: function doMouseEnter() {
		ipc.emit('feed:mouseenter', this.props.index);
	},
	doMouseLeave: function doMouseLeave() {
		ipc.emit('feed:mouseleave', this.props.index);
	},
	doClick: function doClick() {
		ipc.emit('feed:click', this.props.index);
	},
	componentDidMount: function componentDidMount() {
		if (State.exists({ category: 'meta' })) {
			var meta = State.load({
				category: 'meta'
			});

			if (this.props.subscribe_id === meta.subscribe_id) {
				React.findDOMNode(this).style.color = '#7fdbff';
				React.findDOMNode(this).style.backgroundColor = '#001f3f';

				ipc.emit('feed:active', this.props.index);
			}
		}
	},
	render: function render() {
		return this.props.connectDragSource(React.createElement(
			'li',
			{ style: this.props.font,
				onMouseEnter: this.doMouseEnter,
				onMouseLeave: this.doMouseLeave,
				onClick: this.doClick },
			React.createElement('img', { src: this.props.icon, style: this.props.favicon }),
			React.createElement(
				'span',
				{ className: this.props.feed },
				this.props.title
			),
			React.createElement(
				'span',
				{ className: this.props.badge },
				this.props.unread_count
			)
		));
	}
});

Feed = ReactDnD.DragSource('feed', {
	beginDrag: function beginDrag(props) {
		return {
			subscribe_id: props.subscribe_id,
			folder: props.folder
		};
	}
}, function (connect, monitor) {
	return {
		connectDragSource: connect.dragSource(),
		connectDragPreview: connect.dragPreview(),
		isDragging: monitor.isDragging()
	};
})(Feed);

module.exports = Feed;