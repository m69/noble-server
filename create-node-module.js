normalizeData = require('normalize-package-data');

//var normalizeWarning = function(msg) { console.error(msg) };

var NodeModule = function() {
	
	this.data = {};

	this.populate = function(mod) {
		// normalize the module data
		normalizeData(mod);

		// self-create module data
		for(var prop in mod) {
			this.data[prop] = mod[prop];
		}

	};

	this.getData = function() {
		return this.data;
	};
};

module.exports = function(data) {
	var moduleInstance = new NodeModule();

	moduleInstance.populate(data);

	return moduleInstance;
}