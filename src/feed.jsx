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
	getInitialState: function() {
		return {
			modalIsOpen: false
		};
	},
	doOpen: function(){
		this.setState({
			modalIsOpen: true
		});
	},
	doClose: function(){
		this.setState({
			modalIsOpen: false
		});
	},
	render: function(){
		return (
			<li id={this.props.feed.id}><p style={style.title} onClick={this.doOpen}>{this.props.feed.title}</p>
				<div dangerouslySetInnerHTML={{__html: this.props.feed.body}}/>
				<Modal isOpen={this.state.modalIsOpen}>
					<div style={style.close}><button onClick={this.doClose}>閉じる</button></div>
					<iframe src={this.props.feed.link}></iframe>
				</Modal></li>
		);
	}
});