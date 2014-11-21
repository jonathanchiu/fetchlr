# Fetchlr

<iframe src="http://gfycat.com/ifr/HonorableClosedDragon" frameborder="0" scrolling="no" width="706" height="752" style="-webkit-backface-visibility: hidden;-webkit-transform: scale(1);" ></iframe>

![fetchlr](fetchlr.gif)

Fetchlr allows a user to "fetch" posts of a specific post type from a given Tumblr username/blog, and displays them in a clean, minimalistic way. It interacts with the Tumblr API, parses and cleans up the JSON response, and returns a set of posts based on what the user has specified.

Fetchlr aims to provide specific and targetted functionalities which Tumblr currently lacks for regular everyday users, mainly:
  - Getting posts of a specific post type (e.g. text, photo, audio) from a blog
  - Getting liked posts of a specific post type from a blog

### Motivation/Purpose
I am a daily user of Tumblr and often times, my friends and I want to view posts of a specific post type, such as photos or audio, from a blog. Sometimes I want to read text posts my friends have posted as well. 

Most if not all blogs:
  - Make posts of varying types (text, audio, photo, quotes, etc)
  - Have potentially made thousands of posts since the creation of their account

It can be quite time consuming to sift through thousands of posts before coming across the type of post I want to see. With how Tumblr is setup currently, if I want to only view the photo posts a blog has posted, I can't. Tumblr provides an archive link for all blogs, which "archives" all posts ever made, but it doesn't filter on post type, and only filters on month and year (whose result set could again, contain potentially hundreds of posts, all of different post types).

Additionally Tumblr doesn't provide any way for users to view liked posts of a specific type. The "liked" page of a Tumblr user contains <i>all</i> posts the user has liked since the creation of their account, potentially containing thousands of posts (I myself have about 5,000 liked posts). A similar scenario arises: I like posts of all types, but if I want to view only the photo posts I've liked, I can't. I have to sift through potentially hundreds of other posts of varying types before I come across a photo.

Fetchlr seeks to mitigate the above scenarios!

### Tech
Fetchlr utilizes the following technologies and wouldn't have been possible without them:
* [Twitter Bootstrap]
* [jQuery]
* [jQuery bootpag] - Neat jQuery plugin that helped greatly pagination
* [Digital Ocean] - Hosted on a Digital Ocean droplet
* [node.js] - Powered by Node.js (web server file not in the repo)
* [tumblrwks] - Node.js package for easier and syntactically cleaner interaction with Tumblr API

### Todo's
Fetchlr still needs a lot of work. If you have suggestions or found a bug, please shoot me an email!
 - Add functionality for more post types (quote, link, answer, video, chat)
 - Clean-up (naming, whitespace, etc) and abstract more of the Javascript code
 - Improve generation of dynamic pagination
 - Improve general application design, and styling of displayed posts (the CSS needs a lot of work)
 - Work on logic for filtering likes of a specific post type
 - General bug fixes

### Changelog
11/15/14
 - Added ability to fetch video posts
 - Added infinite scroll option so users don't have to access pagination to get next set of posts
 - Fixed up some pagination logic, still needs a little work
 - Cleaned-up JS code, still needs work

11/18/14
 - Delegated fetching of post data to server, also obscures API keys from public eyes! (seems to have made fetching of data a lot quicker as well, but I'm not 100% sure..)
 - Make any images or videos returned responsive
 - Changed font to Montserrat
 - Removed filtering on likes for the time being, until I can find a better way to accurately display the result set
 - Added ability to fetch quote posts
 - Improved error handling
 - Added corresponding post tags to all posts displayed, which link back to user's Tumblr e.g. bob.tumblr.com/tagged/tag_name_here
 - Updated README.md

11/20/14
 - All post types have now been accounted for! :)

[Tumblr API]:https://www.tumblr.com/docs/en/api/v2
[Digital Ocean]:https://www.digitalocean.com
[node.js]:http://nodejs.org
[Twitter Bootstrap]:http://twitter.github.com/bootstrap/
[jQuery]:http://jquery.com
[tumblrwks]:https://github.com/arkxu/tumblrwks
[jQuery bootpag]:http://botmonster.com/jquery-bootpag/
