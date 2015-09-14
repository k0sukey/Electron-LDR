var _ = require('lodash'),
	mousetrap = require('mousetrap'),
	remote = require('remote'),
	request = require('request'),
	React = require('react'),
	Items = require('./items'),
	Token = remote.getCurrentWindow().token;

module.exports = React.createClass({
	displayName: 'items',
	getInitialState: function(){
		return {
			active: null
		};
	},
	doMouseOver: function(index){
		if (index !== this.state.active) {
			React.findDOMNode(this).childNodes[index].style.backgroundColor = '#fafafa';
		}
	},
	doMouseOut: function(index){
		if (index !== this.state.active) {
			React.findDOMNode(this).childNodes[index].style.backgroundColor = '#ffffff';
		}
	},
	doClick: function(index){
		this.setState({
			active: index
		});

		_.each(React.findDOMNode(this).childNodes, function(child, i){
			if (index === i) {
				child.style.backgroundColor = '#fffafa';
			} else {
				child.style.backgroundColor = '#ffffff';
			}
		});

		var url = 'http://reader.livedoor.com/api/unread';
		if (this.props.feeds[index].unread_count === 0) {
			url = 'http://reader.livedoor.com/api/all';
		}

		request.post(url, {
			headers: {
				'Authorization': 'Bearer ' + Token
			},
			form: {
				subscribe_id: this.props.feeds[index].subscribe_id
			}
		}, function(error, response, body){
			if (error) {
				return;
			}

			var json;
			try {
				React.render(React.createElement(Items, {
					items: JSON.parse(body).items,
				}), document.querySelector('#items'));
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
	render: function(){
		mousetrap.bind('a', this.doPrev);
		mousetrap.bind('s', this.doNext);

		return (
			<ul>{this.props.feeds.map(function(item, index){
					return (
						<li key={item.subscribe_id}
							onMouseOver={this.doMouseOver.bind(this, index)}
							onMouseOut={this.doMouseOut.bind(this, index)}
							onClick={this.doClick.bind(this, index)}>
							<img src={item.icon}/> {item.title} ({item.unread_count})
						</li>
					);
				}, this)}
			</ul>
		);
	}
});