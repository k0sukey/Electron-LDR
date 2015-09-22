var _ = require('lodash'),
	app = require('app'),
	fs = require('fs'),
	path = require('path'),
	request = require('request'),
	BrowserWindow = require('browser-window'),
	Menu = require('menu'),
	Cookie = require('./app/cookie');

require('crash-reporter').start();

var window = null,
	splash = null,
	about = null,
	template = [
			{
				label: app.getName(),
				submenu: [
					{
						label: app.getName() + ' について',
						click: function(){
							about = new BrowserWindow({
								title: app.getName() + '　について',
								width: 640,
								height: 480,
								resizable: false
							});

							about.on('closed', function(){
								about = null;
							});

							about.loadUrl('file://' + path.join(__dirname, 'app', 'html', 'about.html'));
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
									'User-Agent': window.useragent,
									Cookie: Cookie.get()
								}
							}, function(error, response, body){
								if (error) {
									return;
								}

								request.post('http://reader.livedoor.com/api/pin/clear', {
									headers: {
										'User-Agent': window.useragent,
										Cookie: Cookie.get() + '; reader_sid=' + Cookie.parseApiKey(response.headers['set-cookie'])
									}
								}, function(error, response, body){});
							});
						}
					},
					{
						label: 'ログアウト',
						click: function(){
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
			height: 768
		});

		window.useragent = app.getName() + '@' + app.getVersion();

		window.on('closed', function(){
			window = null;
		});

		window.loadUrl('file://' + path.join(__dirname, 'app', 'html', 'index.html'));

		splash.close();
	});

	splash.webContents.once('did-finish-load', function(){
		if (window) {
			window.close();
		}
	});

	splash.loadUrl('file://' + path.join(__dirname, 'app', 'html', 'authorize.html'));
});