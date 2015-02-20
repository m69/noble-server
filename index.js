// 3p
var request = require('request');
var cors = require('cors');
var express = require('express');
var async = require('async');
var log4js = require('log4js');
var nodeExcel = require('excel-export-impr');
var fs = require('fs');

// local
var createNodeModule = require('./create-node-module');

var logger = log4js.getLogger();
log4js.replaceConsole();
logger.setLevel('INFO');
var app = express();
var port = process.env.PORT || 6900;


// listen for requests
app.get('/:module', cors(), function(req, res){

	//TODO: handle the favicon thing?
	if(req.params.module === 'favicon.ico') {return};

	var modules = [];
	var errors = [];
	var modCount = 0;
	var modTotal = 0;
	var timestamp = Date.now();
	var registry = 'http://registry.npmjs.org/';
  	var url = registry + req.params.module;

	if(req.query.version){
		url += '/' + req.query.version.toString().replace(/\^/g,'');
	}

  	logger.info('NPM Request: '+ url);

	async.series([
    	function(callback){

    		logger.info('Resolving dependencies...');

    		var getDependencies = function(module) {
    			var dependencies = module.dependencies;

    			// this is the main loop
    			for(mod in dependencies) {

    				// increment our counter for each module
					++modCount;
					++modTotal;

					// build our new url
					var newUrl = registry + mod;
					var modVersion = dependencies[mod].toString().replace(/\^/g,'');

					// check for version url
					if(modVersion.substring(0, 4) === 'http' || modVersion.substring(0, 3) === 'git') {
						logger.debug('Found version url for: ' + mod.name);
						newUrl = newUrl + '/latest';
					}else{
						newUrl = newUrl + '/' + modVersion;
					}
					
					logger.debug('NPM Request: ' + newUrl);

					request.get({url:newUrl, json:true}, function(error, resp, body) {

						// decrement counter as the request has resolved, good or bad
						--modCount;

						if(error){
							// for reporting
							errors.push(error);
						}else{

							// build a new module 
							var dep = createNodeModule(body);

							// save the module
							modules.push(dep.getData());

							// keep running until the queue is empty
							if(modCount !== 0){
								// loop it
								getDependencies(dep.getData());
							}else{
								// done
								callback(null, modules);
							}
						}

					});
				}

    		};

    		// make the initial request for the module and kickoff the 
    		// dependency loop
    		request.get({url:url, json:true}, function(err, resp, body) {

    			// build a new module
				var mod = createNodeModule(body);
				
				// save the module
				modules.push(mod.getData());
				
				// no dependencies no problem
				if(mod.getData().dependencies){
					// kick it off
					getDependencies(mod.getData());
				}else{
					// done
					callback(null, modules);
				}

			});
	     
	    },
	    function(callback) {

	    	logger.info('Exporting...');

	    	var conf ={};
			conf.cols = [
				{
					caption:'Name',
					type:'string'
				},
				{
					caption:'Version',
					type:'string'
				},
				{
					caption:'ID',
					type:'string'
				},
				{
					caption:'Description',
					type:'string'
				},
				{
					caption:'Homepage',
					type:'hyperlink',
				},
				{
					caption:'NPM',
					type:'hyperlink'
				},
				{
					caption:'Repository',
					type:'hyperlink'
				},
				{
					caption:'Bugs',
					type:'hyperlink'
				},
				{
					caption:'Prefer Global',
					type:'string'
				},
				{
					caption:'Dependencies',
					type:'string'
				},
				{
					caption:'License Detail',
					type:'string'
				}
			];

			conf.rows = [];

			modules.forEach(function(m) {

				// the what ifs
				m.homepage = m.homepage || 'asdf';
				m.npm = 'http://npmjs.org/package/' + m.name;
				m.repository = m.repository || {url:'http://asdf'};
				m.bugs = m.bugs || {url:'http://asdf'},
				
				m.dep = [];
				for(dep in m.dependencies) {
					m.dep.push(dep + '@' + m.dependencies[dep]);
				}
				m.dep.join('\n');

				// autobots assemble
				conf.rows.push([
					m.name,
					m.version,
					m._id,
					m.description,
					m.homepage,
					{text: m.npm, href: m.npm},
					{text: m.repository.url, href: m.repository.url},
					{text: m.bugs.url, href: m.bugs.url},
					m.preferGlobal,
					m.dep,
					m.license
				]);
			});

			var excelConf = nodeExcel.execute(conf);
			var filename = modules[0]._id + '.xlsx';

			if (!fs.existsSync('reports')){
			    fs.mkdirSync('reports');
			}
			fs.writeFileSync('reports/' + filename, excelConf, 'binary');

			logger.info('Exported: ' + filename);

	    	callback(null);
	    }
	],
	function(err, results){

		logger.info('Completed');

		// handle the errors, if any
		if(errors.length){
			logger.info('Found Errors: ' + errors.length);
			for(error in errors) {
				logger.error(error);
			}
		}

		logger.info('Resolved Modules: ' + (modTotal === 0 ? 1 : modTotal));

		var timeDiff = Date.now() - timestamp;
		logger.info('Total Time: ' +  timeDiff / 1000 + 's');
		logger.info('########################################');

		// send back the json request
		// use modules not results
	    res.jsonp(modules);
	});

});

app.listen(port);

logger.info('Started Noble Server on PORT: ' + port);