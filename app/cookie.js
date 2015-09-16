var _ = require('lodash'),
	fs = require('fs'),
	path = require('path');

exports.set = function(cookies){
	fs.writeFileSync(path.join(__dirname, 'cookies'), JSON.stringify(cookies));
};

exports.get = function(){
	if (!exports.exists()) {
		return '';
	}

	var cookies = fs.readFileSync(path.join(__dirname, 'cookies')),
		result = [];

	try {
		_.each(JSON.parse(cookies), function(cookie){
			var pairs = cookie.split(';');

			_.each(pairs, function(pair){
				var keyvalue = pair.split('='),
					key = keyvalue[0].trim();

				if (key !== 'expires' && key !== 'path' &&
					key !== 'domain' && key !== 'secure' &&
					key !== 'HttpOnly') {
					result.push(key + '=' + keyvalue[1]);
				}
			});
		});
	} catch (e) {}

	return result.join('; ');
};

exports.exists = function(){
	return fs.existsSync(path.join(__dirname, 'cookies'));
};

exports.parseApiKey = function(cookies){
	var result = '';

	_.each(cookies, function(cookie){
		_.each(cookie.split(';'), function(pair){
			var keyvalue = pair.split('='),
				key = keyvalue[0].trim();

			if (key === 'reader_sid') {
				result = keyvalue[1];
			}
		});
	});

	return result;
};