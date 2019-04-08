var request = require('supertest');
var expect = require('chai').expect;
var should = require('chai').should();
const dotenv = require('dotenv');
const result = dotenv.config();

const bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var logger = require('morgan');
var express = require('express');

var indexRouter = require('../routes/index');
var authRouter = require('../routes/auth');
var userRouter = require('../routes/user');

const UserModel = require('../models/user');


require('../auth/auth');

var app = express();


function makeGetRequest(route, statusCode, done) {
    request(app)
        .get(route)
        .expect(statusCode)
        .end(function (err, res) {
            if (err) {
                return done(err);
            }

            done(null, res);
        });
};

function makeAuthGetRequest(route, token, statusCode, done) {
    request(app)
        .get(route)
        .set('Authorization', 'Bearer ' + token)
        .expect(statusCode)
        .end(function (err, res) {
            if (err) {
                return done(err);
            }

            done(null, res);
        });
};

function makeAuthDeleteRequest(route, token, statusCode, done) {
    request(app)
        .delete(route)
        .set('Authorization', 'Bearer ' + token)
        .expect(statusCode)
        .end(function (err, res) {
            if (err) {
                return done(err);
            }

            done(null, res);
        });
};

function makePostRequest(route, data, statusCode, done) {
    request(app)
        .post(route)
        .send(data)
        .expect(statusCode)
        .end(function (err, res) {
            if (err) {
                return done(err);
            }

            done(null, res);
        });
};

describe('Tests', function () {
    before(function (done) {

        mongoose.connect(process.env.TESTDATABASE, {
            useNewUrlParser: true
        });

        //Get the default connection
        var db = mongoose.connection;

        app.use(bodyParser.urlencoded({extended: false}));
        app.use(express.json());
        app.use(express.urlencoded({extended: false}));

        app.use('/auth', authRouter);

        app.use('/', passport.authenticate('jwt', {
            session: false
        }), indexRouter);

        app.use('/user', passport.authenticate('jwt', {
            session: false
        }), userRouter);


        //Bind connection to error event (to get notification of connection errors)
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function () {
            done();
        });


    });

    describe('accounts', function () {


        describe('Authentication', function () {
            before(function (done) {
                var user = new UserModel({
                    email: 'tim@dev.nl',
                    name: 'tim',
                    password: 'test',
                    sharelocation: true
                });
                user.save(function (err) {
                    if (err) return done(err);
                    done(null, null)
                });
            });

            it('login should return an token when logged in with valid credentials.', function (done) {
                makePostRequest('/auth/login', 'email=tim@dev.nl&password=test', 200, done);
            });

            it('login should return an 401 error when invalid credentials are used.', function (done) {
                makePostRequest('/auth/login', 'email=tim@dev.nl&password=wrongpassword', 401, done);
            });

            it('login should return an 401 error when incorrect parameters are used.', function (done) {
                makePostRequest('/auth/login', 'qwerty', 401, done);
            });


            after(function (done) {

                UserModel.deleteOne({
                    email: 'tim@dev.nl'
                }).exec();
                done(null, null);
            })
        });

        describe('Profile', function () {

            it('registration should return an userprofile with the given properties', function (done) {
                makePostRequest('/auth/signup','email=bob@example.com&name=bob&password=testpassword&sharelocation=true', 200, done)
            });

            after(function (done) {

                UserModel.deleteOne({
                    email: 'bob@example.com'
                }).exec();
                done(null, null);
            });

            var token = '';

            before(function (done) {
                var user = new UserModel({
                    email: 'tim@dev.nl',
                    name: 'tim',
                    password: 'test',
                    sharelocation: true
                });
                user.save(function (err) {
                    if (err) return next(error);
                    done(null, null)
                });

            });

            it('route should return the user profile when authenticated.', function (done) {
                makePostRequest('/auth/login', 'email=tim@dev.nl&password=test', 200, function (err, res) {
                    if (err) {
                        console.log(err.text);
                    }
                    if (res) {
                        var json = JSON.parse(res.text);
                        token = json.token;
                        makeAuthGetRequest('/user/profile', token, 200, done);
                    }
                });

            });

            after(function (done) {

                UserModel.deleteOne({
                    email: 'tim@dev.nl'
                }).exec();
                done(null, null);
            });

            before(function (done) {
                var user = new UserModel({
                    email: 'yoeri@river.nl',
                    name: 'yoeri',
                    password: 'kitty',
                    sharelocation: true
                });
                user.save(function (err) {
                    if (err) console.log(err);
                    done(null, null)
                });

            });

            it('should delete a user account when the route is reached', function (done) {
                makePostRequest('/auth/login', 'email=yoeri@river.nl&password=kitty', 200, function (err, res) {
                    if (err) {
                        console.log(err.text);
                    }
                    if (res) {
                        var json = JSON.parse(res.text);
                        token = json.token;
                        makeAuthGetRequest('/user/profile', token, 200, function (err, res) {
                            var profile = JSON.parse(res.text).user;
                                makeAuthDeleteRequest('/user/destroy/'+profile._id, token, 200, done);

                        });
                    }
                });
            });

        });


    });
    console.log("test");

    after(function (done) {
        mongoose.connection.close(done);
    });
});
