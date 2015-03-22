#!/usr/bin/env node

var program = require('commander');
var request = require('request');
var cors = require('cors');
var express = require('express');
var async = require('async');
var log4js = require('log4js');
var nspAPI = require('nsp-api');

var createNodeModule = require('./create-node-module');
var nobleExport = require('./noble-export.js');
var nobleSecurity = require('./noble-security.js');

// commander setup
program.version('0.1.2');
program.description('Noble - Resolve node.js dependencies, perform a security scan and export the report.')
program.option('-e, --export', 'Export Excel Report');
program.option('-f, --filename [filename]', 'Report Filename');
program.option('-s, --security', 'Perform Vulnerability Scan');
program.option('-d, --devdependencies', 'Resolve devDependencies');
program.parse(process.argv);

program.export = program.export || false;
program.filename = program.filename || false;
program.security = program.security || false;
program.devdependencies = program.devdependencies || false;

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

	    	if(program.security) {
	    		var securityScan = nobleSecurity(modules);
	    		console.log(securityScan);
	    		//modules = securityScan.modules;
	    		callback(null, securityScan);
	   //  		// reset counter
		  //   	modCount = 0;

		  //   	modules.forEach(function(m) {
		  //   		++modCount;

		  //   		// security check
		  //   		nspAPI.validateModule(m.name, m.version, function(err, results) {

		  //   			--modCount;

				// 		if(Object.prototype.toString.call(results) === '[object Array]' && results.length !== 0) {
				// 			security.push(results);
				// 			m.secFlag = true;
				// 			m.vulnerabilities = results;
				// 		}

				// 		if(modCount === 0){
				// 			callback(null, security);
				// 		}

				// 	});

				// });
	    	}else{
	    		callback(null, 'no security scans');
	    	}
	    },
	    // exporting
	    function(callback) {

	    	if(program.export) {
		    	logger.info('Exporting...');
		    	var reportUrl = nobleExport(modules, program.filename, hostname);
		    	callback(null, reportUrl);
		    }else{
		    	callback(null, 'no report');
		    }
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
			report: results[2].report || '',
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