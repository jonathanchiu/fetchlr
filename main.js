$(function() {

	$("#post-type").change(function() {
		var post_type = $("#post-type").val();
		if (post_type == "likes") {
			$("#likes-radio-group").show();
		} else {
			$("#likes-radio-group").hide();
		}
	});

	// Pagination - http://botmonster.com/jquery-bootpag/#.VERtcPnF9ie

	var api_key = "api_key_goes_here";
	var result = '';
	var user = '';
	var page_count;

	if (page_count == undefined) {
		page_count = 10;
	}

	/**
	 * Sets the offset variable based on the page number clicked for use
	 * later in the API call to fetch posts
	 * 
	 * num -> int (or string?) representing page number clicked
	 */
	$('#page-selection').bootpag({ }).on("page", function(event, num) {
  	if (num == 1) {
  		var offset = 0;
  	}
  	else {
  		if ($("#post-type").val() == "likes") {
  			var offset = (parseInt(num, 10) * 50) - 50;
  		} else {
  			var offset = (parseInt(num, 10) * 20) - 20;
  		}
  	}
  	var offset_formatted = "&offset=" + offset.toString();

  	// Get the post type the user selected
  	var post_type = $("#post-type").val();
  	var liked_post_type = $("input:radio[name=likes-post-type]:checked").val();
    getTumblrPosts(user, post_type, liked_post_type, offset_formatted);
  });


	function makePost(content) {
		return '<div class="post">' + content + '</div>';
	}
	function makeError(content) {
		return '<div id="error"><p class="bg-danger">' + content + '</p></div>';
	}

	function formatPost(post, date, type) {

		if (type == "photo") {
			var img_src  = post.photos[0].alt_sizes[1].url;
			var img_html = '<img src="' + img_src + '">';
			var caption  = post.caption;
			var formatted = makePost(date + img_html + caption);
		}

		else if (type == "audio") {
			var player  = post.player;
			var caption = post.caption;
			var formatted = makePost(date + player + caption);
		}


		return formatted;
	}

	function formatLikedPost(post, date, liked_post_type) {

		if (liked_post_type == "text") {
			var body = post.body;
			var formatted = makePost(date + body);
		}

		else if (liked_post_type == "audio") {
			var player  = post.player;
			var caption = post.caption;
			var formatted = makePost(date + player + caption);
		}

		else if (liked_post_type == "photo") {
			var img_src  = post.photos[0].alt_sizes[1].url;
			var img_html = '<img src="' + img_src + '">';
			var caption  = post.caption;
			var formatted = makePost(date + img_html + caption);
		}
		return formatted;
	}

	function getTumblrPosts(username, type, liked_post_type, params) {

		if (params == undefined) {
			params = '';
		}

		// API call for liked posts is formatted differently
		if (type == "likes") {
			var url = "http://api.tumblr.com/v2/blog/" + username + ".tumblr.com/likes?api_key=" + api_key + '&limit=50' + params;
		} 
		// Else, set API call to standard URL
		else {
			var url = "http://api.tumblr.com/v2/blog/" + username + ".tumblr.com" + "/posts/" + type + "?api_key=" + api_key + params;
		}
		console.log(url);
		console.log(page_count);



		$.ajax({
			url: url,
			dataType: 'jsonp',
			success: function(results) {
				console.log(results);

				// Dynamically calculate total number of pages to show for the pagination
				if (type != "likes") {
					page_count = Math.ceil(results.response.total_posts / 20);
				} else {
					page_count = Math.ceil(results.response.liked_count / 20);
				}

				// Initialize # of pages/# of pages visible at a time
				$('#page-selection').bootpag({
      	  total: page_count,
      		maxVisible: 10
	    	});



				// Tumblr username doesn't exist
				if (results.meta.status === 404) {
					var error = makeError("ERROR: User not found");
					$("#content").append(error);
					setTimeout(function() {
						$("#error").fadeOut(400);
					}, 1000);
				}
				// Tumblr user has restricted his/her likes from being viewed
				else if (results.meta.status === 401) {
					var error = makeError("ERROR: User's likes are restricted");
					$("#content").append(error);
					setTimeout(function() {
						$("#error").fadeOut(400);
					}, 1000);
				}
				// Tumblr username exists
				else {

					// All post types default to being stored where key is posts
					if (type != "likes") {
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
					 * the post type the user requested, in the JSON object returned from the API call
					 */
					for (var i = 0; i < num_posts; i++) {
						var date_posted = "<h4>Date Posted: " + posts[i].date + "</h4>";

						// If user wants text posts
						if (type == "text") {
							output += makePost(date_posted + posts[i].body);
						}
						else if (type == "photo") {
							output += formatPost(posts[i], date_posted, type);
						}	
						else if (type == "audio") {
							// Only display audio posts that don't have the Spotify player
							if (posts[i].audio_type != "spotify") {
								output += formatPost(posts[i], date_posted, type);
							}
						}
						else if (type == "likes") {
							var this_post_type = posts[i].type;
							if (this_post_type == liked_post_type) {
								output += formatLikedPost(posts[i], date_posted, liked_post_type);
							}
						}
					}

					$("#content").empty();
					$('#content').html(output);
					console.log(results);
				} // end else
			}
		});
}

	$("#user-search").on('keydown', function(e) {
		var post_type = $("#post-type").val();
		var liked_post_type = $("input:radio[name=likes-post-type]:checked").val();
		// On enter-press
		if (e.which == 13 || e.keyCode == 13) {
			user = $(this).val();
			if (post_type == "likes" && liked_post_type == undefined) {
				alert("You must select a post type for the liked posts returned");
			} else {
				getTumblrPosts($(this).val(), post_type, liked_post_type, '');
			}
			return false;
		}
	});

});