var _ = require('lodash'),
	remote = require('remote'),
	request = require('request'),
	ipc = remote.require('ipc'),
	React = require('react'),
	ReactRater = require('react-rater'),
	Cookie = require('../cookie');

var style = {
	wrapper: {
		margin: '20px',
		padding: '20px',
		backgroundColor: '#f7f7f7',
		border: 0,
		borderRadius: '8px'
	},
	title: {
		float: 'left',
		fontSize: '20px'
	},
	uers: {
		clear: 'both'
	}
};

module.exports = React.createClass({
	displayName: 'meta',
	doRating: function(rating){
		request.post('http://reader.livedoor.com/api/subs', {
			headers: {
				'User-Agent': remote.getCurrentWindow().useragent,
				Cookie: Cookie.get()
			}
		}, function(error, response, body){
			if (error) {
				return;
			}

			var json;

			try {
				json = JSON.parse(body);
			} catch (e) {
				return;
			}

			var feeds = _.filter(json, function(item, index){
				return item.subscribe_id === this.props.feed.subscribe_id;
			}.bind(this));

			if (feeds.length === 0) {
				return;
			}

			request.post('http://reader.livedoor.com/api/feed/set_rate', {
				headers: {
					'User-Agent': remote.getCurrentWindow().useragent,
					Cookie: Cookie.get() + '; reader_sid=' + Cookie.parseApiKey(response.headers['set-cookie'])
				},
				form: {
					subscribe_id: this.props.feed.subscribe_id,
					rate: rating
				}
			}, function(error, response, body){
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
					ipc.emit('reload');
				}
			});
		}.bind(this));
	},
	render: function(){
		return (
			<li style={style.wrapper}>
				<p style={style.title}>{this.props.feed.title}</p>
				<ReactRater total={5} rating={this.props.feed.rate} onRate={this.doRating}/>
				<p style={style.uers}>購読者数：{this.props.feed.subscribers_count}ユーザ</p>
			</li>
		);
	}
});