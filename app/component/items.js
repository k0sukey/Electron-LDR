'use strict';

var _ = require('lodash'),
    moment = require('moment'),
    mousetrap = require('mousetrap'),
    React = require('react'),
    Modal = require('react-modal');

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
	close: {
		float: 'right'
	},
	browser: {
		width: '100%',
		height: '90%'
	}
};

Modal.setAppElement(document.getElementById('modal'));
Modal.injectCSS();

module.exports = React.createClass({
	displayName: 'feeds',
	getInitialState: function getInitialState() {
		return {
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
	},
	doClose: function doClose() {
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
	},
	doToggle: function doToggle() {
		if (this.state.modalIsOpen) {
			this.doClose();
		} else {
			this.doOpen(_.isNull(this.state.active) ? 0 : this.state.active);
		}
	},
	render: function render() {
		mousetrap.bind('k', this.doPrev);
		mousetrap.bind('j', this.doNext);
		mousetrap.bind('v', this.doToggle);

		return React.createElement(
			'ul',
			null,
			this.props.items.map(function (item, index) {
				return React.createElement(
					'li',
					{ id: item.id, key: item.id },
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
					React.createElement('div', { dangerouslySetInnerHTML: { __html: item.body } })
				);
			}, this),
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
				React.createElement('webview', { src: this.state.url, style: style.browser })
			)
		);
	}
});