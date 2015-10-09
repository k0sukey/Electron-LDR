var _ = require('lodash'),
	mousetrap = require('mousetrap'),
	remote = require('remote'),
	app = remote.require('app'),
	ipc = remote.require('ipc'),
	React = require('react'),
	ReactTooltip = require('react-tooltip'),
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
			var ul = document.getElementById('folders').children[0].children[0];
			React.findDOMNode(ul).childNodes[index].style.opacity = 1.0;
		}
	},
	doMouseOut: function(index){
		if (index !== this.state.active) {
			var ul = document.getElementById('folders').children[0].children[0];
			React.findDOMNode(ul).childNodes[index].style.opacity = 0.4;
		}
	},
	doClick: function(index){
		this.setState({
			active: index
		});

		var me,
			ul = document.getElementById('folders').children[0].children[0];

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
		var ul = document.getElementById('folders').children[0].children[0];

		_.each(React.findDOMNode(ul).childNodes, function(item, index){
			var name = '';

			_.each(item.children[0].attributes, function(attribute, i){
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

			if (index < 10) {
				mousetrap.bind([
					'command+' + (index + 1),
					'ctrl' + (index + 1)
				], function(){
					this.doClick(index);
				}.bind(this));
			}
		}.bind(this));
	},
	componentWillUnmount: function(){
		var ul = document.getElementById('folders').children[0].children[0];

		_.each(React.findDOMNode(ul).childNodes, function(item, index){
			if (index < 10) {
				mousetrap.unbind([
					'command+' + (index + 1),
					'ctrl' + (index + 1)
				]);
			}
		}.bind(this));
	},
	render: function(){
		var setting = Setting.get(),
			font = {
				fontFamily: setting.fontfamily
			};

		return (
			<div>
				<ul>{this.props.folders.names.map(function(item, index){
						return (
							<li key={this.props.folders.name2id[item]}
								style={font}
								onMouseOver={this.doMouseOver.bind(this, index)}
								onMouseOut={this.doMouseOut.bind(this, index)}
								onClick={this.doClick.bind(this, index)}>
								<p data-value={item}
									data-tip={item}
									data-place='right'
									data-type='light'
									data-effect='solid'>{item.substr(0, 1)}</p>
							</li>
						);
					}, this)}
				</ul>
				<ReactTooltip/>
			</div>
		);
	}
});