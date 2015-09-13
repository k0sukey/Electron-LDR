'use strict';

var React = require('react');

module.exports = React.createClass({
	displayName: 'item',
	render: function render() {
		return React.createElement(
			'li',
			null,
			React.createElement('img', { src: this.props.feed.icon }),
			this.props.feed.title,
			' (',
			this.props.feed.unread_count,
			')'
		);
	}
});