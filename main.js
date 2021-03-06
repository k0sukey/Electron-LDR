var _ = require('lodash'),
	electron = require('electron'),
	fs = require('fs'),
	path = require('path'),
	request = require('request'),
	Menu = require('menu'),
	Cookie = require('./app/cookie'),
	State = require('./app/state');

var app = electron.app,
	ipc = electron.ipcMain,
	shell = electron.shell,
	BrowserWindow = electron.BrowserWindow;

require('crash-reporter').start();

ipc.setMaxListeners(Infinity);

require('./app/setting').initialize();

var window = null,
	splash = null,
	about = null,
	setting = null,
	template = [
			{
				label: app.getName(),
				submenu: [
					{
						label: app.getName() + ' について',
						click: function(){
							if (!_.isNull(about)) {
								return;
							}

							about = new BrowserWindow({
								title: app.getName() + ' について',
								width: 640,
								height: 480,
								resizable: false
							});

							about.on('closed', function(){
								about = null;
							});

							about.loadURL('file://' + path.join(__dirname, 'app', 'html', 'about.html'));
						}
					},
					{
						type: 'separator'
					},
					{
						label: '環境設定...',
						accelerator: 'Cmd+,',
						click: function(){
							if (!_.isNull(setting)) {
								return;
							}

							setting = new BrowserWindow({
								title: '環境設定',
								width: 640,
								height: 600,
								resizable: false,
								'always-on-top': true
							});

							setting.on('closed', function(){
								setting = null;
							});

							setting.loadURL('file://' + path.join(__dirname, 'app', 'html', 'setting.html'));
						}
					},
					{
						type: 'separator'
					},
					{
						label: 'ピンをすべて削除する',
						click: function(){
							if (!window || !Cookie.exists) {
								return;
							}

							request.post('http://reader.livedoor.com/api/pin/all', {
								headers: {
									'User-Agent': window.webContents.getUserAgent(),
									Cookie: Cookie.get()
								}
							}, function(error, response, body){
								if (error) {
									return;
								}

								request.post('http://reader.livedoor.com/api/pin/clear', {
									headers: {
										'User-Agent': window.webContents.getUserAgent(),
										Cookie: Cookie.get() + '; reader_sid=' + Cookie.parseApiKey(response.headers['set-cookie'])
									}
								}, function(error, response, body){
									if (error) {
										return;
									}

									State.merge({
										category: 'meta',
										content: {
											pins: []
										}
									});
								});
							});
						}
					},
					{
						label: 'ログアウト',
						click: function(){
							ipc.removeAllListeners('feed:mouseenter');
							ipc.removeAllListeners('feed:mouseleave');
							ipc.removeAllListeners('feed:click');
							ipc.removeAllListeners('feed:active');
							ipc.removeAllListeners('folder:mouseenter');
							ipc.removeAllListeners('folder:mouseleave');
							ipc.removeAllListeners('folder:mousedown');
							ipc.removeAllListeners('folder:mouseup');
							ipc.removeAllListeners('folders');
							ipc.removeAllListeners('setting');
							ipc.removeAllListeners('reload');

							State.destroy({ category: 'meta' });
							State.destroy({ category: 'folders' });
							State.destroy({ category: 'feeds' });
							State.destroy({ category: 'items' });

							Cookie.clear();
							app.emit('ready');
						}
					},
					{
						type: 'separator'
					},
					{
						label: app.getName() + ' を終了',
						accelerator: 'Cmd+Q',
						click: function(){
							app.quit();
						}
					}
				]
			},
			{
				label: '編集',
				submenu: [
					{
						label: '取り消す',
						accelerator: 'CmdOrCtrl+Z',
						role: 'undo'
					},
					{
						label: 'やり直す',
						accelerator: 'Shift+CmdOrCtrl+Z',
						role: 'redo'
					},
					{
						type: 'separator'
					},
					{
						label: '切り取り',
						accelerator: 'CmdOrCtrl+X',
						role: 'cut'
					},
					{
						label: 'コピー',
						accelerator: 'CmdOrCtrl+C',
						role: 'copy'
					},
					{
						label: '貼り付け',
						accelerator: 'CmdOrCtrl+V',
						role: 'paste'
					},
					{
						label: 'すべてを選択',
						accelerator: 'CmdOrCtrl+A',
						role: 'selectall'
					},
				]
			},
			{
				label: '表示',
				submenu: [
					{
						label: '全画面表示にする',
						accelerator: (function(){
							if (process.platform === 'darwin') {
								return 'Ctrl+Command+F';
							} else {
								return 'F11';
							}
						})(),
						click: function(){
							if (window) {
								window.setFullScreen(!window.isFullScreen());
							}
						}
					}
				]
			},
			{
				label: 'ウィンドウ',
				role: 'window',
				submenu: [
					{
						label: '最小化',
						accelerator: 'CmdOrCtrl+M',
						role: 'minimize'
					}
				]
			},
			{
				label: 'ヘルプ',
				role: 'help',
				submenu: [
					{
						label: '問題の報告...',
						click: function(){
							shell.openExternal('https://github.com/k0sukey/Electron-LDR/issues');
						}
					},
					{
						label: 'キーボードショートカット',
						click: function(){
							if (window) {
								window.emit('shortcut');
							}
						}
					}
				]
			}
		],
	menu = Menu.buildFromTemplate(template);

app.on('window-all-closed', function(){
	app.quit();
});

app.on('ready', function(){
	Menu.setApplicationMenu(menu);

	splash = new BrowserWindow({
		title: app.getName(),
		width: 640,
		height: 480,
		frame: false,
		transparent: true,
		resizable: false
	});

	splash.on('closed', function(){
		splash = null;
	});

	splash.on('authorized', function(){
		window = new BrowserWindow({
			title: app.getName(),
			width: 1024,
			height: 768,
			'title-bar-style': 'hidden-inset'
		});

		window.webContents.once('did-finish-load', function(){
			splash.close();
		});

		window.on('closed', function(){
			window = null;
		});

		window.loadURL('file://' + path.join(__dirname, 'app', 'html', 'index.html'));
	});

	splash.webContents.once('did-finish-load', function(){
		if (window) {
			window.close();
		}
	});

	splash.loadURL('file://' + path.join(__dirname, 'app', 'html', 'authorize.html'));
});