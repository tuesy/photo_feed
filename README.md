# Overview

Photo Feed is an MRE app that shows what's happening in Altspace through photos. When people share their photos with the community, everyone can see them and even join them.

# How to Share a Photo with the Community

NOTE: We hope to make this easier in the future by integrating it into our client but for now please use our website.

1. Go to your photos on altvr.com: http://account.altvr.com/photos
2. Find you photo you want to share and click "Edit"
3. Add a hashtag (e.g. "campfire")
4. Make sure "Share with the Community" is checked
5. Click "Update"

# Usage
By default, the app will allow you to click on "Photo Feed" and enter a hashtag to filter by:

> wss://mankindforward-photo-feed.herokuapp.com

You can also pre-configure the app to filter photos with a specific hashtag using the "q" parameter. For example:

> wss://mankindforward-photo-feed.herokuapp.com?q=campfire

# Development
* Fork this repo
* Create a Heroku app and link it to your github repo
* Enable auto deploys from github
* In Altspace:
  * Open World Editor > Altspace > Basics > SDK App
  * `ws://<your subdomain>.herokuapp.com` (port 80)
  * Click Confirm