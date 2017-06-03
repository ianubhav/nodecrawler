var request = require('request');
var cheerio = require('cheerio');
var async = require("async");
var fs = require("fs");
var START_URL = "medium.com";
var outputfile = 'output.csv'
var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var totalLoop = 5;
var expression = /(medium)\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~&//=]*)/gi;
var regex = new RegExp(expression);

fs.writeFile(outputfile, 'url\n',  function(err) {
    if (err) {
        return console.error(err);
    }
});

var asyncTasks = [];

for( var i = 0; i < totalLoop; i++ ) {
	asyncTasks.push(function(callback){
    	crawl()
	});
}


function startUrl(url) {
    // Add page to our set
    pagesVisited[url] = true;
    numPagesVisited++;
    appendfile(outputfile,url)
    // Make the request
    console.log("Visiting page no " + numPagesVisited);
    request('https://'+url, function(error, response, body) {
        // Check status code (200 is HTTP OK)
        // console.log("Status code: " + response.statusCode);
        if(response.statusCode !== 200) {
          console.log("Status code: " + response.statusCode);
          callback();
          return;
        }
        // Parse the document body
        var $ = cheerio.load(body);
        collectInternalLinks($);
        // Start 5 concurrent loops
        async.parallel(asyncTasks,
	        function(err, results) {
	            console.log('all-----------done')
	       });
    });
}


function crawl() {
    var nextPage = pagesToVisit.pop();
    if ((nextPage in pagesVisited) || (nextPage == null)) {
        // We've already visited this page, so repeat the crawl
        crawl();
    }
    else {
        // New page we haven't visited
        visitPage(nextPage, crawl);
    }
}

function appendfile(path,data) {
    fs.appendFile(path, data+'\n', function (err) {
        if (err) {
          console.log('failed appending '+ data)
        }
    })
}

function visitPage(url, callback) {
    // Add page to our set
    pagesVisited[url] = true;
    numPagesVisited++;
    appendfile(outputfile,url)
    // Make the request
    console.log("Visiting page no " + numPagesVisited);
    request('https://'+url, function(error, response, body) {
        // Check status code (200 is HTTP OK)
        // console.log("Status code: " + response.statusCode);
        if(response.statusCode !== 200) {
            console.log("Status code: " + response.statusCode);
            callback();
            return;
        }
        // Parse the document body
        var $ = cheerio.load(body);
        collectInternalLinks($);
        callback();
    });
}

function collectInternalLinks($) {
    var allLinks = $('a');
    allLinks.each(function() {
        link = $(this).attr('href').match(regex)
        if (link != null){
          pagesToVisit.push(link[0]);
      }
  });
}

startUrl(START_URL)