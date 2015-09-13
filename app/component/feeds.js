'use strict';

var React = require('react'),
    Feed = require('./feed');

module.exports = React.createClass({
	displayName: 'feeds',
	render: function render() {
		return React.createElement(
			'ul',
			null,
			this.props.feeds.map(function (item) {
				return React.createElement(Feed, { key: item.id, feed: item });
			})
		);
	}
});