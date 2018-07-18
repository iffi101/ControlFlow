
//I am using postman as a client.

//using async.waterfall


//It only works on complete urls i.e. http://www.google.com. I assume this test is related to control flow strategies so I left it as it is. I hope its fine.
var http = require('http');
var fs = require('fs');
var path = require('path');
var request = require("request");
var cheerio = require("cheerio");
var queryString = require('querystring');
var url = require('url');
var jsdom = require("jsdom");
var async=require("async");

var hostname = 'localhost';
var port = 3000;
var server = http.createServer(function(req, res){
    console.log('Request for ' + req.url + ' by method ' + req.method);
  
    if (req.method == 'GET' ) {

        //using async.waterfall

        async.waterfall([
            function getQueryParamFunc(callback){
                var queryParams = url.parse(req.url, true).query;
                console.log(queryParams);
                if(!queryParams.address){
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<html><body><h1>Error 404: ' + req.url +' should not be empty</h1></body></html>');
                    return;
                }

                callback(null, queryParams);
            },
            function requestForAddresses(queryParams,callback){
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
                                                callback(null,titles);
                                            
                                    }
                                    else{
                                        var $ = cheerio.load(body);
                                        var title = $("title");
                                        console.log(title.html());
                                        titles.push(title.html());

                                        if(titles.length==count)
                                            callback(null,titles);
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
                                            callback(null,titles);
                                        
                                        }
                                    else{
                                        var $ = cheerio.load(body);
                                        var title = $("title");
                                        console.log(title.html());
                                        titles.push(title.html());

                                        if(titles.length==count)
                                            callback(null,titles);
                                    }
                                })    
                        }                

            },
            //this rendering part should have been done on client side, as I am using postman as a client so I did everything here.
            function renderHtml(titles,callback){
                fs.readFile('./views/index.html', 'utf8', function(error, data) {
                    jsdom.env(data, [], function (errors, window) {
                        var $ = require('jquery')(window);
                        // titles.forEach(function(element) {
                        //     $("ul").append('<li>'+element+'</li>');
                        // },this);
                        for(var i=0;i<titles.length;i++)
                            $("ul").append('<li>'+titles[i]+'</li>');



                        callback(null, window.document.documentElement.outerHTML);
   

                    });
                });
            }


        ],function(err,result){
            if(err){                                        
                res.writeHeader(200, {"Content-Type": "text/html"});  
                res.end("Error 500" + err.message);  

            }
                res.writeHeader(200, {"Content-Type": "text/html"});  
                res.write(result);  
                res.end();  
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





