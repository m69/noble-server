# Noble Server
### The NPM proxy and node.js dependency reporter.

Noble Server is a server-side API that exposes several methods to proxy an npm cors request or resolve and report all of a node module's dependencies. It was crafted out of the need to work with the npm API to resolve dependencies and perform vulnerability scans. Then, smash everything together into an excel report.

###Installation:

```text
npm install -g noble-server
```

###Fire it up

```text
noble-server
```
Keep it running **forever** (hint: you'll need forever).
```text
forever start noble-server
```

###API Methods:

 * Retrieve
 * Resolve
 * Report

####Retrieve
Use it like npm, without a version to get all versions.

```text
http://localhost:6901/retrieve/ionic
```
Or add a specific version as a parameter (unlike npm)
```text
http://localhost:6901/retrieve/ionic?version=latest
http://localhost:6901/retrieve/ionic?version=1.3.16
```
Output:
```json
{
  "name": "ionic",
  "version": "1.3.16",
  "preferGlobal": true,
  "description": "A tool for creating and developing Ionic Framework mobile apps.",
  "homepage": "http://ionicframework.com/",
  "bin": {
    "ionic": "bin/ionic"
  },
  "scripts": {
    "bump": "node lib/tasks/bumpversion",
    "beta-bump": "node lib/tasks/bumpversion --level pre --identifier beta",
    "publish-release": "node lib/tasks/bumpversion --npmPublish",
    "publish-tag": "node lib/tasks/bumpversion --level beta --npmPublishTag",
    "full-release": "node lib/tasks/bumpversion --npmInstall --git --npmPublish"
  },
  "keywords": [
    "ionic",
    "ionic framework",
    "ionicframework",
    "mobile",
    "app",
    "hybrid",
    "cordova",
    "phonegap"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/driftyco/ionic-cli.git"
  },
  "contributors": [
    {
      "name": "Max Lynch",
      "email": "max@drifty.com",
      "url": "https://twitter.com/maxlynch"
    },
    {
      "name": "Peter Collins",
      "email": "peter@drifty.com",
      "url": "https://twitter.com/SomethingNew2_0"
    },
    {
      "name": "Adam Bradley",
      "url": "https://twitter.com/adamdbradley"
    },
    {
      "name": "Josh Bavari",
      "email": "josh@drifty.com",
      "url": "https://twitter.com/jbavari"
    }
  ],
  "license": "MIT",
  "dependencies": {
    "archiver": "0.5.1",
    "async": "^0.9.0",
    "colors": "0.6.2",
    "connect": "3.1.1",
    "connect-livereload": "0.5.2",
    "crc": "3.2.1",
    "cross-spawn": "0.2.3",
    "event-stream": "3.0.x",
    "finalhandler": "0.2.0",
    "form-data": "0.1.4",
    "gulp": "3.8.8",
    "ncp": "0.4.2",
    "npm": "2.1.3",
    "opbeat-ionic": "^1.1.3",
    "open": "https://registry.npmjs.org/open/-/open-0.0.5.tgz",
    "optimist": "0.6.0",
    "progress": "1.1.7",
    "prompt": "0.2.12",
    "proxy-middleware": "^0.7.0",
    "q": "1.0.1",
    "request": "2.51.0",
    "semver": "^4.2.0",
    "serve-static": "1.7.1",
    "shelljs": "0.2.6",
    "tiny-lr-fork": "0.0.5",
    "underscore": "~1.7.0",
    "unzip": "0.1.9",
    "vinyl-fs": "0.3.7",
    "xml2js": "0.4.4"
  },
  "gitHead": "cdb90de9bdd3b3f68cde2cbee7a6dde16e7bdd6f",
  "bugs": {
    "url": "https://github.com/driftyco/ionic-cli/issues"
  },
  "_id": "ionic@1.3.16",
  "_shasum": "205ee120355ed4c25c40afe2e60338ee110f9a0d",
  "_from": ".",
  "_npmVersion": "1.4.28",
  "_npmUser": {
    "name": "drifty",
    "email": "max@drifty.com"
  },
  "maintainers": [
    {
      "name": "drifty",
      "email": "max@drifty.com"
    },
    {
      "name": "drifty-joel",
      "email": "joel@drifty.com"
    },
    {
      "name": "jbavari",
      "email": "jbavari@gmail.com"
    }
  ],
  "dist": {
    "shasum": "205ee120355ed4c25c40afe2e60338ee110f9a0d",
    "tarball": "http://registry.npmjs.org/ionic/-/ionic-1.3.16.tgz"
  },
  "directories": {},
  "readme": "ERROR: No README data found!"
}
```

####Resolve
Resolve all dependencies, perform a vulnerability scan and output a report.

```text
http://localhost:6901/resolve/forever
```
Or add a specific version as a parameter (unlike npm)
```text
http://localhost:6901/resolve/forever?version=latest
http://localhost:6901/resolve/forever?version=0.14.1
```
Output:
```json
{
  "modules": [], // 204 items but removed for brevity
  "vulnerabilities": [],
  "report": "http://localhost:6901/report/forever@0.14.1.xlsx",
  "stats": {
    "resolved": 203,
    "securityHits": 0,
    "totalTime": "8.323s",
    "timestamp": 1427060603275,
    "errors": [],
    "mod": "be noble."
  }
}
```
A node.js module with some security issues:
```json
{
  "modules": [], // removed for brevity
  "vulnerabilities": [
    [
      {
        "title": "Marked multiple content injection vulnerabilities",
        "author": "Adam Baldwin",
        "module_name": "marked",
        "publish_date": "Fri Jan 31 2014 00:33:12 GMT-0800 (PST)",
        "cves": [
          {
            "name": "CVE-2014-1850",
            "link": "http://www.cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2014-1850"
          },
          {
            "name": "CVE-2014-3743",
            "link": "http://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2014-3743"
          }
        ],
        "vulnerable_versions": "<=0.3.0",
        "patched_versions": ">=0.3.1",
        "url": "marked_multiple_content_injection_vulnerabilities"
      },
      {
        "title": "marked VBScript Content Injection",
        "author": "Xiao Long",
        "module_name": "marked",
        "publish_date": "Thur Jan 22 2015 09:33:48 GMT-0800 (PST)",
        "cves": [
          {
            "name": "CVE-2015-1370",
            "link": "http://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2015-1370"
          }
        ],
        "vulnerable_versions": "<=0.3.2",
        "patched_versions": ">=0.3.3",
        "url": "marked_vbscript_injection"
      }
    ],
    [
      {
        "title": "express No Charset in Content-Type Header",
        "author": "Paweł Hałdrzyński",
        "module_name": "express",
        "publish_date": "Fri Sep 12 2014 07:46:45 GMT-0700 (PDT)",
        "cves": [
          {
            "name": "CVE-2014-6393",
            "link": "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2014-6393"
          }
        ],
        "vulnerable_versions": "<3.11 || >= 4 <4.5",
        "patched_versions": ">=3.11 <4 || >=4.5",
        "url": "express-no-charset-in-content-type-header"
      }
    ],
    [
      {
        "title": "methodOverride Middleware Reflected Cross-Site Scripting",
        "author": "Sergio Arcos",
        "module_name": "connect",
        "publish_date": "2013-07-01T01:08:59.630Z",
        "cves": [
          {
            "name": "CVE-2013-7370",
            "link": "http://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2013-7370"
          },
          {
            "name": "CVE-2013-7371",
            "link": "http://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2013-7371"
          }
        ],
        "vulnerable_versions": "<=2.8.0",
        "patched_versions": ">=2.8.1",
        "url": "methodOverride_Middleware_Reflected_Cross-Site_Scripting"
      }
    ],
    [
      {
        "title": "send Directory Traversal",
        "author": "Ilya Kantor",
        "module_name": "send",
        "publish_date": "Fri Sep 12 2014 08:06:33 GMT-0700 (PDT)",
        "cves": [
          {
            "name": "CVE-2014-6394",
            "link": "http://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2014-6394"
          }
        ],
        "vulnerable_versions": "< 0.8.4",
        "patched_versions": ">= 0.8.4",
        "url": "send-directory-traversal"
      }
    ],
    [
      {
        "title": "qs Denial-of-Service Extended Event Loop Blocking",
        "author": "Tom Steele",
        "module_name": "qs",
        "publish_date": "Aug 6 2014 09:10:23 GMT-0800 (PST)",
        "cves": [],
        "vulnerable_versions": "<1.0.0",
        "patched_versions": ">= 1.x",
        "url": "qs_dos_extended_event_loop_blocking"
      },
      {
        "title": "qs Denial-of-Service Memory Exhaustion",
        "author": "Dustin Shiver",
        "module_name": "qs",
        "publish_date": "Aug 6 2014 09:10:22 GMT-0800 (PST)",
        "cves": [],
        "vulnerable_versions": "<1.0.0",
        "patched_versions": ">= 1.x",
        "url": "qs_dos_memory_exhaustion"
      }
    ],
    [
      {
        "title": "send Directory Traversal",
        "author": "Ilya Kantor",
        "module_name": "send",
        "publish_date": "Fri Sep 12 2014 08:06:33 GMT-0700 (PDT)",
        "cves": [
          {
            "name": "CVE-2014-6394",
            "link": "http://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2014-6394"
          }
        ],
        "vulnerable_versions": "< 0.8.4",
        "patched_versions": ">= 0.8.4",
        "url": "send-directory-traversal"
      }
    ]
  ],
  "report": "http://localhost:6901/report/nodepaper@0.1.3.xlsx",
  "stats": {
    "resolved": 48,
    "securityHits": 6,
    "totalTime": "3.018s",
    "timestamp": 1427060743604,
    "errors": [],
    "mod": "be noble."
  }
}
```

####Report
Download a previously generated report (must have already run resolve). The report url is generated and returned in the returned JSON.

```text
http://localhost:6901/report/forever.xlsx
```

####What's next?
There is still quite a lot of work to be done. Currently, this program is only useful as an API and needs to be refactored to also be a command-line utlity. Reporting is limited to the returned JSON and an excel report. It sure would be nice to pick your flavor (xml, csv, etc).

####Contributing
I welcome all contributors to this project. Please fork it, make your changes and submit a pull request.

####Props
To [nodesecurity](http://nodesecurity.io) for providing the ability to check their database of security advisories. And to the other open source projects I've used to enable the capabilities this program provides.

####License
MIT.
