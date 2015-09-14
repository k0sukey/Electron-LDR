var _ = require('lodash'),
	mousetrap = require('mousetrap'),
	React = require('react'),
	Modal = require('react-modal');

var style = {
	title: {
		marginBottom: '10px',
		fontWeight: 'bold',
		cursor: 'pointer'
	},
	close: {
		float: 'right'
	},
	browser: {
		width: '100%',
		height: '90%',
	}
};

Modal.setAppElement(document.getElementById('modal'));
Modal.injectCSS();

module.exports = React.createClass({
	displayName: 'feeds',
	getInitialState: function() {
		return {
			modalIsOpen: false,
			active: null,
			url: ''
		};
	},
	doOpen: function(index){
		this.setState({
			modalIsOpen: true,
			url: this.props.items[index].link
		});
	},
	doClose: function(){
		this.setState({
			modalIsOpen: false
		});
	},
	doPrev: function(){
		var index = _.isNull(this.state.active) ? 0 : this.state.active - 1;
		if (index < 0) {
			index = 0;
		}

		document.getElementById(this.props.items[index].id).scrollIntoView();
		this.setState({
			active: index
		});
	},
	doNext: function(){
		var index = _.isNull(this.state.active) ? 0 : this.state.active + 1;
		if (index >= this.props.items.length) {
			index = this.props.items.length - 1;
		}

		document.getElementById(this.props.items[index].id).scrollIntoView();
		this.setState({
			active: index
		});
	},
	doBrower: function(){
		this.doOpen(_.isNull(this.state.active) ? 0 : this.state.active);
	},
	render: function(){
		mousetrap.bind('k', this.doPrev);
		mousetrap.bind('j', this.doNext);
		mousetrap.bind('v', this.doBrower);
		mousetrap.bind('n', this.doClose);

		return (
			<ul>{this.props.items.map(function(item, index){
					return (
						<li id={item.id} key={item.id}>
							<p style={style.title} onClick={this.doOpen.bind(this, index)}>{item.title}</p>
							<div dangerouslySetInnerHTML={{__html: item.body}}/>
						</li>
					);
				}, this)}
				<Modal isOpen={this.state.modalIsOpen}>
					<div style={style.close}><button onClick={this.doClose}>閉じる</button></div>
					<webview src={this.state.url} style={style.browser}></webview>
				</Modal>
			</ul>
		);
	}
});