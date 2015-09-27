var _ = require('lodash'),
	fs = require('fs'),
	path = require('path');

exports.initialize = function(){
	if (!fs.existsSync(path.join(__dirname, 'data', 'setting.json'))) {
		fs.writeFileSync(path.join(__dirname, 'data', 'setting.json'), JSON.stringify({
			favicon: true,
			fontfamily: 'Noto Sans Japanese',
			fontsize: '14px',
			order: 'modified_on'
		}));
	}
};

exports.get = function(){
	delete require.cache[path.join(__dirname, 'data', 'setting.json')];
	return require('./data/setting');
};

exports.set = function(name, value){
	var setting = exports.get();
	setting[name] = value;
	fs.writeFileSync(path.join(__dirname, 'data', 'setting.json'), JSON.stringify(setting));
}