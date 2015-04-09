// Use Express for routing
var express = require('express');

// bodyParser puts form POST's into req.body
var bodyParser = require('body-parser');

// Postgres is the DB
var pg = require('pg');

var session = require('express-session');

// Use methodOverride to permit PUT or PATCH + DELETE HTTP verbs
var methodOverride = require('method-override');

var app = express();

// Use EJS for templating
app.set('view engine', 'ejs');

// The "extended" syntax allows for rich objects and arrays to 
// be encoded into the URL-encoded format, allowing for a 
// JSON-like experience with URL-encoded.
app.use(bodyParser.urlencoded({extended: true}));

// Set up method override to work with POST requests that have 
// the parameter "_method=DELETE", etc
app.use(methodOverride('_method'));

// Express session uses cookies to store User state
app.use(session({
	// Required option: This is the secret used to sign the 
	// session ID cookie
	secret: 'taco for now',

	// Forces the session to be saved back to the session 
	// store, even if the session was never modified during 
	// the request
	resave: false,

	// Forces a session that is "uninitialized" to be saved to 
	// the store. A session is uninitialized when it is new but 
	// not modified.
	saveUninitialized: true
}));

// Create middleware methods that are available for every 
// route request: login() + currentUser() + logout()
app.use('/', function(req, res, next) {

    // Save user session on req, and identify it w/ user.id
    // To logout, just erase this session information
    
    // 1.
    req.login = function(user) {
        // set the value on session.userId
        req.session.userId = user.id;
    };
    
	// 2.
	req.currentUser = function() {

		// Search User table for id that matches the
		// userId in cookie session
		return db.User.find({
	        where: {id: req.session.userId}

	    // 
	    }).then(function(user) {
	        req.user = user;
	        return user;
	    });
	};
  
  	// 3. 
	req.logout = function() {
    	req.session.userId = null;
		req.user = null;
	}

	// Go to next middleware, or route ...
	next();
});

// Look up models with sequelize's auto-created 
// /models/index.js file.  For this project, we have 3 data
// models: ARTICLES + AUTHORS + USERS
var db = require("./models");

// ARTICLES ROUTES

app.get('/articles', function(req,res) {
	console.log("GET /articles");
	db.Article.findAll({include: db.Author})
  	.then(function(dbArticles) {
  		res.render('articles/index', {articlesList: dbArticles});
  	});
});

app.get('/articles/new', function(req,res) {
	db.Author.all()
  	.then(function(dbAuthors) {
	  res.render('articles/new', {ejsAuthors: dbAuthors});
  	});
});

app.post('/articles', function(req,res) {
	console.log('req.body: ', req.body);
	var body = req.body.article;
	console.log('body: ', body);

	db.Article.create(body)
  	.then(function(dbArticle) {
  		console.log(dbArticle);
  		res.redirect('/articles');
  	});
});

app.get('/articles/:id', function(req, res) {
	var id = req.params.id;

	db.Article.find({include: [db.Author], where: {id: id}})
  	.then(function(dbArticle) {
  		res.render('articles/article', {articleToDisplay: dbArticle, id: id})
  	});
});

app.get('/articles/:id/edit', function(req, res) {
	var id = req.params.id;

	db.Article.find({include: [db.Author], where: {id: id}})
  	.then(function(dbArticle) {
  		res.render('articles/edit', {article: dbArticle})
  	});
});

app.put('/articles/:id', function(req, res) {
	var id = req.params.id;

	db.Article.find(id)
	.then(function(dbArticle) {
		dbArticle.updateAttributes({
			title: req.body.article.title,
			content: req.body.article.content})
                .then(function(savedArticle) {
                  res.redirect('/articles/'+id);
                });
	});
});

// AUTHORS ROUTES

app.get('/authors', function(req, res) {
	console.log("GET /authors")

	db.Author.all()
  	.then(function(dbAuthors) {
  		res.render('authors/index', {ejsAuthors: dbAuthors});
  	});
});

app.get('/authors/new', function(req, res) {
	console.log("GET /authors/new")
	res.render('authors/new');
});

app.post('/authors', function(req, res) {
	console.log(req.body);

	db.Author.create(req.body.author)
	.then(function(dbAuthor) {
		res.redirect('/authors');
	});
});

app.get('/authors/:id', function(req, res) {
	console.log("GET /authors/:id")

	db.Author.find({include: db.Article, where: {id: req.params.id}})
  	.then(function(dbAuthor) {
  		res.render('authors/author', {ejsAuthor: dbAuthor})
  	});
});

// USER SIGNUP/LOGIN ROUTES

// Welcome/Sign-up Page: Posts to /users
app.get('/signup', function(req, res) {
	res.render('users/signup');
});

// Attempt to create a user; if successful, send them to the login
// page; otherwise, redirect back to the /signup route
app.post('/users', function(req, res) {
	var user = req.body.user;

    db.User.
	    createSecure(user.email, user.password)
		.then(function(dbUser) {
			if (dbUser) {
				console.log('User ' + dbUser.email + ' successfully created!');
	        	res.redirect('/login');
			} else {
				console.log('User not created');
				res.redirect('/signup');
			}
	    });

});

// Post form to /users
app.get('/login', function(req, res) {
	res.render('login');
});

// If user authenticates, send them to the /profile route; otherwise,
// return them to /login route
app.post('/login', function(req, res) {
    var user = req.body.user;
    
    db.User
    .authenticate(user.email, user.password)
    .then(function(dbUser) {
    	if (dbUser) {
    		console.log('User ' + dbUser.email + ' authenticated!');
	        req.login(dbUser);
	        res.redirect('/profile');

	    // Our error handling on authentication is very
	    // minimal at this point, so if authentication does
	    // not produce a user, then just redirect to the
	    // login route
	    } else {
	    	res.redirect('/login');
	    }
    });
});

// Use a promise any time that a database request, or in this case
// a cookie, is checked
app.get('/profile', function(req, res) {
  	req.currentUser()
    	.then(function(user) {
    		console.log('User ' + user.email + ' pulled from session!');
    		res.render('users/profile', {user: user});
    });
});

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/login');
});

// STATIC PAGE ROUTES

app.get('/', function(req,res) {
	res.render('site/index');
});

app.get('/about', function(req,res) {
	res.render('site/about');
});

app.get('/contact', function(req,res) {
	res.render('site/contact');
});

app.listen(3000, function() {
	var msg = "* Listening on Port 3000 *";

	/*
	 * When the server starts listening, it displays:
	 *
	 * 	**************************
	 *	* Listening on Port 3000 *
	 *	**************************
	 *
	*/
	console.log(Array(msg.length + 1).join("*"));
	console.log(msg);
	console.log(Array(msg.length + 1).join("*"));
});
