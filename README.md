# Fetchlr
Fetchlr is a web application that allows a user to "fetch" specific posts from a given Tumblr username/blog and post type. It queries data from the [Tumblr API] and parses variously formatted (format depends on the post type) JSON objects, fetches the posts corresponding to the specified post type, and displays them for the user.

Fetchlr seeks to mitigate the scenarios outlined under "Motivation," and provide specific functionalities that Tumblr lacks, mainly:
  - Getting posts of a specific post type (e.g. text, photo, audio) from a blog
  - Getting posts of a specific post type from liked posts of a blog

# Motivation
I am a heavy and daily user of Tumblr and often times, my friends and I want to view specific content on a blog such as text, photo, or audio posts from a specific blog. Unfortunately, most if not all blogs usually post content of <i>all</i> types and it's time consuming and annoying to sift through all of them to find the ones you want. 

Even more cumbersome is the fact that Tumblr doesn't provide any way for users to filter posts you, or other people, have liked. The "liked" page of a Tumblr user contains <i>all</i> posts the user has liked since the creation of their account, potentially thousands of posts (I currently have about 3,000 liked posts).

In both scenarios, and with the way Tumblr is currently setup, one can't narrow down posts to only one post type. If I wanted to view only audio posts, I'd potentially have to sift through hundreds of other posts before I find an audio post.

### Tech
Fetchlr utilizes the following technologies and wouldn't have been possible without them:
* [Twitter Bootstrap]
* [jQuery]
* [jQuery bootpag] - Helped greatly with pagination

### Todo's
Fetchlr still needs a lot of work. If you have suggestions or found a bug, please shoot me an email!
 - Add functionality for more post types (quote, link, answer, video, chat)
 - Clean-up (naming, whitespace, etc) and abstract more of the Javascript code
 - Improve generation of dynamic pagination
 - Improve general application design, and styling of displayed posts (the CSS needs a lot of work)

[Tumblr API]:https://www.tumblr.com/docs/en/api/v2
[Digital Ocean]:https://www.digitalocean.com
[node.js]:http://nodejs.org
[Twitter Bootstrap]:http://twitter.github.com/bootstrap/
[jQuery]:http://jquery.com
[jQuery bootpag]:http://botmonster.com/jquery-bootpag/
