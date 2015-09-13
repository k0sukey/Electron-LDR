var app = require('app'),
	path = require('path'),
	BrowserWindow = require('browser-window'),
	token = require('./package.json').token;

require('crash-reporter').start();

var window = null;

app.on('ready', function(){
	window = new BrowserWindow({
		title: 'Electron-LDR',
		width: 800,
		height: 600
	});

	window.token = token;

	window.on('closed', function(){
		window = null;
	});

	window.loadUrl('file://' + path.join(__dirname, 'app', 'html', 'index.html'));
});