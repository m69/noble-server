var nodeExcel = require('excel-export-impr');
var fs = require('fs');
			
var nobleExport = function(modules, filename, hostname) {
	
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
	var filename = filename || modules[0]._id + '.xlsx';

	if (!fs.existsSync('reports')){
	    fs.mkdirSync('reports');
	}
	fs.writeFileSync('reports/' + filename, excelConf, 'binary');

	console.log('Exported: ' + filename);

	var downloadUrl = {
		report: hostname + '/report/' + filename
	};

	return downloadUrl;
};			

module.exports = function(modules, filename, hostname) {

	var exportData;
	if(modules) {
		exportData = nobleExport(modules, filename, hostname);
	}

	return exportData || false;
}