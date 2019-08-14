const apiRoutes = require('../routes/api.js');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const request = require('request');
const CONNECTION_STRING = process.env.DB;
const dbName = "fccmessageboard";
const bcrypt = require('bcrypt')
const saltRounds = 10;

function dbHandler () {
  
  this.postThread = function(text, delete_password, board, caller) {
        //Normally I would try to work this in asynchronously, but the synchronous method of bcrypt should work fine here.
        //We don't want our password passing from the front-end to the back end and vice-versa as plain text so we will hash it.
        let hash = bcrypt.hashSync(delete_password, saltRounds)
        let mongDB = MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if (err) {
          throw(err)
          }
        else {
          console.log("Connected correctly to server - performing thread operation.");
          const db = client.db(dbName);
          const collection = db.collection(board)
          let timeNow = new Date();
          //Standard insert operation.  We will insert values based on below.
          collection.insertOne({
            text: text,
            delete_password: hash,
            created_on: timeNow,
            bumped_on: timeNow,
            reported: false,
            replies: []
          }, (err, data) => {
              if (err) {
                throw (err)
              }
              caller(null, data)
            client.close();
            })
          }
          client.close();
        })
    }
  
  this.getThreads = function(board, caller) {
    let mongDB = MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if (err) {
          throw(err)
          }
        else {
          console.log("Connected correctly to server - performing thread operation.");
          const db = client.db(dbName);
          const collection = db.collection(board)
          
          //Here, we're following the assignment's projections.  We don't want to return certain values (which project will take care of).
          //Additionally, our find query has no query because we're returning everything - with a limit of 10, sorted by bumped_on and only the last 3 replies.
          collection.find({}).project({reported: 0, delete_password: 0, replies : { $slice : -3}}).sort({ bumped_on: -1 }).limit(10).toArray((err, items) => {
            caller(null, items)
            client.close();
          })
        }
      client.close();
  })
}
  
  this.reportThread = function(board, thread, caller) {
    
    //I'm not doing any manipulation of the ID - I'm leaving it a blank "ObjectID".
    //Because of this, I'm validating the data myself here to make sure it can be parsed into the collection call below.
    if (!ObjectId.isValid(thread)){
      console.log("InValid")
      let res = "Please review your thread ID and try again.  Thread ID's are quite long, we understand."
      caller(res)
      return false;
    }
   
    let mongDB = MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if (err) {
          throw(err)
          }
        else {
          console.log("Connected correctly to server - performing thread operation.");
          const db = client.db(dbName);
          const collection = db.collection(board)
          
          //Pretty standard findOneAndUpdate operation here.
          collection.findOneAndUpdate({_id: ObjectId(thread)}, {$set: {reported: true}}, function(err, res) {
            if (err) {
              throw(err)
            }
            //Find here will return a value as "null" if not found - it will NOT return an error, this is considered a successful operation.
            else if (res.value == null) {
              res = "No matching thread found, please try again."
              caller(null, res)
              client.close();
            }
            else {
              res = "Sucessfully reported thread."
              caller(null, res)
              client.close();
            }
          })
        }
      client.close();
  })
  }
  
  this.deleteThread = function(board, thread, delete_password, caller) {
    
    if (!ObjectId.isValid(thread)){
      console.log("InValid")
      let res = "Please review your thread ID and try again.  Thread ID's are quite long, we understand."
      return false;
    }
    
    let mongDB = MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if (err) {
          throw(err)
          }
        else {
          console.log("Connected correctly to server - performing thread operation.");
          const db = client.db(dbName);
          const collection = db.collection(board)
          
          //With this operation, I have a nested MongoDB operation that I'm not entirely happy with - however..
          //I couldn't rationalize how to thoroughly project accurate error messages without it.  The goal here is to throw a couple of status's.
          //One, your password was correct and the thread was deleted.  This implies that the thread could be found.
          //Two, we found your thread, but your password was wrong.
          //Three, no thread was found.
          //I feel like it's important to be very verbose with the messaging sent to the user so they understand what's happening.
          collection.findOne({_id: ObjectId(thread)}, function(err, res) {
            if (err) {
              throw(err)
            }
            else if (res) {
              console.log("Found thread, checking for matching passwords.")
              if (bcrypt.compareSync(delete_password, res.delete_password)) {
                collection.remove({_id: ObjectId(thread)}, function(derr, dres){
                  if (derr) {
                    throw(derr)
                    client.close();
                  }
                   res = "Password correct and thread deleted."
                  caller(null, res)
                  client.close();
                })
              }
              else {
                res = "Password incorrect, please try again."
                caller(null, res)
                client.close();
              }
            }
            else {
              res = "No thread found with that ID - check your ID and try again."
              caller(null, res)
              client.close();
            }
            client.close();
          })
          }
    })
  }
  
  this.postReplies = function(thread, board, text, delete_password, caller) {
    
    //We're going to synchronously encrypt this password as well so nothing is passed in plaintext.
    let hash = bcrypt.hashSync(delete_password, saltRounds)
        let mongDB = MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if (err) {
          throw(err)
          }
        else {
          console.log("Connected correctly to server - performing thread operation.");
          const db = client.db(dbName);
          const collection = db.collection(board)
          let timeNow = new Date();
          //The object we're going to insert - looks similar minus a bumped_on field.
          let repObj = {
            _id: new ObjectId(),
            text: text,
            created_on: timeNow,
            delete_password: hash,
            reported: false
          }
          //Here, we need to perform a PUSH operation after finding the thread ID.  We also need to modify the thread ID itself and up its bumped_on value.
          collection.findOneAndUpdate(
            {_id: ObjectId(thread)}, 
            {$set : {bumped_on: timeNow}, $push : {replies: repObj}}, {returnOriginal: false}, (err, data) => {
              if (err) {
                throw (err)
              }
              console.log("Found data, modding.")
              caller(null, data)
            client.close();
            })
          }
          client.close();
        })
  }
  
  this.getReplies = function(thread, board, caller) {
    let mongDB = MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if (err) {
          throw(err)
          }
        else {
          console.log("Connected correctly to server - performing thread operation.");
          const db = client.db(dbName);
          const collection = db.collection(board)
          //This one is a little tricky because we need to return the contents of the replies array as well as use project to not return certain fields.
          //If we find the item with this syntax it will return what we need (the trick is that we're doing this anyway with the getThreads operation, just with different results).
          collection.find({_id: ObjectId(thread)}).project({reported: 0, delete_password: 0, "replies.reported" : 0, "replies.delete_password" : 0}).toArray((err, items) => {
            caller(null, items[0])
            client.close();
          })
        }
      client.close();
  })
}
  
  this.reportReply = function(thread, board, reply, caller) {
    
    //I'm not doing any manipulation of the ID - I'm leaving it a blank "ObjectID".
    //Because of this, I'm validating the data myself here to make sure it can be parsed into the collection call below.
    if (!ObjectId.isValid(thread) || (!ObjectId.isValid(reply))){
      console.log("InValid")
      let res = "Please review your thread ID and try again.  Thread ID's are quite long, we understand."
      caller(res)
      return false;
    }
   
    let mongDB = MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if (err) {
          throw(err)
          }
        else {
          console.log("Connected correctly to server - performing thread operation.");
          const db = client.db(dbName);
          const collection = db.collection(board)
          
          //Here, we have to dig deeper into the object an dmodify the replies object that matches our parameter.  Luckily, we can modify the object with the $ notation (that we find).
          collection.findOneAndUpdate({_id: ObjectId(thread), "replies._id" : ObjectId(reply)}, {$set: {"replies.$.reported": true}}, {returnOriginal: false}, function(err, res) {
            console.log(res)
            if (err) {
              throw(err)
            }
            //Find here will return a value as "null" if not found - it will NOT return an error, this is considered a successful operation.
            else if (res.value == null) {
              res = "No matching thread reply found, please try again."
              caller(null, res)
              client.close();
            }
            else {
              res = "Sucessfully reported thread reply."
              caller(null, res)
              client.close();
            }
          })
        }
      client.close();
  })
  }
  
  this.deleteReplies = function(thread, board, reply, delete_password, caller) {
    
    if (!ObjectId.isValid(thread) || !ObjectId.isValid(reply)){
      console.log("InValid")
      let res = "Please review your thread ID and try again.  Thread ID's are quite long, we understand."
      return false;
    }
    
    let mongDB = MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if (err) {
          throw(err)
          }
        else {
          console.log("Connected correctly to server - performing thread operation.");
          const db = client.db(dbName);
          const collection = db.collection(board)
          
          //The same type of logic as the thread operation.  We have three messages we need to account for here, and a nested operation takes care of that.
          collection.findOne({_id: ObjectId(thread), "replies._id" : ObjectId(reply)} ,function(err, res) {
            if (err) {
              throw(err)
            }
            else if (res) {
              console.log("Found thread and reply, checking for matching passwords.")
              //The difference here is, we need to extract from our res.replies the actual array element that HAS the index then parse its password against bcrypt to judge if it's the right one or not.
              let passTest = res.replies.find( x => x = ObjectId(reply))
              if (bcrypt.compareSync(delete_password, passTest.delete_password)) {
                //If it is, we can use the pull operation to pull that value out of the array.
                collection.update({_id: ObjectId(thread)}, { $pull: { "replies" : { _id: ObjectId(reply) } } }, function(derr, dres){
                  if (derr) {
                    throw(derr)
                    client.close();
                  }
                  res = "Password correct and reply deleted."
                  caller(null, res)
                  client.close();
                })
              }
              else {
                res = "Password incorrect, could not delete thread reply."
                caller(null, res)
                client.close();
              }
            }
            else {
              res = "No thread reply found with those ID's.  Try again."
              caller(null, res)
            }
            client.close();
          })
          }
    })
  }
  
  //Originally created to run in the functional-tests.js file but found that it was causing the tests to error out.
  //I will simply not drop the DB.
  this.dropBoard = function(board) {
    let mongDB = MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if (err) {
          throw(err)
          }
        else {
          console.log("Connected correctly to server - performing thread operation.");
          const db = client.db(dbName);
          const collection = db.collection(board)
          
          db.collection.drop()
          
          client.close();
          }
  })
  
}
}

module.exports = dbHandler;