var _ = require('lodash'),
	remote = require('remote'),
	app = remote.require('app'),
	ipc = remote.require('ipc'),
	React = require('react'),
	State = require('../state');

module.exports = React.createClass({
	displayName: 'folders',
	getInitialState: function(){
		return {
			active: null
		};
	},
	doMouseOver: function(index){
		if (index !== this.state.active) {
			var ul = document.getElementById('folders').children[0];
			React.findDOMNode(ul).childNodes[index].style.opacity = 1.0;
		}
	},
	doMouseOut: function(index){
		if (index !== this.state.active) {
			var ul = document.getElementById('folders').children[0];
			React.findDOMNode(ul).childNodes[index].style.opacity = 0.4;
		}
	},
	doClick: function(index){
		this.setState({
			active: index
		});

		var me,
			ul = document.getElementById('folders').children[0];

		_.each(React.findDOMNode(ul).childNodes, function(child, i){
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
	componentDidMount: function(){
		var ul = document.getElementById('folders').children[0];

		_.each(React.findDOMNode(ul).childNodes, function(item, index){
			var name = '';

			_.each(item.children[0].attributes, function(attribute, i){
				if (attribute.name === 'value') {
					name = attribute.textContent;
				}
			});

			if (this.props.folder === name) {
				this.setState({
					active: index
				});

				item.style.opacity = 1.0;
			}
		}.bind(this));
	},
	render: function(){
		return (
			<ul>{this.props.folders.names.map(function(item, index){
					return (
						<li key={this.props.folders.name2id[item]}
							onMouseOver={this.doMouseOver.bind(this, index)}
							onMouseOut={this.doMouseOut.bind(this, index)}
							onClick={this.doClick.bind(this, index)}>
							<p value={item}>{item.substr(0, 1)}</p>
						</li>
					);
				}, this)}
			</ul>
		);
	}
});