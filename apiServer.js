const express = require('express');
const bcrypt = require('bcryptjs');
var cors = require('cors')
const app = express();
const port = 3000;
app.use(cors())
const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://giftacc:giftacc@cluster0.pvzye.mongodb.net/giftdelivery?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
var user_collection; 
var giftacc_collection;
var reminder_collection;

client.connect(err => {

  if (err) {
    console.error("connect error");
    console.error(err);
    client.close();
    return;
  }
  else {
    user_collection = client.db("giftdelivery").collection("userinfo");
    giftacc_collection = client.db("giftdelivery").collection("giftacc");
    reminder_collection = client.db("giftdelivery").collection("reminder");
    // perform actions on the collection object
    console.log('Database up!')
    console.log('Success!')
    // client.close();

    bcrypt.hash('mypassword', 10, function(err, hash) {
     if (err) { throw (err); }
     console.log({ "hash": hash});
     bcrypt.compare('mypassword', hash, function(err, result) {
        if (err) { throw (err); }
        console.log(result);
     });
    });
  }
});


app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.use(express.json());// process json
app.use(express.urlencoded({ extended: true }));
app.use(cors());
let localArray = [];


app.post('/post', function (req, res) {
  localArray.push(req.body);
  console.log(req.body);
  res.send("Data saved: " + JSON.stringify(req.body.name));
});
app.get('/getData', function (req, res) {
  console.log(localArray);
  res.send(JSON.stringify(localArray));
});


app.post('/register', async function (req, res) {
  localArray.push(req.body);
  console.log(req.body);
  
  bcrypt.hash(req.body.password, 10, function(err, hash) {
    if (err) { throw (err); }
    console.log({ "hash": hash});
    req.body.password = hash;
    console.log({ "res": req.body});
    user_collection.insertOne(req.body, function (err, result) {
      if (err) {
        console.log(err);
        resData = { status: "ERROR", data: { email: req.body.email } };
        res.send(resData);
      } else {
        console.log({ "msg": " Records Inserted Count: "  + result.insertedCount});
        resData = { status: "OK", data: { email: req.body.email } };
        res.send(resData);
      }// end
  
    });

  });
  
});

app.post('/login', function (req, res) {
  localArray.push(req.body);
  console.log(req.body);

  user_collection.find({email:req.body.email}).toArray(function(err, arr) {
      if (err) {
        console.log(err);
        resData = { status: "ERROR", data: { email: req.body.email } };
        res.send(resData);
      } else {
        console.log({ "msg": arr });
        //let pass = await bcrypt.hash(req.body.password, 10); 
        if (arr.length==1) {
          console.log({ "pass": req.body.password });
          console.log({ "pass": arr[0].password });
          bcrypt.compare(req.body.password, arr[0].password).then(function (result) {
            if (result) {
              resData = { status: "OK", data: arr[0] };
              res.send(resData);
              console.log("Login success");
            }
            else {
              console.log("Login failure: password mismatch");
              resData = { status: "ERROR", data: { email: req.body.email } };
              res.send(resData);
            }
          });
        } else {
          console.log("Login failure: duplicate records");
          resData = { status: "ERROR", data: { email: req.body.email } };
          res.send(resData);
          }
        }
    });
});

function randomString(len) {
  len = len || 32;
  var $chars = '123456789';    
  var maxPos = $chars.length;
  var pwd = '';
  for (i = 0; i < len; i++) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return pwd;
}

app.post('/order', function (req, res) {
  req.body.order_num = randomString(8)
  console.log(req.body);

  giftacc_collection.insert(req.body, function (err, result) {
    if (err) {
      console.log(err);
      resData = { status: "ERROR", data: err };
      res.send(resData);
    } else {
      console.log({ "msg": " Records Inserted Count: "  + result.insertedCount});
      resData = { status: "OK", data: result };
      res.send(resData);
    }// end

  });
});

app.get('/order', function (req, res) {
  console.log({ "msg": req.query });
  giftacc_collection.find(req.query).toArray(function (err, arr) {
    if (err) {
      console.log(err);
      resData = { status: "ERROR", data: { email: req.body.email } };
      res.send(resData);
    } else {
      console.log({ "msg": arr });
      resData = { status: "OK", data: arr };
      res.send(resData);
    }// end

  });
});

app.get('/deleleAllOrder', function (req, res) {
	console.log(req.query);
	giftacc_collection.deleteMany(req.query , {safe: true}, function (err, result) {
		if (err) {
		  console.log(err);
		  resData = { status: "ERROR", data: "delete error!" };
		  res.send(resData);
		} else {
		  resData = { status: "OK", data: "delete successfully!"  };
		  res.send(resData);
		}// end
	});
});

app.get('/getReminderData', (req, res) => {

  reminder_collection.find({}, { projection: { _id: 0 } }).toArray(function (err, docs) {
    if (err) {
      console.log("Some error.. " + err);
    } else {
      console.log(docs.length + " documents have been checked and the reminders for this month are displayed.");
      res.send(JSON.stringify(docs));
    }

  });

});

app.post('/postReminderData', (req, res) => {

  reminder_collection.insertMany(req.body, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log({ "msg": result.insertedCount + " reminders inserted:" });
      res.send({ "msg": result.insertedCount + " reminders inserted:" });
    }
  })

});

app.get('/deleteReminderData', (req, res) => {

  reminder_collection.deleteMany(req.body, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log({ "msg": "All reminders deleted:" });
      res.send({ "msg": "All reminders deleted:" });
    }

  });

})

app.listen(process.env.PORT || port, () => { 
//app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  //console.log(`Example app listening at http://192.168.0.12:${port}`)
});


