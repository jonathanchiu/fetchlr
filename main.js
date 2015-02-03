$(function() {

  initFixedPagination();
  initSearchBar();
  handlePaginationClick();

  var posts_per_page = 10;
  var user;
  var avatars = { };

  /**
   * If the user scrolls past a certain point, the pagination bar
   * will follow such that it is always visible to the user
   */
  function initFixedPagination() {

    $(window).scroll(function() {
      if ($(this).scrollTop() > 280) {
        $("#page-selection").addClass("pagination-fixed");
      }
      else {
        $("#page-selection").removeClass("pagination-fixed");
      }
    });
  }


  /**
   * Sets the offset variable whenever a page number is clicked. The offset is
   * calculated based on the page number, and is later used in the URL for
   * the API call
   */
   function handlePaginationClick() {
    // Variable "num" represents which page # on the pagination was clicked
    $('#page-selection').bootpag({ }).on("page", function(event, num) {

      // Represents which post number to start the fetch from
      var offset;
      var post_type = $("#post-type").val();

      offset = (num == 1) ? 0 : (parseInt(num, 10) * 10) - 10;
      fetchPosts(user, post_type, offset, posts_per_page);

      $("html, body").animate({ scrollTop: 0 }, 800);
    });
  }

  /**
   * Generate string representing div containing post content
   */
   function makePost(content) {
    return '<div class="post">' + content + '</div>';
  }
  /**
   * Generate string representing div containing an error message
   */
   function makeError(content) {
    var error = '<div class="error"><p class="bg-danger">' + content + '</p></div>';
    $("#content").append(error);

    setTimeout(function() {
      $(".error").fadeOut(800);
    }, 1600);
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
    var post_footer     = '<div class="post-footer">';
    var all_tags        = '';
    var tags            = '';
    var reblog_info     = '';

    // If the post was a reblog, get the username it was reblogged from and get
    // the original poster of the reblog
    if ("reblogged_from_name" in post && "reblogged_root_name" in post) {
      var reblogged_from_link = '<a href="http://' + post.reblogged_from_name + '.tumblr.com">' + post.reblogged_from_name + '</a>';

      var reblogged_root_link = '<a href="http://' + post.reblogged_root_name + '.tumblr.com">' + post.reblogged_root_name + '</a>';
      reblog_info             = "<small>Reblogged from: " + reblogged_from_link + '&nbsp;&middot;&nbsp;' + "Source: " + reblogged_root_link + '&nbsp;&middot;&nbsp;';
      reblog_info             += "Notes: " + post.note_count + "</small>";
      post_footer             += reblog_info;
    }
    // Else it is not a reblog so just get the # of notes
    else {
      var note_count = '<div class="note-count">' + post.note_count + '</div>';
      post_footer += "<small>Notes: " + post.note_count + "</small>";
    }

     // If tags exist for a post
    if (post.tags.length > 0) {
      $.each(post.tags, function(i, v) {
        var tag = "#" + v + " ";
        var url = "http://" + user + ".tumblr.com/tagged/" + v.replace(/ /g, "-");
        tags    += '<a href="' + url + '" target="_blank">' + tag + '</a>'
      });

      var all_tags = '<div class="tags">' + tags + '</div>';
      post_footer += all_tags + '</div>';
    }
    else {
      post_footer += '</div>';
    }

    // If post is a photo
    if (type == "photo" || liked_post_type == "photo") {

      var img_html = '';
      var length = post.photos.length;

      for (var i = 0; i < length; i++) {
        var img_src  = post.photos[i].alt_sizes[0].url;
        img_html    += '<img class="photo" src="' + img_src + '">';
      }
      var caption  = post.caption;
      formatted    = makePost(date + img_html + caption + post_footer);
    }

    // If post is audio
    else if (type == "audio" || liked_post_type == "audio") {
      var player  = post.player;
      var caption = post.caption;
      formatted   = makePost(date + player + caption + post_footer);
    }

    else if (type == "text" || liked_post_type == "text") {
      var body  = post.body;
      var title = '';

      if (post.title != null) {
        title = "<h3>" + post.title + "</h3>";
      }

      formatted = makePost(date + title + body + post_footer);
    }

    else if (type == "quote" || liked_post_type == "quote") {
      var quote        = '<div class="quote"><blockquote>' + post.text + '</blockquote></div>';
      var quote_source = '<div class="quote-source">' + post.source + '</div>';
      formatted        = makePost(date + quote + quote_source + post_footer);
    }

    else if (type == "answer" || liked_post_type == "answer") {
      var question = '<div class="question"><blockquote>' + post.question + '</blockquote></div>';
      var answer   = '<div class="answer">' + post.answer + '</div>';
      formatted    = makePost(date + question + answer + post_footer);
    }

    else if (type == "link" || liked_post_type == "link") {
      var title        = "<h3>" + post.title + "</h3>";
      var description  = post.description;
      var original_url = '<a target="_blank" href="' + post.url + '">Source</a>'
      formatted        = makePost(date + title + description + original_url + post_footer);
    }

    else if (type == "chat" || liked_post_type == "chat") {
      var chat = '<div class="chat"><p>';

      var dialogue        = post.dialogue;
      var dialogue_length = dialogue.length;

      for (var i = 0; i < dialogue_length; i++) {
        var sender   = "<strong>" + dialogue[i].label + "</strong> ";
        var message  = dialogue[i].phrase;
        var line     = sender + message + "<br>";
        chat        += line;
      }

      chat += '</p></div>';
      formatted = makePost(date + chat + post_footer)
    }

    else if (type == "video" || liked_post_type == "video") {
    	/**
    	 * Given HTML string representing video embed, convert it to a jQuery
    	 * object, set its attributes to make it responsive, and return the
    	 * responsive embed code
    	 *
    	 * video -> HTML5 video embed string
    	 */
      function responsify(video) {

        var responsive_video = $(video).attr("class", "embed-responsive-item");
        responsive_video     = responsive_video.prop("outerHTML");

        return '<div class="embed-responsive embed-responsive-16by9">' +
        responsive_video +
        '</div>';
      }

    	// Tumblr player doesn't have video controls, so we must invoke the attr
    	if (post.video_type == "tumblr") {
    		var tumblr_video = $(post.player[2].embed_code);
    		tumblr_video.attr("controls", "controls");
    		var embed_video = tumblr_video.prop("outerHTML");
    	}
      else {
    		var embed_video = post.player[2].embed_code;
    	}

    	formatted = makePost(date + responsify(embed_video) + post.caption + post_footer);
    }
    return formatted;
  }

  /**
   * Get the given user's avatar
   */
   function fetchAvatar(username) {

    if (username in avatars) {
      return avatars[username];
    } else {

      var data = JSON.stringify({
        blog_name: username
      });

      $.ajax({
        url: "/avatar",
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: data,
        success: function(results) {
          avatars[username] = results.avatar_url;
          return avatars[username];
        }
      });
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

    var post      = (post_type == "likes") ? "likes" : "posts";
    var blog_name = username + ".tumblr.com";
    var url       = "/fetch";

    var data = JSON.stringify({
      blog_name: username,
      post: post,
      post_type: post_type,
      offset: offset,
      limit: limit
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

        var error = jQuery.isEmptyObject(results) || results.total_posts === 0;
        var content = $("#content");
        $("#loader").remove();

        // If the blog username the user provided produced an error response
        if (error) {
          $("#page-selection").hide();
          var error_msg = '';
          $("#page-selection").hide();
          if (post_type == "likes") {
            error_msg = "That user's likes are private.";
          } else {
            error_msg = "The username you entered does not exist or has no posts.";
          }
          makeError(error_msg);
        }

        // Else, no error response was returned!
        else {
          var output = '';
          var posts = '';
          var num_posts = '';

          $("#page-selection").show();

          // Dynamically calculate total number of pages to show for the pagination
          if (post_type == "likes") {
            posts = results.liked_posts;
            num_posts = results.liked_count;
          }
          else {
            posts = results.posts;
            num_posts = results.total_posts;
          }

          // Calculate number of pages to show for the pagination
          var page_count = Math.ceil(num_posts / 10);

          $('#page-selection').bootpag({
            total: page_count,
            maxVisible: 7,
            next: 'Next',
            prev: 'Previous',
            leaps: false
          });

          console.log(page_count);
          console.log(num_posts);

          /**
           * For each Tumblr post, pass it as an argument along with the post
           * date and type to the formatPost function which will handle displaying
           * of the actual post content
           */
          for (var i = 0; i < posts_per_page; i++) {
            var date       = new Date(posts[i].date);
            var time       = date.toLocaleTimeString();
            var month      = date.getMonth() + 1;
            var day        = date.getDate();
            var year       = date.getFullYear();
            var time_stamp = month + "/" + day + "/" + year;

            var date_posted = '<div class="date">' + "<h4>" + time_stamp + "</h4>" +
            '<h4 style="color:#a4a4a4">' + time + "</h4></div>";

            output += formatPost(posts[i], date_posted, post_type);
          }

          var pagination_preference = $("#pagination-preference").val();

          /**
           * If infinite, append posts to previously loaded posts
           * If manual, replace all previous posts in DOM with new posts
           */
          if (pagination_preference == "infinite") {
            content.append(output);
          } else {
            content.html(output);
          }

          // For each image returned in a post, add the img-responsive class
          content.find('img').each(function() {
            $(this).addClass('img-responsive');
          });

          /**
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
      }
    });
}

  /**
   * Initializes functionality for the search bar when a user enters
   * a Tumblr username to lookup
   */
   function initSearchBar() {

    $("#user-search").on('keydown', function(e) {
      // On enter-press
      if (e.which == 13 || e.keyCode == 13) {
        $("#search-btn").click();
        return false;
      }
    });

    $("#search-btn").click(function() {
      search();
      return false;
    });
  }

  /**
   * Search for posts from specified user and post type
   */
  function search() {

    var post_type = $("#post-type").val();
    $("#pagination-preference").parent().remove();

    $("#content").empty();
    $("#page-selection").bootpag({
      page: 1
    });

    user = $("#user-search").val();

    fetchPosts(user, post_type, 0, posts_per_page);
    return false;
  }
});
