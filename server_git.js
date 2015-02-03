var consumerKey    = "insert consumer key";
var consumerSecret = "insert consumer secret";
var accessToken    = "insert access token";
var accessSecret   = "insert access secret";

var express    = require('express');
var http       = require('http');
var bodyParser = require('body-parser');
var tumblr     = require('tumblr.js');
var app        = express();
var server     = http.createServer(app);

var client = tumblr.createClient({
  consumer_key: consumerKey,
  consumer_secret: consumerSecret,
  token: accessToken,
  token_secret: accessSecret
});

app.use(bodyParser.json());

app.post("/avatar", function(req, res) {

  var url = req.body.blog_name + ".tumblr.com";

  client.avatar(url, 48, function(err, resp) {
    if (resp) {
      console.log(resp);
      res.send(resp);
    } else {
      res.send(err);
    }
  });

});

/**
 * Monitors request from client-side, calls the Tumblr API with the given
 * parameters below, and returns the response (JSON object)
 *
 * blog_name -> String representing Tumblr URL
 * post -> String representing whether it's regular post or likes
 * post_type -> String representing the type of post (text, audio, etc)
 * params -> STring representing additional parameters for API call
 */
app.post("/fetch", function(req, res) {

  var url       = req.body.blog_name + ".tumblr.com";
  var post      = req.body.post;
  var post_type = req.body.post_type;
  var offset    = req.body.offset;
  var limit     = req.body.limit;

  if (post == "posts") {

    client.posts(url,
      {
        type: post_type,
        limit: limit,
        offset: offset,
        reblog_info: true
      },
      function(err, resp) {
        if (resp) {
          res.send(resp);
        } else {
          res.send(err);
        }
    });
  }

  else if (post == "likes") {

    client.blogLikes(url,
      {
        limit: limit,
        offset: offset
      },
      function(err, resp) {
        if (resp) {
          res.send(resp);
        } else {
          res.send(err);
        }
    });
  }
});

app.set('port', 3001);
app.use(express.static(__dirname + ''));

server.listen(app.get('port'), function () {
  console.log("Express server listening on port %s.", server.address().port);
});
