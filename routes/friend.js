var express = require('express');
var router = express.Router();
const Friend = require('../models/friends');

/* GET home page. */
router.get("/requests", function(req, res, next) {
  Friend.find({
    friend1: req.user._id,
    confirmed: false
  }).exec(function(err, own_requests) {
    if (err) return res.status(500).json({
      message: "an error occured " + err
    });
    Friend.find({
      friend2: req.user._id,
      confirmed: false
    }).exec(function(err, requests) {
      if (err) return res.status(500).json({
        message: "an error occured " + err
      });
      res.json({
        own_requests: own_requests,
        requests: requests
      });
    })
  });
});

router.get("/allconnections", function(req, res, next) {
  Friend.find({
    $or: [{
      friend1: req.user._id
    }, {
      friend2: req.user._id
    }]
  }).exec(function(err, connections) {
    if (err) return res.status(500).json({
      message: "an error occurred " + err
    });
    res.json({
      connections: connections
    });
  });
});

router.post("/request", function(req, res, next) {
  if (!req.body.friend) return res.status(422).json({
    message: "missing friend id in body"
  });
  if (req.body.friend === req.user._id) return res.status(422).json({
    message: "You can't add yourself as a friend. :D"
  });

  var friends = new Friend({
    friend1: req.user._id,
    friend2: req.body.friend,
    confirmed: false
  });
  friends.save(function(err) {
    if (err) return res.status(500).json({
      message: "error while saving " + err
    });
  });
  return res.status(200).json({message:"success"});
});

router.get("/friends", function(req, res, next) {
  Friend.find({
    $or: [{
      friend1: req.user._id
    }, {
      friend2: req.user._id
    }],
    confirmed: true
  }).exec(function(err, result) {
    if (err) return res.status(500).json({
      message: err
    });
    res.json({
      friends: result
    });
  });

});

router.post("/acceptrequest", function(req, res, next) {
  if (!req.body.friend) return res.status(422).json({
    message: "missing friend id in body"
  });

  Friend.findOne({
    friend1: req.body.friend,
    friend2: req.user._id,
    confirmed: false
  }).exec(function(err, result) {
    if (err) return res.status(500).json({
      message: "could not find request " + err
    });
    result.confirmed = true;
    result.save(function(err) {
      if (err) return res.status(500).json({
        message: "error while saving " + err
      });
    });
    res.json({
      message: "success"
    });
  });
});

router.post("/validaterequest", function(req, res, next) {
  if (!req.body.friend) return res.status(422).json({
    message: "missing friend id in body"
  });
  Friend.findOne({
    friend1: req.user._id,
    friend2: req.body.friend,
    validated: false
  }).exec(function(err, result) {
    if (err) return res.status(500).json({
      message: "could not find request " + err
    });
    if (result != null) {
      result.validated = true;
      result.save(function(err) {
        if (err) return res.status(500).json({
          message: "error while saving " + err
        });
      });
      res.json({
        message: "success"
      });
    } else {
      res.status(500).json({
        message: "could not modify request " + err
      });
    }
  });
});

router.post("/denyrequest", function(req, res, next) {
  if (!req.body.friend) return res.status(422).json({
    message: "missing friend id in body"
  });
  Friend.deleteOne({
    friend1: req.body.friend,
    friend2: req.user._id,
    confirmed: false
  }).exec(function(err) {
    if (err) return res.status(500).json({
      message: "could not find request " + err
    });
    res.json({
      message: "success"
    });
  });
});


router.post("/cancelrequest", function(req, res, next) {
  if (!req.body.friend) return res.status(422).json({
    message: "missing friend id in body"
  });
  Friend.deleteOne({
    friend2: req.body.friend,
    friend1: req.user._id,
    confirmed: false
  }).exec(function(err) {
    if (err) return res.status(500).json({
      message: "could not find request " + err
    });
    res.json({
      message: "success"
    });
  });
});



module.exports = router;
