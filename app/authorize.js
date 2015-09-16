var _ = require('lodash'),
	fs = require('fs'),
	path = require('path'),
	remote = require('remote'),
	request = require('request'),
	Cookie = require('../cookie');

function doAuthorize() {
	var livedoorid = document.getElementById('livedoorid').value,
		password = document.getElementById('password').value;

	if (livedoorid === '' || password === '') {
		return;
	}

	request.post('https://member.livedoor.com/login/index', {
		form: {
			livedoor_id: livedoorid,
			password: password,
			auto_login: 1
		}
	}, function(error, response, body){
		if (error || body !== '') {
			return;
		}

		Cookie.set(response.headers['set-cookie']);
		remote.getCurrentWindow().emit('authorized');
	});
}