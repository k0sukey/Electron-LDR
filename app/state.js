var _ = require('lodash'),
	fs = require('fs'),
	path = require('path');

exports.exists = function(params){
	params = params || {};

	if (params.category === '') {
		return false;
	}

	return fs.existsSync(path.join(__dirname, 'data', params.category + '.json'));
}

exports.merge = function(params){
	params = params || {};

	if (params.category === '' ||
		params.content === '') {
		return;
	}

	var data = exports.load({
		category: params.category
	});

	if (params.category === 'feeds') {
		_.each(data, function(item, index){
			if (item.subscribe_id === params.content.subscribe_id) {
				data[index] = params.content;
			}
		});
	} else if (params.category === 'items') {
		_.each(data, function(item, index){
			if (item.id === params.content.id) {
				data[index] = params.content;
			}
		});
	} else if (params.category === 'meta') {
		_.each(params.content, function(item, index){
			data[index] = item;
		});
	}

	exports.save({
		category: params.category,
		content: data
	});
};

exports.save = function(params){
	params = params || {};

	if (params.category === '' ||
		params.content === '') {
		return;
	}

	fs.writeFileSync(path.join(__dirname, 'data', params.category + '.json'), JSON.stringify(params.content));
};

exports.load = function(params){
	params = params || {};

	if (params.category === '') {
		return;
	}

	delete require.cache[path.join(__dirname, 'data', params.category + '.json')];
	return require('./data/' + params.category);
};