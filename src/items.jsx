var _ = require('lodash'),
	remote = require('remote'),
	request = require('request'),
	React = require('react'),
	Feeds = require('./feeds'),
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
		this.state.active = index;

		_.each(React.findDOMNode(this).childNodes, function(child, i){
			if (index === i) {
				child.style.backgroundColor = '#fffafa';
			} else {
				child.style.backgroundColor = '#ffffff';
			}
		});

		var url = 'http://reader.livedoor.com/api/unread';
		if (this.props.items[index].unread_count === 0) {
			url = 'http://reader.livedoor.com/api/all';
		}

		request.post(url, {
			headers: {
				'Authorization': 'Bearer ' + Token
			},
			form: {
				subscribe_id: this.props.items[index].subscribe_id
			}
		}, function(error, response, body){
			if (error) {
				return;
			}

			React.render(React.createElement(Feeds, {
				feeds: JSON.parse(body).items,
			}), document.querySelector('#feeds'));
		});
	},
	render: function(){
		return (
			<ul>{this.props.items.map(function(item, index){
				return (
					<li key={item.subscribe_id}
						onMouseOver={this.doMouseOver.bind(this, index)}
						onMouseOut={this.doMouseOut.bind(this, index)}
						onClick={this.doClick.bind(this, index)}>
						<img src={item.icon}/> {item.title} ({item.unread_count})
					</li>
				);
			}, this)}</ul>
		);
	}
});