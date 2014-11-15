$(function() {

	var api_key        = "";
	var posts_per_page = 10;
  var user;

  initSearchBar();
  handleLikesSelect();
  handlePaginationClick();

  /**
   * Handles showing/hiding of additional filter options when
   * user selects the "Likes" post type
   */
  function handleLikesSelect() {
    $("#post-type").change(function() {
      var post_type = $("#post-type").val();
      if (post_type == "likes") {
        $("#likes-radio-group").show();
      } else {
        $("#likes-radio-group").hide();
      }
    });
  }

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

      if (num == 1) {
        var offset = 0;
      }
      else {
        var post_type = $("#post-type").val();

        if (post_type == "likes") {
          var offset = (parseInt(num, 10) * 50) - 50;
        } else {
          var offset = (parseInt(num, 10) * 10) - 10;
        }
      }
      var params = "&offset=" + offset + "&limit=" + posts_per_page;
      var liked_post_type = $("input:radio[name=likes-post-type]:checked").val();
      fetchPosts(user, post_type, liked_post_type, params);
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
    return '<div id="error"><p class="bg-danger">' + content + '</p></div>';
  }

  /**
   * Properly retrieves post data from the given JSON object, based on the
   * post type. Calls the makePost function to wrap the data in a div. Returns
   * a div that is ready to be displayed to the user
   *
   * post -> A JSON object representing a Tumblr post
   * date -> A string representing the date the post was made
   * type -> A string representing the post type of the given post
   * liked_post_type -> Optional parameter, if defined we are dealing with liked posts
   */
  function formatPost(post, date, type, liked_post_type) {

  	var formatted;

    if (type == "photo" || liked_post_type == "photo") {
      var img_src   = post.photos[0].alt_sizes[1].url;
      var img_html  = '<img src="' + img_src + '">';
      var caption   = post.caption;
      formatted = makePost(date + img_html + caption);
    }

    else if (type == "audio" || liked_post_type == "audio") {
      var player    = post.player;
      var caption   = post.caption;
      formatted = makePost(date + player + caption);
    }

    else if (type == "text" || liked_post_type == "text") {
			var body  = post.body;
			formatted = makePost(date + body);
    } 

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

    	formatted = makePost(date + local(embed_video) + post.caption);
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
   * liked_post_type -> String - The post type for liked posts to fetch
   * params -> String - Any additional parameters for the API call
   */
  function fetchPosts(username, post_type, liked_post_type, params) {

    if (params === undefined) {
      params = '';
    }

    if (post_type == "likes") {
      var url = "http://api.tumblr.com/v2/blog/" + 
      					username + ".tumblr.com/likes" + 
      					"?api_key=" + api_key + 
      					'&limit=50' + params;
    }
    else {
      var url = "http://api.tumblr.com/v2/blog/" + 
      					username + ".tumblr.com" + 
      					"/posts/" + post_type + 
      					"?api_key=" + api_key + 
      					params;
    }
    
    console.log(url);

    $.ajax({
      url: url,
      dataType: 'jsonp',
      success: function(results) {

      	var content = $("#content");

        console.log(results);

        // Dynamically calculate total number of pages to show for the pagination
        if (post_type != "likes") {
          var page_count = Math.ceil(results.response.total_posts / 10);
          console.log("Page Count: " + page_count);
          console.log("Num Posts: " + results.response.total_posts);
        } else {
          var page_count = Math.ceil(results.response.liked_count / 10);
          console.log("Page Count (Likes): " + page_count);
          console.log("Num Posts (Likes): " + results.response.liked_count);
        }

        // Check to see if API response contained error
        if (didError(results)[0]) {

        	// Remove any previously generated error msg from DOM
          $("#error").remove();
          content.append(didError(results)[1]);

          setTimeout(function() {
            $("#error").fadeOut(400);
          }, 1000);
        }
        
        // Tumblr username exists
        else {

          $('#page-selection').bootpag({
            total: page_count,
            maxVisible: 10
          });

          // All post types default to being stored where key is posts
          if (post_type != "likes") {
            var posts = results.response.posts;
            var num_posts = results.response.posts.length;
          }
          // Liked posts are stored where key is liked_posts
          else {
            var posts = results.response.liked_posts;
            var num_posts = results.response.liked_posts.length;
          }

          var output = '';

          /**
           * For each Tumblr post, access the correct fields that correspond with
           * the post post_type the user requested, in the JSON object returned from the API call
           */
          for (var i = 0; i < num_posts; i++) {
            var date_posted = "<h4>Date Posted: " + posts[i].date + "</h4>";

            if (post_type == "audio") {
              // Only display audio posts that don't have the Spotify player
              if (posts[i].audio_type != "spotify") {
                output += formatPost(posts[i], date_posted, post_type);
              }
            }
            else if (post_type == "likes") {
              var current_post_type = posts[i].type;
              if (current_post_type == liked_post_type) {
                output += formatPost(posts[i], date_posted, undefined, liked_post_type);
              }
            } else {
            	output += formatPost(posts[i], date_posted, post_type);
            }
          }

          var pagination_preference = $("#pagination-preference").val();

          /**
           * If infinite, append posts to previously loaded posts
           * If manual, always set to new posts, getting rid of all previous posts
           */
          if (pagination_preference == "infinite") {
          	content.append(output);
          } else {
          	content.html(output);
          }

          // For each image returned in a post, add the img-responsive class
          content.find('img').each(function() {
          	$(this).attr('class', 'img-responsive');
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
					  		$("#page-selection a:last").click();
					  		content_loaded = 0;
					  	}
					  });

	        } else {
	        	$("#page-selection").show();
	        }

          console.log(results);
        }
      }
    }); 
} 
  /**
   * Initializes functionality for the search bar when a user enters
   * a Tumblr username to lookup
   */
  function initSearchBar() {

    $("#user-search").on('keydown', function(e) {
      var post_type = $("#post-type").val();
      var liked_post_type = $("input:radio[name=likes-post-type]:checked").val();
      // On enter-press
      if (e.which == 13 || e.keyCode == 13) {

      	$("#content").empty();
      	$("#page-selection").bootpag({
      		page: 1
      	});
        user = $(this).val();

        if (post_type == "likes" && liked_post_type == undefined) {
          alert("You must select a post type for the liked posts returned");
        } else {
          fetchPosts(user, post_type, liked_post_type, '&limit=' + posts_per_page);
        }
        return false;
      }
    });
  }

});