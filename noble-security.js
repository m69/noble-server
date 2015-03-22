var nspAPI = require('nsp-api');
var async = require('async');

module.exports = function(modules) {

	var security = [];
	var modCount = 0;

	async.series([
	    function(callback){
	        modules.forEach(function(m) {
				++modCount;

				// security check
				nspAPI.validateModule(m.name, m.version, function(err, results) {

					--modCount;

					if(Object.prototype.toString.call(results) === '[object Array]' && results.length !== 0) {
						security.push(results);
						m.secFlag = true;
						m.vulnerabilities = results;
					}

					if(modCount === 0){
						callback(null, {
							security: security,
							modules: modules
						});
					}

				});

			});
	    }
	],
	// optional callback
	function(err, results){
	    return results;
	});
};