'use strict';

var _ = require('lodash'),
    remote = require('remote'),
    app = remote.require('app'),
    ipc = remote.require('ipc'),
    React = require('react'),
    ReactTooltip = require('react-tooltip'),
    State = require('../state');

module.exports = React.createClass({
	displayName: 'folders',
	getInitialState: function getInitialState() {
		return {
			active: null
		};
	},
	doMouseOver: function doMouseOver(index) {
		if (index !== this.state.active) {
			var ul = document.getElementById('folders').children[0].children[0];
			React.findDOMNode(ul).childNodes[index].style.opacity = 1.0;
		}
	},
	doMouseOut: function doMouseOut(index) {
		if (index !== this.state.active) {
			var ul = document.getElementById('folders').children[0].children[0];
			React.findDOMNode(ul).childNodes[index].style.opacity = 0.4;
		}
	},
	doClick: function doClick(index) {
		this.setState({
			active: index
		});

		var me,
		    ul = document.getElementById('folders').children[0].children[0];

		_.each(React.findDOMNode(ul).childNodes, function (child, i) {
			if (index === i) {
				me = child;

				child.style.opacity = 1.0;
			} else {
				child.style.opacity = 0.4;
			}
		});

		var name = this.props.folders.names[index];

		State.merge({
			category: 'meta',
			content: {
				folder: name
			}
		});

		ipc.emit('folder');
	},
	componentDidMount: function componentDidMount() {
		var ul = document.getElementById('folders').children[0].children[0];

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
		}).bind(this));
	},
	render: function render() {
		return React.createElement(
			'div',
			null,
			React.createElement(
				'ul',
				null,
				this.props.folders.names.map(function (item, index) {
					return React.createElement(
						'li',
						{ key: this.props.folders.name2id[item],
							onMouseOver: this.doMouseOver.bind(this, index),
							onMouseOut: this.doMouseOut.bind(this, index),
							onClick: this.doClick.bind(this, index) },
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
			),
			React.createElement(ReactTooltip, null)
		);
	}
});