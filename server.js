'use strict';
require('dotenv').config()
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
let shortId = require('shortid');
let validUrl = require('valid-url');
var cors = require('cors');
const bodyParser = require('body-parser');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;


/** this project needs a db !! **/ 
mongoose.connect(process.env.DB_URI,{
  // supply the useNewUrlParser and useCreateIndex to avoid such deprecation warnings.
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 //Time out after 5s instead of 30s
});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
// Node.js body parsing middleware. Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
app.use(bodyParser.urlencoded({
  extended: false
}))

//create url schema
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
})

// create a model called URL and pass it our schema and we then export the module so that it can be re-used in other files
const URL = mongoose.model('URL', urlSchema);

// HTTP POST /api/shorturl/new
app.post("/api/shorturl/new", async (req, res)=>{
  //url la name cua the input trong file html
  const url = req.body.url;
  console.log(url);
  const urlCode = shortId.generate();
  
  //check if the url
  if(!validUrl.isWebUri(url)){
    res.status(401).json({
      error: 'invalid URL'
    })
  }
  else{
    try{
      //check if its already in the database
      let findOne = await URL.findOne({
        original_url: url
      })
      console.log(findOne);
      if(findOne){
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      }
      else{
        //if its not exist yet then create new one and response with the result, now findOne is null
        findOne = new URL({
          original_url: url,
          short_url: urlCode
        })
        await findOne.save();
        console.log(findOne);
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      }
    }
    catch(err){
      console.log(err);
      res.status(500).json("Server error");
    }
  }                                                                                                                                  
})

app.get("/api/shorturl/:short_url?", async (req, res)=>{
  try{
    const urlParam = await URL.findOne({
      short_url: req.params.short_url
    })
    if(urlParam){
      return res.redirect(urlParam.original_url)
    }
    else{
      return res.status(404).json('No URL found')
    }
  }
  catch(err){
    console.log(err);
    res.status(500).json('Server error');
  }
})


app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening on port ' + port);
});