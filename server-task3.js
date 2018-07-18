//using RSVPs


//It only works on complete urls i.e. http://www.google.com. I assume this test is related to control flow strategies so I left it as it is. I hope its fine.

var http = require('http');
var fs = require('fs');
var path = require('path');
var request = require("request");
var cheerio = require("cheerio");
var queryString = require('querystring');
var url = require('url');
var jsdom = require("jsdom");
var RSVP=require("rsvp");

var hostname = 'localhost';
var port = 3000;
var server = http.createServer(function(req, res){
    console.log('Request for ' + req.url + ' by method ' + req.method);
  
    if (req.method == 'GET' ) {

        var getQueryParams = function(urlString) {
        var promise = new RSVP.Promise(function(resolve, reject){
            var queryParams = url.parse(urlString, true).query;
            console.log(queryParams);
            if(!queryParams.address){
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<html><body><h1>Error 404: ' + urlString +' should not be empty</h1></body></html>');
                
                reject('<html><body><h1>Error 404: ' + urlString +' should not be empty</h1></body></html>');
                return;
            }
                resolve(queryParams);
        });
        return promise;
        };

        var getTitles = function(queryParams) {
        var promise = new RSVP.Promise(function(resolve, reject){
                        var titles=[];
            var count=Object.keys(queryParams.address).length;
            if(typeof queryParams.address ==='string'){
                count=1;
            }
            console.log("count of items: " +count);
            if(count>1){
                queryParams.address.forEach(function(element) {
                    console.log(element);
                    request(element, function(error, response, body) {
                        if(error){
                            titles.push(error.message);
                            if(titles.length==count)
                                    resolve(titles);
                        }
                        else{
                            var $ = cheerio.load(body);
                            var title = $("title");
                            console.log(title.html());
                            titles.push(title.html());

                            if(titles.length==count)
                                resolve(titles);
                        }
                    })    
                }, this);//end of forEach   
                    }//end of if
                    else{
                        console.log(queryParams.address);
                        request(queryParams.address, function(error, response, body) {
                                if(error){
                                    titles.push(error.message);
                                    if(titles.length==count)
                                        resolve(titles);
                                    
                                    }
                                else{
                                    var $ = cheerio.load(body);
                                    var title = $("title");
                                    console.log(title.html());
                                    titles.push(title.html());
                                    if(titles.length==count)
                                        resolve(titles);
                                }
                            })    
                    }                
        });
        return promise;
        };

        var renderHtml = function(titles) {
        var promise = new RSVP.Promise(function(resolve, reject){
            console.log(titles);
            fs.readFile('./views/index.html', 'utf8', function(error, data) {
                if(error){
                    reject("Error with reading index"+error);
                }
                

                jsdom.env(data, [], function (errors, window) {
                    var $ = require('jquery')(window);
                    // titles.forEach(function(element) {
                    //     $("ul").append('<li>'+element+'</li>');
                    // },this);
                    for(var i=0;i<titles.length;i++)
                        $("ul").append('<li>'+titles[i]+'</li>');
                
                // res.writeHeader(200, {"Content-Type": "text/html"});  
                // res.write(window.document.documentElement.outerHTML);  
                // res.end();
                
                resolve(window.document.documentElement.outerHTML);
                });
                
             });

        });
        return promise;
        };

        getQueryParams(req.url).then(function(queryParams) {
            return getTitles(queryParams);
                }).then(function(titles) {
                    return renderHtml(titles);
                        }).then(function(renderHtmlvalue){
                            res.writeHeader(200, {"Content-Type": "text/html"});  
                            res.write(renderHtmlvalue);  
                            res.end();
                }).catch(function(error) {
        // handle errors
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('Something wrong with the Promise: ' + error.message);

           });        

    }
      else { //not a GET method
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<html><body><h1>Error 404: ' + req.method +' not supported</h1></body></html>');
      }
    })

server.listen(port, hostname, function(){
  console.log(`Server running at http://${hostname}:${port}/`);
});





