'use strict';

var Modal = require('react-modal'),
    React = require('react');

var style = {
	title: {
		marginBottom: '10px',
		fontWeight: 'bold',
		cursor: 'pointer'
	},
	close: {
		float: 'right'
	}
};

Modal.setAppElement(document.getElementById('modal'));
Modal.injectCSS();

module.exports = React.createClass({
	displayName: 'feed',
	getInitialState: function getInitialState() {
		return {
			modalIsOpen: false
		};
	},
	doOpen: function doOpen() {
		this.setState({
			modalIsOpen: true
		});
	},
	doClose: function doClose() {
		this.setState({
			modalIsOpen: false
		});
	},
	render: function render() {
		return React.createElement(
			'li',
			{ id: this.props.feed.id },
			React.createElement(
				'p',
				{ style: style.title, onClick: this.doOpen },
				this.props.feed.title
			),
			React.createElement('div', { dangerouslySetInnerHTML: { __html: this.props.feed.body } }),
			React.createElement(
				Modal,
				{ isOpen: this.state.modalIsOpen },
				React.createElement(
					'div',
					{ style: style.close },
					React.createElement(
						'button',
						{ onClick: this.doClose },
						'閉じる'
					)
				),
				React.createElement('iframe', { src: this.props.feed.link })
			)
		);
	}
});