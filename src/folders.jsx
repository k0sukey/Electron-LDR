var _ = require('lodash'),
	electron = require('electron'),
	mousetrap = require('mousetrap'),
	request = require('request'),
	React = require('react'),
	Cookie = require('../cookie'),
	State = require('../state'),
	Folder = require('./folder');

var ipc = electron.ipcRenderer,
	remote = electron.remote;

var dialog = remote.dialog;

module.exports = React.createClass({
	displayName: 'folders',
	getInitialState: function(){
		return {
			active: null,
			touch: 0
		};
	},
	doMouseEnter: function(index){
		if (index !== this.state.active) {
			var ul = document.getElementById('folders').children[0];
			React.findDOMNode(ul).childNodes[index].style.backgroundColor = 'rgba(255, 255, 255, 1)';
		}
	},
	doMouseLeave: function(index){
		if (index !== this.state.active) {
			var ul = document.getElementById('folders').children[0];
			React.findDOMNode(ul).childNodes[index].style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
		}
	},
	doMouseDown: function(index){
		this.setState({
			touch: Date.now()
		});
	},
	doMouseUp: function(index){
		if (Date.now() - this.state.touch < 1000) {
			this.doClick(index);
			return;
		}

		if (index === 0 || index === -1) {
			return;
		}

		dialog.showMessageBox(remote.getCurrentWindow(), {
			type: 'question',
			buttons: ['キャンセル', '削除する'],
			message: '「' + this.props.folders.names[index] + '」フォルダを削除しますか？（中のフィードは削除されません）',
			cancelId: 0
		}, (function (e) {
			if (e === 0) {
				return;
			}

			request.post('http://reader.livedoor.com/api/folders', {
				headers: {
					'User-Agent': remote.getCurrentWindow().webContents.getUserAgent(),
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

				if (!_.has(json.name2id, this.props.folders.names[index])) {
					return;
				}

				request.post('http://reader.livedoor.com/api/folder/delete', {
					headers: {
						'User-Agent': remote.getCurrentWindow().webContents.getUserAgent(),
						Cookie: Cookie.get() + '; reader_sid=' + Cookie.parseApiKey(response.headers['set-cookie'])
					},
					form: {
						folder_id: json.name2id[this.props.folders.names[index]]
					}
				}, function(error, response, body){
					if (error) {
						return;
					}

					ipc.emit('reload');
				});
			}.bind(this));
		}).bind(this));
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

				child.style.backgroundColor = 'rgba(255, 255, 255, 1)';
			} else {
				child.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
			}
		});

		State.merge({
			category: 'meta',
			content: {
				folder: this.props.folders.names[index]
			}
		});

		ipc.emit('folders');
	},
	componentWillReceiveProps: function(props){
		ipc.on('folder:mouseenter', this.doMouseEnter);
		ipc.on('folder:mouseleave', this.doMouseLeave);
		ipc.on('folder:mousedown', this.doMouseDown);
		ipc.on('folder:mouseup', this.doMouseUp);

		_.each(props.folders.names, function(item, index){
			if (item === props.folder) {
				this.setState({
					active: index
				});
			}
		}.bind(this));
	},
	componentWillUnmount: function(){
		ipc.removeListener('folder:mouseenter', this.doMouseEnter);
		ipc.removeListener('folder:mouseleave', this.doMouseLeave);
		ipc.removeListener('folder:mousedown', this.doMouseDown);
		ipc.removeListener('folder:mouseup', this.doMouseUp);

		var ul = document.getElementById('folders').children[0];

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
		var setting = Setting.get();

		return (
			<ul>{this.props.folders.names.map(function(item, index){
					var style = {
						fontFamily: setting.fontfamily
					}

					if (this.props.folder === item) {
						style.backgroundColor = 'rgba(255, 255, 255, 1)';
					}

					if (index < 10) {
						mousetrap.bind([
							'command+' + (index + 1),
							'ctrl' + (index + 1)
						], function(){
							this.doClick(index);
						}.bind(this));
					}

					return (
						<Folder key={this.props.folders.name2id[item]}
							folder_id={this.props.folders.name2id[item]}
							index={index}
							style={style}
							name={item}/>
					);
				}, this)}
			</ul>
		);
	}
});