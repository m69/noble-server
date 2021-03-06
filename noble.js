#!/usr/bin/env node

// 3p
var request = require('request');
var cors = require('cors');
var express = require('express');
var async = require('async');
var log4js = require('log4js');
var nodeExcel = require('excel-export-impr');
var nspAPI = require('nsp-api');
var fs = require('fs');

// local
var createNodeModule = require('./create-node-module');

var logger = log4js.getLogger();
log4js.replaceConsole();
logger.setLevel('INFO');
var app = express();
var port = process.env.PORT || 6901;

app.get('/retrieve/:module', cors(), function(req, res) {
	//TODO: handle the favicon thing?
	if(req.params.module === 'favicon.ico') {return};

	var registry = 'http://registry.npmjs.org/';
  	var url = registry + req.params.module;

  	if(req.query.version){
		url += '/' + req.query.version.toString().replace(/\^/g,'');
	}

	logger.info('NPM Retrieve Request: '+ url);

	request.get({url:url, json:true}, function(err, resp, body) {

		if(!err && resp.statusCode == 200) {

			// build a new module
			var mod = createNodeModule(body);

			// return the module
			res.jsonp(mod.getData());

		}else{
			res.jsonp(err);
		}

	});
});

// listen for requests
app.get('/resolve/:module', cors(), function(req, res) {

	//TODO: handle the favicon thing?
	if(req.params.module === 'favicon.ico') {return};

	var modules = [];
	var errors = [];
	var security = [];
	var modCount = 0;
	var modTotal = 0;
	var timestamp = Date.now();
	var hostname = 'http://' + req.headers.host;
	var registry = 'http://registry.npmjs.org/';
  	var url = registry + req.params.module;

	if(req.query.version){
		url += '/' + req.query.version.toString().replace(/\^/g,'');
	}else{
		url += '/latest';
	}

  	logger.info('NPM Resolve Request: '+ url);

	async.series([
		// our main workhorse
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
	    // this is our security bit 
	    function(callback) {

	    	// reset counter
	    	modCount = 0;

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
						callback(null, security);
					}

				});

			});
	    },
	    // exporting
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
					caption:'Vulnerabilities',
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
				m.homepage = m.homepage || '';
				m.npm = 'http://npmjs.org/package/' + m.name;
				m.repository = m.repository || {url:''};
				m.bugs = m.bugs || {url:''};
				m.dep = '';

				if(typeof m.license === 'object' && m.license.type !== 'undefined') {
					m.license = m.license.type;
				}

				// lets format these pesky things
				m.vulnerabilities = m.vulnerabilities || [];
				var v = '';
				m.vulnerabilities.forEach(function(hit){
					if(hit.length > 0) {
						hit.forEach(function(subHit){
							//TODO string huh?
							v = v + 'https://nodesecurity.io/advisories/module/' + subHit.url + ' \n';
						});
					}else if(hit.url) {
						v = v + 'https://nodesecurity.io/advisories/module/' + hit.url + ' \n';
					}
				});
				
				// just for reference
				var temp = [];
				for(dep in m.dependencies) {
						temp.push(dep + '@' + m.dependencies[dep]);
					}
				if(temp.length > 0) {
					m.dep = temp.join(',\n');
				}

				// autobots assemble
				conf.rows.push([
					m.name,
					m.version,
					m._id,
					m.description,
					v,
					{text: m.homepage, href: m.homepage},
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

			var downloadUrl = {
				report: hostname + '/report/' + filename
			};

	    	callback(null, downloadUrl);
	    }
	],
	// final callback function
	function(err, results){

		logger.info('Completed');

		// handle the errors, if any
		if(errors.length){
			logger.info('Found Errors: ' + errors.length);
			for(error in errors) {
				logger.error(errors[error]);
			}
		}

		// lets put together some nifty stats
		var resolvedModules = modTotal === 0 ? 1 : modTotal
		logger.info('Resolved Modules: ' + resolvedModules);
		logger.info('Vulnerabilities: ' + security.length);
		var timeDiff = Date.now() - timestamp;
		var totalTime = timeDiff / 1000 + 's';
		logger.info('Total Time: ' +  totalTime);
		logger.info('Timestamp: ' +  timestamp);
		logger.info('########################################');

		// build our response
		var nobleResponse = {
			modules: modules,
			vulnerabilities: security,
			report: results[2].report,
			stats: {
				resolved: resolvedModules,
				securityHits: security.length,
				totalTime: totalTime,
				timestamp: timestamp,
				errors: errors,
				mod: 'be noble.'
			}
		}

		// send back the json request
	    res.jsonp(nobleResponse);
	});

});

// handle requests to download reports
app.get('/report/:name', function (req, res, next) {
	
	var options = {
		root: __dirname + '/reports/',
		dotfiles: 'deny',
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true
		}
	};

	var fileName = req.params.name;
		res.sendFile(fileName, options, function (err) {
		if (err) {
			logger.error(err);
			res.status(err.status).end();
		}
		else {
			logger.info('Sent File: ' + fileName);
		}
	});
});

app.listen(port);

logger.info('Started Noble Server on PORT: ' + port);