var _ = require('lodash'),
	moment = require('moment'),
	mousetrap = require('mousetrap'),
	remote = require('remote'),
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
		display: 'inline-block',
		width: '100%',
		height: '100%'
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

		remote.getCurrentWindow().focusOnWebView();
	},
	doClose: function(){
		remote.getCurrentWindow().blurWebView();

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
	doToggle: function(){
		if (this.state.modalIsOpen) {
			this.doClose();
		} else {
			this.doOpen(_.isNull(this.state.active) ? 0 : this.state.active);
		}
	},
	componentDidMount: function(){
		mousetrap.bind('k', this.doPrev);
		mousetrap.bind('j', this.doNext);
		mousetrap.bind('v', this.doToggle);

		if (this.props.items[0]) {
			document.getElementById(this.props.items[0].id).scrollIntoView();
			this.setState({
				active: 0
			});
		}
	},
	componentWillUnmount: function(){
		mousetrap.unbind('k');
		mousetrap.unbind('j');
		mousetrap.unbind('v');
	},
	render: function(){
		return (
			<ul>{this.props.items.map(function(item, index){
					return (
						<li id={item.id} key={item.id}>
							<p style={style.title} onClick={this.doOpen.bind(this, index)}>{item.title}</p>
							<p style={style.description}>
								<span style={style.created}>{(moment(item.created_on * 1000).fromNow())}</span>
								<span style={style.author}>by {item.author}</span>
								<span style={style.category}>{item.category}</span>
							</p>
							<div dangerouslySetInnerHTML={{__html: item.body}}/>
						</li>
					);
				}, this)}
				<Modal isOpen={this.state.modalIsOpen}>
					<webview src={this.state.url} style={style.browser} autosize="on"></webview>
				</Modal>
			</ul>
		);
	}
});