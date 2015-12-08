var _ = require('lodash'),
	ipc = require('electron').ipcRenderer,
	React = require('react'),
	ReactDnD = require('react-dnd'),
	State = require('../state');

var Feed = React.createClass({
	displayName: 'feed',
	doMouseEnter: function(){
		ipc.emit('feed:mouseenter', this.props.index);
	},
	doMouseLeave: function(){
		ipc.emit('feed:mouseleave', this.props.index);
	},
	doClick: function(){
		ipc.emit('feed:click', this.props.index);
	},
	componentDidMount: function(){
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
	render: function(){
		return this.props.connectDragSource(
			<li style={this.props.font}
				onMouseEnter={this.doMouseEnter}
				onMouseLeave={this.doMouseLeave}
				onClick={this.doClick}>
				<img src={this.props.icon} style={this.props.favicon}/>
				<span className={this.props.feed}>{this.props.title}</span>
				<span className={this.props.badge}>{this.props.unread_count}</span>
			</li>
		);
	}
});

Feed = ReactDnD.DragSource('feed', {
	beginDrag: function(props){
		return {
			subscribe_id: props.subscribe_id,
			folder: props.folder
		};
	}
}, function(connect, monitor){
	return {
		connectDragSource: connect.dragSource(),
		connectDragPreview: connect.dragPreview(),
		isDragging: monitor.isDragging()
	};
})(Feed);

module.exports = Feed;