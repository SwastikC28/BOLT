const express = require('express');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const passportLocalMongoose = require('passport-local-mongoose');
const multer = require('multer');
const path = require('path');
var checkboxList = [];

//Multer storage initiation
const storage = multer.diskStorage({
  destination: './public/Uploads/',
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
});

// Set Config
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(
  session({
    secret: 'MyDatabase',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Mongoose
mongoose.connect('mongodb://localhost:27017/boltDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});
mongoose.set('useCreateIndex', true);
const secretSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  password: String,
  gender: String,
  age: Number,
  tQualification: [],
  tInterest: [],
  bio: String,
  imgName: String,
  favUser: [],
});
secretSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User', secretSchema);

// Passport
passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});

// Routes
app.get('/', function (req, res) {
  res.render('index');
});

app.get('/register', function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/home');
  } else {
    res.render('registration');
  }
});

app.post('/register', upload.single('myimage'), function (req, res) {
  checkbox(req);
  console.log(req.file.filename);
  User.register(
    {
      username: req.body.username,
      firstName: req.body.firstname,
      lastName: req.body.lastname,
      gender: req.body.gender,
      age: req.body.age,
      tQualification: [req.body.tqual1, req.body.tqual2, req.body.tqual3],
      tInterest: checkboxList,
      bio: req.body.bio,
      imgName: req.file.filename,
      favUser: [],
    },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate('local')(req, res, function () {
          res.redirect('profile');
        });
      }
    }
  );

  checkboxList = [];
});

app.get('/login', function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/homepage');
  } else {
    res.render('login');
  }
});

app.post('/login', function (req, res) {
  var user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/home');
      });
    }
  });
});

app.get('/profile', function (req, res) {
  if (req.isAuthenticated()) {
    res.render('profile', { user: req.user });
  } else {
    res.redirect('/login');
  }
});

app.get('/home', function (req, res) {
  if (req.isAuthenticated()) {
    var user = req.user;

    User.find(
      { tInterest: { $in: user.tInterest } },
      function (err, foundUsers) {
        if (!err) {
          res.render('homepage', {
            user: foundUsers.filter((e) => e._id != user._id),
          });
        }
      }
    );
  } else {
    res.redirect('/');
  }
});

app.post('/favorite', function (req, res) {
  let jsonData = req.body.favUserData;
  let favUserData = JSON.parse(jsonData);
  let user = req.user;
  User.findOneAndUpdate(
    { _id: user._id },
    {
      $push: {
        favUser: favUserData,
      },
    },
    (err) => {
      if (err) console.log(err);
      else {
        res.redirect('/home');
      }
    }
  );
});

app.get('/edit', function (req, res) {
  var user = req.user;
  if (req.isAuthenticated()) {
    res.render('editprofile', { user: user });
  }
});

app.post('/edit', function (req, res) {
  console.log(req.body);
});

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/login');
});

app.get('/delete', function (req, res) {
  if (req.isAuthenticated()) {
    var x = req.user.username;
    User.deleteOne({ username: x }, function (err) {
      console.log(x + 'Deleted Successfully');
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});

app.get('/users/:userId', function (req, res) {
  var userId = req.params.userId;
  if (req.isAuthenticated()) {
    User.findById(userId, function (err, user) {
      res.render('user', { user: user });
    });
  } else {
    res.redirect('/');
  }
});

app.get('/fav', function (req, res) {
  if (req.isAuthenticated()) {
    var user = req.user;

    res.render('fav', { user: user });
  } else {
    res.redirect('/');
  }
});

app.listen(3000, function () {
  console.log('Server Started At 3000');
});

function checkbox(req) {
  if (req.body.frontdevelopment != null) {
    checkboxList.push(req.body.frontdevelopment);
  }
  if (req.body.backdevelopment != null) {
    checkboxList.push(req.body.backdevelopment);
  }
  if (req.body.javascript != null) {
    checkboxList.push(req.body.javascript);
  }
  if (req.body.testing != null) {
    checkboxList.push(req.body.testing);
  }
  if (req.body.node != null) {
    checkboxList.push(req.body.node);
  }
  if (req.body.react != null) {
    checkboxList.push(req.body.react);
  }
  if (req.body.ai != null) {
    checkboxList.push(req.body.ai);
  }
  if (req.body.dataScience != null) {
    checkboxList.push(req.body.dataScience);
  }
  if (req.body.softengineer != null) {
    checkboxList.push(req.body.softengineer);
  }
  if (req.body.flutter != null) {
    checkboxList.push(req.body.flutter);
  }
}
