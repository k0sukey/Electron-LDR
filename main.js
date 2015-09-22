var _ = require('lodash'),
	app = require('app'),
	fs = require('fs'),
	path = require('path'),
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

		setTimeout(function(){
			if (Cookie.exists()) {
				var cookies = Cookie.get();

				if (cookies === '') {
					splash.loadUrl('file://' + path.join(__dirname, 'app', 'html', 'authorize.html'));
					return;					
				}

				splash.emit('authorized');
			} else {
				splash.loadUrl('file://' + path.join(__dirname, 'app', 'html', 'authorize.html'));
			}
		}, 1000);
	});

	splash.loadUrl('file://' + path.join(__dirname, 'app', 'html', 'boot.html'));
});