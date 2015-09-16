var _ = require('lodash'),
	cheerio = require('cheerio'),
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

	request.post('https://member.livedoor.com/login/index', function(error, response, body){
		if (error) {
			return;
		}

		var $ = cheerio.load(body);

		request.post('https://member.livedoor.com/login/index', {
			form: {
				livedoor_id: livedoorid,
				password: password,
				_token: $('input[name=_token]').val(),
				auto_login: 1
			}
		}, function(error, response, body){
			if (error || body !== '') {
				return;
			}

			Cookie.set(response.headers['set-cookie']);
			remote.getCurrentWindow().emit('authorize');
		});
	});
}