$(function() {

  var api_key = "";
  var user;

  initSearchBar();
  handleLikesSelect();

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
          // Gets 50 posts at a time
          var offset = (parseInt(num, 10) * 50) - 50;
        } else {
          // Gets 20 posts at a time
          var offset = (parseInt(num, 10) * 20) - 20;
        }
      }
      var offset_formatted = "&offset=" + offset.toString();
      var liked_post_type = $("input:radio[name=likes-post-type]:checked").val();
      fetchPosts(user, post_type, liked_post_type, offset_formatted);
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

    if (type == "photo" || liked_post_type == "photo") {
      var img_src   = post.photos[0].alt_sizes[1].url;
      var img_html  = '<img src="' + img_src + '">';
      var caption   = post.caption;
      var formatted = makePost(date + img_html + caption);
    }

    else if (type == "audio" || liked_post_type == "audio") {
      var player    = post.player;
      var caption   = post.caption;
      var formatted = makePost(date + player + caption);
    }

    else if (type == "text" || liked_post_type == "text") {
      var body = post.body;
      var formatted = makePost(date + body);
    }

    return formatted;
  }

  /**
   * Check to see if the given API response contains an error
   */
  function didError(results) {
    // Error was returned
    if (results.meta.status !== 200) {

      // Tumblr username doesn't exist
      if (results.meta.status === 404) {
        var error = makeError("ERROR: User not found");
      }
      // Tumblr user has restricted his/her likes from being viewed
      else if (results.meta.status === 401) {
        var error = makeError("ERROR: User's likes are restricted");
      }
      else {
        var error = makeError("ERROR: Some other error occurred :(");
      }
      return [true, error];
    } else {
      return [false];
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
      var url = "http://api.tumblr.com/v2/blog/" + username + ".tumblr.com/likes?api_key=" + api_key + '&limit=50' + params;
    }
    else {
      var url = "http://api.tumblr.com/v2/blog/" + username + ".tumblr.com" + "/posts/" + post_type + "?api_key=" + api_key + params;
    }
    console.log(url);

    $.ajax({
      url: url,
      dataType: 'jsonp',
      success: function(results) {
        console.log(results);

        // Dynamically calculate total number of pages to show for the pagination
        if (post_type != "likes") {
          var page_count = Math.ceil(results.response.total_posts / 20);
          console.log("Page Count: " + page_count);
          console.log("Num Posts: " + results.response.total_posts);
        } else {
          var page_count = Math.ceil(results.response.liked_count / 20);
          console.log("Page Count (Likes): " + page_count);
          console.log("Num Posts (Likes): " + results.response.liked_count);
        }

        // Checks to see if error was returned
        if (didError(results)[0]) {
          $("#error").remove();
          $("#content").append(didError(results)[1]);

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

          displayPosts(results);

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

            // If user wants text posts
            if (post_type == "text") {
              output += makePost(date_posted + posts[i].body);
            }
            else if (post_type == "photo") {
              output += formatPost(posts[i], date_posted, post_type);
            } 
            else if (post_type == "audio") {
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
            }
          }

          $("#content").empty();
          $('#content').html(output);
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

        user = $(this).val();

        if (post_type == "likes" && liked_post_type == undefined) {
          alert("You must select a post type for the liked posts returned");
        } else {
          fetchPosts(user, post_type, liked_post_type, '');
        }
        return false;
      }
    });
  }

});