#Notifyler v0.0.2
Notifyler is a blazing fast message sender. It threads out all tasks and runs them independently of your webserver, so you can chomp down on mass message sendings quickly and without killing your poor W/M/LAMP stack. It is redundant and crash-safe, thanks to the super-speedy Redis NoSQL engine. The currently supported protocols are:

- Email (SMTP server needed)
- Twitter
- SMS using [Twilio](https://www.twilio.com)
- Snail mail with [PostalMethods](http://www.postalmethods.com/)

You will need Redis and NPM in order to run this. You will also need make installed, as Notifyler uses some C dependencies, that need to be compiled on install, for speed. On RHEL systems, you can run `yum -y install redis npm make`.

##Installation

- Clone this repository into a directory on your webserver, and `cd` to it.
- Run `npm install`. This will install the required dependencies..
- Run `npm start` to run it. You can then make requests to the app and access the web interface on `127.0.01:3636`

##Configuration
All config files are stored in `/config`. The main configuration is stored in `/config/app.js`.

    module.exports = {
	    "spur_threads": 10,
	    "redis_password": "",
	    "auth_token": "<your key>",
	    "password": "<your password>",
	    "update_interval": 200
	}

- `spur_threads` is the number of threads to run asynchronously while sending messages.
- `redis_password` is the password for your redis server, if any.
- `auth_token` is like the API Key for sending messages to Notifyler. We recommend it to be at least 512 bytes in complexity. There is no limit to its length or character set.
- `password` is the password to access the web GUI.
- `update_interval` is the minimum time between updates which are sent to the client.

###email.js
    module.exports = {
	    "server": {
	        "user": "<username>",
	        "password": "<password>",
	        "host": "<server>",
	        "ssl": false,
	        "timeout": "10 * 1000"
	    },
	    "sender": {
	        "from": "YourCompany <notifyler@example.com>"
	    }
	}
This is self explanatory. The `server` is sent to [emailjs](https://github.com/eleith/emailjs), so you are not limited only to these options.

###postal.js

    module.exports = {
    	'default': {
    		'username': '<username>',
    		'password': '<password>'
    	}
    }

Your [PostalMethods](http://www.postalmethods.com/) details go here. Multiple accounts are able to be used (and selected, see *Making Requests*), so you can add more beyond `default`.

###sms.js

    module.exports = {
	    "account_sid": "<accountsid>",
	    "auth_token": "<authtoken>",
	    "phone_number": "<phonenumber>"
	}

Enter your [Twilio](https://www.twilio.com) SID, Auth Token, and Phone Number in here.

###twitter.js

    module.exports = {
		"default" : { "access_token_key" : "<access token>",
	    	"access_token_secret" : "<access token secret>",
	    	"consumer_key" : "<consumer key>",
	    	"consumer_secret" : "<consumer secret>"
	    }
	}

You'll need to [register a new Twitter app](https://dev.twitter.com/apps/new) to get these keys. You will then need go to the Settings Tab, scroll to Application Type, and select the "Read and Write" radio box before hitting the Update button at the bottom of the page. Then, go back to the Detail tab and hit the Access Token button at the bottom of the page. This will generate for you your access tokens, which you can enter.

Like Postal, this method supports multiple accounts/access keys which you can use.

##Making Requests
To make a request to Notifyler, you'll need to encode the options into a JSON string and sent it in the POST body to `http://yoursite.com:3636/push`. A basic request to, say, post a Twitter status, may look like this:

	{
	    "key": "<your key>",
		"messages: {
	        "twitter": "Hello World!"
	    },
	    "recipients": [
	        "twitter:default"
	    ]
	}

Not too hard, eh? You send your key, give a message for Twitter, and set the `default` Twitter account as the recipient. How about if we wanted to send an email message *and* Tweet that the same time. But not now, let's wait sixty seconds before we send it.

	{
	    "key": "<your key>",
		"delay": 60,
		"messages: {
	        "twitter": "Hello World!",
			"email": {
				"subject": "Hello World!",
				"text": "It's a lovely day today, isn't it?"
			}
	    },
	    "recipients": [
	        "twitter:default",
			"email:joe@example.com",
			"email:bob@example.com"
	    ]
	}

Pretty simple. We told Notifyler to wait a minute before we sent the messages, and then we send a tweet and emails to Joe and Bob at example.com. That's how requests are made, read below for the formats for each type of request.

###Email
####Message Format

    "email": {
        "subject": "Hello World!",
        "text": "It's a lovely day today, isn't it?"
    }

Again, this is passed into into [emailjs](https://github.com/eleith/emailjs), so feel free to add or change more options.
####Recipient Format

	"email:joe@example.com"

Sends an email to `joe@example.com`.

###Postal
####Message Format

    "postal": {
        "description": "This is a letter I'm sending to Joe.",
        "extension": "pdf",
		"data": "<a bunch of data>"
    }

The `description` is the internal "MyDescription" for PostalMethods. The `extension` is the extension type (see their supported types [here](http://www.postalmethods.com/supported)) and the `data` is a Base64 encoded version of the document.

####Recipient Format

	"postal:default"

Sends an message using the `default` access profile. Note that the actual recipient must be contained within the document, per PostalMethods rules.

###SMS
####Message Format

    "sms": "My new Notifyler status!"

Pushes the given string as an SMS message.

####Recipient Format

	"sms:+12223334444"

Sends an SMS message to the given number.

###Twitter
####Message Format

    "twitter": "My new Notifyler status!"

Pushes the given string as a Twitter status.

####Recipient Format

	"twitter:default"

Sends Tweet using the `default` access profile.

