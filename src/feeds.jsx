var React = require('react'),
	Feed = require('./feed');

module.exports = React.createClass({
	displayName: 'feeds',
	render: function(){
		return (
			<ul>{this.props.feeds.map(function(item){
				return <Feed key={item.id} feed={item}/>
			})}</ul>
		);
	}
});