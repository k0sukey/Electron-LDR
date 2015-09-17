var _ = require('lodash'),
	mousetrap = require('mousetrap'),
	remote = require('remote'),
	request = require('request'),
	React = require('react'),
	Cookie = require('../cookie'),
	Items = require('./items');

module.exports = React.createClass({
	displayName: 'items',
	getInitialState: function(){
		return {
			active: null,
			toggle: true
		};
	},
	doMouseOver: function(index){
		if (index !== this.state.active) {
			React.findDOMNode(this).childNodes[index].style.color = '#7fdbff';
			React.findDOMNode(this).childNodes[index].style.backgroundColor = '#001f3f';
		}
	},
	doMouseOut: function(index){
		if (index !== this.state.active) {
			React.findDOMNode(this).childNodes[index].style.color = '#ffffff';
			React.findDOMNode(this).childNodes[index].style.backgroundColor = 'transparent';
		}
	},
	doClick: function(index){
		this.setState({
			active: index
		});

		var me;

		_.each(React.findDOMNode(this).childNodes, function(child, i){
			if (index === i) {
				me = child;

				child.style.color = '#7fdbff';
				child.style.backgroundColor = '#001f3f';
			} else {
				child.style.color = '#ffffff';
				child.style.backgroundColor = 'transparent';
			}
		});

		var url = 'http://reader.livedoor.com/api/unread',
			that = this;

		if (parseInt(me.children[3].textContent, 10) === 0) {
			url = 'http://reader.livedoor.com/api/all';
		}

		request.post(url, {
			headers: {
				'User-Agent': remote.getCurrentWindow().useragent,
				Cookie: Cookie.get()
			},
			form: {
				subscribe_id: this.props.feeds[index].subscribe_id
			}
		}, function(error, response, body){
			if (error) {
				return;
			}

			React.unmountComponentAtNode(document.querySelector('#items'));

			var json;
			try {
				React.render(React.createElement(Items, {
					items: JSON.parse(body).items,
				}), document.querySelector('#items'));

				me.children[3].textContent = 0;

				request.post('http://reader.livedoor.com/api/touch_all', {
					headers: {
						'User-Agent': remote.getCurrentWindow().useragent,
						Cookie: Cookie.get() + '; reader_sid=' + Cookie.parseApiKey(response.headers['set-cookie'])
					},
					form: {
						subscribe_id: that.props.feeds[index].subscribe_id
					}
				}, function(error, response, body){});
			} catch (e) {}
		});
	},
	doPrev: function(){
		var index = _.isNull(this.state.active) ? 0 : this.state.active - 1;
		if (index < 0) {
			index = 0;
		}

		this.doClick(index);
	},
	doNext: function(){
		var index = _.isNull(this.state.active) ? 0 : this.state.active + 1;
		if (index >= this.props.feeds.length) {
			index = this.props.feeds.length - 1;
		}

		this.doClick(index);
	},
	doToggle: function(){
		document.getElementById('feeds').style.display = this.state.toggle ? 'none' : 'block';
		document.getElementById('items').style.paddingLeft = this.state.toggle ? '20px' : '260px';
		this.setState({
			toggle: !this.state.toggle
		});
	},
	componentDidMount: function(){
		mousetrap.bind('a', this.doPrev);
		mousetrap.bind('s', this.doNext);
		mousetrap.bind('z', this.doToggle);
	},
	componentWillUnmount: function(){
		mousetrap.unbind('a');
		mousetrap.unbind('s');
		mousetrap.unbind('z');
	},
	render: function(){
		return (
			<ul>{this.props.feeds.map(function(item, index){
					return (
						<li key={item.subscribe_id}
							onMouseOver={this.doMouseOver.bind(this, index)}
							onMouseOut={this.doMouseOut.bind(this, index)}
							onClick={this.doClick.bind(this, index)}>
							<img src={item.icon}/>{item.title}（<span>{item.unread_count}</span>）
						</li>
					);
				}, this)}
			</ul>
		);
	}
});