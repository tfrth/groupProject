var Dotenv = require('dotenv').load();
var Express = require('express');
var Mongoose = require('mongoose');
var BodyParser = require('body-parser');
var Passport = require('passport');
var Session = require('express-session');
var request = require('request');
var GithubStrategy = require('passport-github').Strategy;

//Express
var port = 8888
var app = Express();

//controllers
var userCtrl = require('./lib/controllers/userCtrl');
var bootcampCtrl = require('./lib/controllers/bootcampCtrl');
var projectCtrl = require('./lib/controllers/projectCtrl');
var registerCtrl = require('./lib/controllers/registerCtrl');

//models
var User = require('./lib/models/user');
var Bootcamp = require('./lib/models/bootcamp');

//Mongoose
var mongoUri = 'mongodb://localhost:27017/groupProject';
Mongoose.connect(mongoUri);
var db = Mongoose.connection;
db.on('error', console.error.bind(console,'connection error:'));
db.once('open', function() {
	console.log('connected to db at ' + mongoUri)
});

//middleware
app.use(Express.static(__dirname+'/Public'));
app.use(BodyParser.json());
app.use(Session({
	secret: 'JFDSF98hew98h8hDSOIFoiDijPi3333',
	saveUninitialized: true,
	resave:true
}));
app.use(Passport.initialize());
app.use(Passport.session());

//passport cereal-lizers
Passport.serializeUser(function(user, done) {
  done(null, user);
});
Passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


//endpoints

app.get('/api/user/userInfo', function(req, res) {
	res.status(200).json(req.user)
})
app.get('/api/user/logout', function(req, res){
  req.logOut();
  res.redirect('/#/');
});
// var returnTo = req.query.returnTo;
// app.get('/api/user/logout', function(req, res){
// 	req.logout();
// 	delete req.session;
//   return redir(res, returnTo);

app.get('/api/user/dashboardLink', registerCtrl.dashboardLink);
app.get('/api/user/isLoggedIn', registerCtrl.isLoggedIn);
app.get('/api/randomProjects', projectCtrl.getRandomProjects);
app.post('/api/user', registerCtrl.updateOrCreate);
app.post('/api/user/saveProject', projectCtrl.saveProject);
app.post('/api/bootcamp', bootcampCtrl.updateOrCreate);

app.get('/api/projects', projectCtrl.getProjects);
app.get('/api/user/projects', userCtrl.getProjects);
app.delete('/api/user/projects/:imgId', userCtrl.removeProject);
app.post('/api/project/vote', projectCtrl.submitVote);

app.get('/api/bootcamp/user', bootcampCtrl.getUser);
app.get('/api/getBootcamps', bootcampCtrl.getBootcamps);
app.get('/api/bootcampUsers', bootcampCtrl.getUsers);
app.post('/api/bootcamp', bootcampCtrl.updateOrCreate)
app.post('/api/bootcamp/verify/student', bootcampCtrl.verifyStudent);
app.post('/api/bootcamp/unverify/student', bootcampCtrl.unverifyStudent);


//Github Login
Passport.use(new GithubStrategy({
	clientID: process.env.GITHUB_CLIENTID,
	clientSecret: process.env.GITHUB_SECRET,
	callbackURL: 'http://localhost:8888/auth/github/callback'
}, 
function (token, refreshToken, profile, done) {
	userCtrl.updateOrCreate(profile)
		.then(function(user) {
			done(null, user);
		}, function(err) {
			done(err, profile);
		})
}
));



//Passport endpoints
app.get('/auth/github',
	Passport.authenticate('github'))

app.get('/auth/github/callback',
	Passport.authenticate('github',{ failureRedirect: '/#/' }),
	function(req, res) {

		Bootcamp.findOne({'githubId': req.user.githubId}, function(err, bootcamp) {
			if(!bootcamp) {
				User.findOne({'githubId': req.user.githubId}, function(err, user) {
					if(user.registered === false) {
						res.redirect('/#/register');
					} else if (user.registered === true) {
						res.redirect('/#/projects')
					} else if (err) {
						console.log(err)
					}
				})
			} else {
				Bootcamp.findOne({'githubId': req.user.githubId}, function(err, user){
				if(bootcamp.registered === false) {
					res.redirect('/#/register');
				} else if (bootcamp.registered === true) {
					res. redirect('/#/bootcamp/dashboard');
				}
					
				})
			}
		})
	});

var requireAuth = function (req, res, next) {
	if (!req.isAuthenticated()) {
		return res.status(403).end();
	}
	return next()
}

app.listen(process.env.EXPRESS_PORT || port);
console.log('listening on port ' + process.env.EXPRESS_PORT || port);









