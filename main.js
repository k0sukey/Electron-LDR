var _ = require('lodash'),
	app = require('app'),
	fs = require('fs'),
	path = require('path'),
	BrowserWindow = require('browser-window'),
	Cookie = require('./app/cookie'),
	packagejson = require('./package.json');

require('crash-reporter').start();

var window = null,
	splash = null;

app.on('window-all-closed', function(){
	app.quit();
});

app.on('ready', function(){
	splash = new BrowserWindow({
		width: 640,
		height: 480,
		frame: false,
		transparent: true
	});

	splash.on('closed', function(){
		splash = null;
	});

	splash.on('authorized', function(){
		window = new BrowserWindow({
			title: 'Electron-LDR',
			width: 1024,
			height: 768
		});

		window.useragent = packagejson.name + '@' + packagejson.version;

		window.on('closed', function(){
			window = null;
		});

		window.loadUrl('file://' + path.join(__dirname, 'app', 'html', 'index.html'));

		splash.close();
	});

	splash.webContents.once('did-finish-load', function(){
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