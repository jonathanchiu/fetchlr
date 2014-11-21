$(function() {

	var posts_per_page = 10;
  var user;

  initSearchBar();
  handlePaginationClick();

  /**
   * Sets the offset variable whenever a page number is clicked. The offset is
   * calculated based on the page number, and is later used in the URL for
   * the API call
   * 
   * num -> int (or string?) - represents the page number clicked
   * offset -> int - represents which post number to start fetching from
   */
  function handlePaginationClick() {
    $('#page-selection').bootpag({ }).on("page", function(event, num) {

      var offset;
      var post_type = $("#post-type").val();

      if (num == 1) {
        offset = 0;
      }
      else {
        offset = (parseInt(num, 10) * 10) - 10;
      }
      fetchPosts(user, post_type, offset, posts_per_page);
    });
  }

  /**
   * Generate div containing post content
   */
  function makePost(content) {
    return '<div class="post">' + content + '</div>';
  }
  /**
   * Generate div containing an error message
   */
  function makeError(content) {
    var error = '<div id="error"><p class="bg-danger">' + content + '</p></div>';
    $("#content").append(error);

    setTimeout(function() {
      $("#error").fadeOut(400);
    }, 1000);
  }

  /**
   * Properly retrieves post data from the given JSON object, based on the
   * post type. Calls the makePost function to wrap the data in a div. Returns
   * a div that is ready to be displayed to the user
   *
   * post -> A JSON object representing a Tumblr post
   * date -> A string representing the date the post was made
   * type -> A string representing the post type of the given post
   */
  function formatPost(post, date, type) {

  	var formatted;
    var liked_post_type = post.type;
    var tags = '';

    if (post.tags.length > 0) {
      $.each(post.tags, function(i, v) {
        var tag = "#" + v + " ";
        var url = "http://" + user + ".tumblr.com/tagged/" + v.replace(/ /g, "-");
        tags += '<a href="' + url + '" target="_blank">' + tag + '</a>'
      });
    }

    var all_tags = '<div class="tags">' + tags + '</div>';

    if (type == "photo" || liked_post_type == "photo") {
			var img_src  = post.photos[0].alt_sizes[1].url;
			var img_html = '<img class="photo" src="' + img_src + '">';
			var caption  = post.caption;
			formatted    = makePost(date + img_html + caption + all_tags);
    }

    else if (type == "audio" || liked_post_type == "audio") {
			var player  = post.player;
			var caption = post.caption;
			formatted   = makePost(date + player + caption + all_tags);
    }

    else if (type == "text" || liked_post_type == "text") {
			var body  = post.body;
			formatted = makePost(date + body + all_tags);
    }

    else if (type == "quote" || liked_post_type == "quote") {
      var quote = '<div class="quote"><blockquote>' + post.text + '</blockquote></div>';
      var quote_source = '<div class="quote-source">' + post.source + '</div>';
      formatted = makePost(date + quote + quote_source + all_tags);
    }

    else if (type == "answer" || liked_post_type == "answer") {
      var question = '<div class="question"><blockquote>' + post.question + '</blockquote></div>';
      var answer = '<div class="answer">' + post.answer + '</div>';
      formatted = makePost(date + question + answer + all_tags);
    }

    else if (type == "link" || liked_post_type == "link") {
      var title = "<h3>" + post.title + "</h3>";
      var description = post.description;
      var original_url = '<a target="_blank" href="' + post.url + '">Source</a>'
      formatted = makePost(date + title + description + original_url + all_tags);
    }

    else if (type == "chat" || liked_post_type == "chat") {
      var chat = '<div class="chat">';
      var body = post.body.split("\r\n");
      var chat_length = body.length;
      for (var i = 0; i < chat_length; i++) {
        chat += body[i] + '<br>';
      }
      chat += "</div>"
      formatted = makePost(date + chat + all_tags)
    }
// magic of love
    else if (type == "video") {
    	/**
    	 * Given HTML string representing video embed, convert it to a jQuery
    	 * object, set its attributes to make it responsive, and return the
    	 * responsive embed code
    	 *
    	 * video -> HTML5 video embed string
    	 */
    	function responsify(video) {

    		var responsive_video = $(video).attr("class", "embed-responsive-item");
    		responsive_video = responsive_video.prop("outerHTML");

    		return '<div class="embed-responsive embed-responsive-16by9">' + 
		    				responsive_video +
		    				'</div>';
    	}
    	
    	// Tumblr player doesn't have video controls, so we must invoke the attr
    	if (post.video_type == "tumblr") { 
    		var tumblr_video = $(post.player[2].embed_code);
    		tumblr_video.attr("controls", "controls");
    		var embed_video = tumblr_video.prop("outerHTML");
    	} else {
    		var embed_video = post.player[2].embed_code;
    	}

    	formatted = makePost(date + responsify(embed_video) + post.caption + all_tags);
    }

    return formatted;
  }

  /**
   * Check to see if the given API response contains an error
   *
   * results -> A JSON object returned from the API call
   */
  function didError(results) {

  	var error = '';

    // Error was returned
    if (results.meta.status !== 200) {

    	$("#page-selection").hide();

      // Tumblr username doesn't exist
      if (results.meta.status === 404) {
        error = makeError("ERROR: User not found");
      }
      // Tumblr user has restricted his/her likes from being viewed
      else if (results.meta.status === 401) {
        error = makeError("ERROR: User's likes are restricted");
      }
      else {
        error = makeError("ERROR: Some other error occurred :(");
      }
      return [true, error];
    } else {
      return [false, error];
    }
  }

  /**
   * Connect with the Tumblr API and get posts based on given arguments
   *
   * username -> String - The username the user searches for
   * post_type -> String - Post type the user selected
   * params -> String - Any additional parameters for the API call
   */
  function fetchPosts(username, post_type, offset, limit) {

    //var tag       = $("#tag").val();
    var post      = (post_type == "likes") ? "likes" : "posts";
    var blog_name = username + ".tumblr.com";
    var url       = "/fetch";

    var data = JSON.stringify({
      blog_name: username,
      post: post,
      post_type: post_type,
      offset: offset,
      limit: limit
      //tag: tag
    });

    /**
     * Get request to Node.js to fetch data
     */
    $.ajax({
      url: url,
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: data,
      beforeSend: function() {
        var loader = '<img id="loader" style="display:block; margin:0 auto" src="loader.gif">';
        $("#content").append(loader);
      },
      success: function(results) {
        console.log(results);
        var content = $("#content");
        $("#loader").remove();

        var error = jQuery.isEmptyObject(results);
        var no_posts = (post_type == "likes") ? 
                        (results.liked_posts.length == 0) : 
                        (results.posts.length == 0);

        if (error) {
          $("#page-selection").hide();
          if (error && post_type == "likes") {
            makeError("That user's likes are restricted from being viewed publicly.");
          } else {
            makeError("The username you entered does not exist");
          }
        }

        else if (no_posts) {
          makeError("No posts were found.");
        }

        // else if (no_posts) {
        //   makeError("No " + post_type + " posts with tag " + '"' + tag + '"' + " were found.");
        // }

        else { 
          $("#page-selection").show();
          var output  = '';

          // if (tag == '') {
          //   $("#pagination-preference").val("manual");
          // } else {
          //   $("#pagination-preference").val("infinite");
          //   $("#page-selection").hide();
          // }

          // Dynamically calculate total number of pages to show for the pagination
          if (post_type != "likes") {
            var page_count = Math.ceil(results.total_posts / 10);
            console.log("Page Count: " + page_count);
            console.log("Num Posts: " + results.total_posts);
          } else {
            var page_count = Math.ceil(results.liked_count / 10);
            console.log("Page Count (Likes): " + page_count);
            console.log("Num Posts (Likes): " + results.liked_count);
          }

          $('#page-selection').bootpag({
            total: page_count,
            maxVisible: 5,
            next: 'Next',
            prev: 'Previous',
            leaps: false
          });

          // All post types default to being stored where key is posts
          if (post_type != "likes") {
            var posts = results.posts;
            var num_posts = results.posts.length;
          }
          // Liked posts are stored where key is liked_posts
          else {
            var posts = results.liked_posts;
            var num_posts = results.liked_posts.length;
          }

          /**
           * For each Tumblr post, access the correct fields that correspond with
           * the post post_type the user requested, in the JSON object returned from the API call
           */
          for (var i = 0; i < num_posts; i++) {
            var date       = new Date(posts[i].date);
            var time       = date.toLocaleTimeString();
            var month      = date.getUTCMonth() + 1;
            var day        = date.getUTCDate();
            var year       = date.getUTCFullYear();
            var time_stamp = month + "/" + day + "/" + year;

            var date_posted = '<div class="date">' + "<h4>" + time_stamp + "</h4>" +
                              '<h4 style="padding-bottom:0.5em;color:#999">' + time + "</h4></div>";


            if (post_type == "audio") {
              // Only display audio posts that don't have the Spotify player
              if (posts[i].audio_type != "spotify") {
                output += formatPost(posts[i], date_posted, post_type);
              }
            }
            else {
              output += formatPost(posts[i], date_posted, post_type);
            }
          }

          var pagination_preference = $("#pagination-preference").val();

          /**
           * If infinite, append posts to previously loaded posts
           * If manual, always set to new posts, getting rid of all previous posts
           */
          if (pagination_preference == "infinite") {
            console.log("infinite");
            content.append(output);
          } else {
            content.html(output);
          }

          // For each image returned in a post, add the img-responsive class
          content.find('img').each(function() {
            $(this).addClass('img-responsive');
          });

          /**
           * 
           * Let's us know if we are good to go to load more data, prevents
           * infinite call to the next set of data
           */
          var content_loaded = 1;

          if (pagination_preference == "infinite") {

            $("#page-selection").hide();

            // Load next set of posts once user has scroll passed a certain point
            $(document).scroll(function() {
              var units_from_bottom = $(document).height() - $(window).height() - $(window).scrollTop();

              if (units_from_bottom < 500 && content_loaded == 1) {
                // Get the next page of posts
                $("#page-selection a:last").click();
                content_loaded = 0;
              }
            });
          }
        }
      } // End success function
    });
    console.log(url);
  }

  /**
   * Initializes functionality for the search bar when a user enters
   * a Tumblr username to lookup
   */
  function initSearchBar() {

    $("#user-search").on('keydown', function(e) {

      var post_type = $("#post-type").val();
      // On enter-press
      if (e.which == 13 || e.keyCode == 13) {

      	$("#pagination-preference").hide();

      	$("#content").empty();
      	$("#page-selection").bootpag({
      		page: 1
      	});

        user = $(this).val();

        fetchPosts(user, post_type, 0, posts_per_page);
        return false;
      }
    });
  }

});