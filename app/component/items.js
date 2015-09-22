'use strict';

var _ = require('lodash'),
    moment = require('moment'),
    mousetrap = require('mousetrap'),
    remote = require('remote'),
    request = require('request'),
    React = require('react'),
    Modal = require('react-modal'),
    Cookie = require('../cookie');

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
	browser: {
		display: 'inline-block',
		width: '100%',
		height: '100%'
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
	doPinning: function doPinning() {
		var index = _.isNull(this.state.active) ? 0 : this.state.active,
		    item = this.props.items[index];

		request.post('http://reader.livedoor.com/api/pin/all', {
			headers: {
				'User-Agent': remote.getCurrentWindow().useragent,
				Cookie: Cookie.get()
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
					'User-Agent': remote.getCurrentWindow().useragent,
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
					} else {
						document.getElementById(item.id).classList.add('haspin');
					}
				}
			});
		});
	},
	componentDidMount: function componentDidMount() {
		mousetrap.bind('k', this.doPrev);
		mousetrap.bind('j', this.doNext);
		mousetrap.bind('v', this.doToggle);
		mousetrap.bind('p', this.doPinning);

		if (this.props.items[0]) {
			document.getElementById(this.props.items[0].id).scrollIntoView();
			this.setState({
				active: 0
			});
		}
	},
	componentWillUnmount: function componentWillUnmount() {
		mousetrap.unbind('k');
		mousetrap.unbind('j');
		mousetrap.unbind('v');
		mousetrap.unbind('p');
	},
	render: function render() {
		return React.createElement(
			'ul',
			null,
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
					React.createElement('div', { dangerouslySetInnerHTML: { __html: item.body } })
				);
			}, this),
			React.createElement(
				Modal,
				{ isOpen: this.state.modalIsOpen },
				React.createElement('webview', { src: this.state.url, style: style.browser, autosize: 'on' })
			)
		);
	}
});