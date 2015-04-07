var express = require('express');
var bodyParser = require('body-parser');
var pg = require("pg");
var methodOverride = require("method-override");

var app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// Set up method override to work with POST requests that have the parameter "_method=DELETE"
app.use(methodOverride('_method'));

// Refactor connection and query code
var db = require("./models");

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

	db.Article.find({include: [db.Author], where: {id:id}})
  	.then(function(dbArticle) {
  		res.render('articles/article', {articleToDisplay:dbArticle, id:id})
  	});
});

app.get('/articles/:id/edit', function(req, res) {
	var id = req.params.id;

	db.Article.find({include: [db.Author], where: {id:id}})
  	.then(function(dbArticle) {
  		res.render('articles/edit', {article:dbArticle})
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

// Fill in these author routes!
app.get('/authors', function(req, res) {
	console.log("GET /authors")

	db.Author.all()
  	.then(function(dbAuthors) {
  		res.render('authors/index', {ejsAuthors:dbAuthors});
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

	db.Author.find({include: db.Article, where: {id:req.params.id}})
  	.then(function(dbAuthor) {
  		res.render('authors/author', {ejsAuthor:dbAuthor})
  	});
});

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

	// Just for fun... what's going on in this code?
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
