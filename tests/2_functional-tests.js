/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  //As usual we'll need these as we progress through our tests.
    let bID = "ChaiBoard";
    let bPass = "Password"
    let tID;
    let tID2;
    let rID;
    let rID2;
//Here we're working to test the injection of collection->document.
  //We'll be testing with pretty standard replies here.
  suite('API ROUTING FOR /api/threads/:board', function() {
    //For the post test, we need two tests.  We'll need two values as a delete comes before the final put and we'll need one thread to stick around for the reply tests.
    //I don't care about the password being plain text here as they're dummy threads.  The normal operation encrypts the password from the user.
    suite('POST', function() {
      test('Test POST /api/threads/:board with standard data', function(done) {
        chai.request(server)
        .post("/api/threads/:board")
        .send({
          text: "ChaiTest",
          delete_password: bPass,
          board: bID
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
        })
        //The test above does not have a done() clause because two are being called here.
        //If you have one on each it errors out.
        chai.request(server)
        .post("/api/threads/:board")
        .send({
          text: "ChaiTest2",
          delete_password: bPass,
          board: bID
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          done();
        })
        
      });
    });
    //This GET returns a lot of data.  We really just need to ensure that the returned properties are actually present.
    //In addition, we need to populate our tID variables to use for later.
    suite('GET', function() {
      test('Test GET /api/threads/:board',  function(done){
        chai.request(server)
        .get('/api/threads/' + bID)
        .end(function(err, res){
        assert.equal(res.status, 200);
        assert.isArray(res.body)
        tID = res.body[0]._id
        tID2 = res.body[1]._id
        assert.property(res.body[0], "_id", "The objects in the return should return an ID.");
        assert.property(res.body[0], "text", "The objects should return text.");
        assert.property(res.body[0], "created_on", "They should return created_on.");
        assert.property(res.body[0], "bumped_on", "They should return bumped on.");
        assert.property(res.body[0], "replies", "They should return an array object replies.");
        assert.property(res.body[1], "_id", "The objects in the return should return an ID.");
        assert.property(res.body[1], "text", "The objects should return text.");
        assert.property(res.body[1], "created_on", "They should return created_on.");
        assert.property(res.body[1], "bumped_on", "They should return bumped on.");
        assert.property(res.body[1], "replies", "They should return an array object replies.");
        done();
      });
      });      
      
    });
    //Here we need to actually perform two tests - one with password correct and incorrect.
    suite('DELETE', function() {
      //Need to test with correct password here.
      test('Test delete /api/threads/:board',  function(done){
        chai.request(server)
        .delete('/api/threads/' + bID)
        .send({
          board: bID,
          delete_password: bPass,
          thread_id: tID2
        })
        .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, "Password correct and thread deleted.")
        done();
      });
      });   
      //Incorrect password test here.
      test('Test delete /api/threads/:board',  function(done){
        chai.request(server)
        .delete('/api/threads/' + bID)
        .send({
          board: bID,
          delete_password: "asdfasdf",
          thread_id: tID
        })
        .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, "Password incorrect, please try again.")
        done();
      });
      });   
      
    });
    //This should be pretty simple, we can log a status 200 as well as our reported text from our dbHandler.js.
    suite('PUT', function() {
      test('Test PUT /api/threads/:board to report thread',  function(done){
        chai.request(server)
        .put('/api/threads/' + bID)
        .send({
          board: bID,
          thread_id: tID
        })
        .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, "Sucessfully reported thread.")
        done();
      });
      });   
    });
    
  });
  
  //We will test the reply functionality here.
  //Should be VERY similar to the test suite above with the obvious function difference being we're working with the array of a single object rather than a collection->document.
  suite('API ROUTING FOR /api/threads/:board, reply functionality', function() {
    //This test should look pretty familiar.  Besides changing the post address, we need to pass a thread_id and it should function the same.
    //Like the test above no data is returned so we'll rely on a good status return instead.
    suite('POST', function() {
      test('Test POST /api/replies/:board reply with standard data', function(done) {
        chai.request(server)
        .post("/api/replies/:board")
        .send({
          thread_id: tID,
          text: "ChaiTest",
          delete_password: bPass,
          board: bID
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
        })
        //...need a second object created for the same reasons above.
        chai.request(server)
        .post("/api/replies/:board")
        .send({
          thread_id: tID,
          text: "ChaiTest2",
          delete_password: bPass,
          board: bID
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          done();
        })
        
      });
    });
    //The get function is similar, we just have to remember that we're returning the replies array in the threadID not the res.body array.
    //If we follow that notion it should be the same test as our thread operation.  We will populate our reply (rID) here as well.
    suite('GET', function() {
      test('Test GET /api/replies/:board reply',  function(done){
        chai.request(server)
        .get('/api/replies/' + bID)
        .query({
          thread_id: tID
        })
        .end(function(err, res){
        assert.equal(res.status, 200);
        assert.isArray(res.body.replies)
        rID = res.body.replies[0]._id
        rID2 = res.body.replies[1]._id
        assert.property(res.body.replies[0], "_id", "The objects in the return should return an ID.");
        assert.property(res.body.replies[0], "text", "The objects should return text.");
        assert.property(res.body.replies[0], "created_on", "They should return created_on.");
        assert.property(res.body.replies[1], "_id", "The objects in the return should return an ID.");
        assert.property(res.body.replies[1], "text", "The objects should return text.");
        assert.property(res.body.replies[1], "created_on", "They should return created_on.");
        done();
      });
      });      
      
    });
    //Same as before - correct and incorrect password.
    suite('DELETE', function() {
      //Need to test with correct password here.
      test('Test delete /api/replies/:board reply',  function(done){
        chai.request(server)
        .delete('/api/replies/' + bID)
        .send({
          board: bID,
          delete_password: bPass,
          thread_id: tID,
          reply_id: rID2
        })
        .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, "Password correct and reply deleted.")
        done();
      });
      });   
      
      test('Test delete /api/replies/:board reply',  function(done){
        chai.request(server)
        .delete('/api/replies/' + bID)
        .send({
          board: bID,
          delete_password: "asdfasdf",
          thread_id: tID,
          reply_id: rID
        })
        .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, "Password incorrect, could not delete thread reply.")
        done();
      });
      });   
      
    });
    //Same operation for reporting.  Our message will ensure this operation is functioning correctly.
    suite('PUT', function() {
      test('Test PUT /api/threads/:board to report thread reply',  function(done){
        chai.request(server)
        .put('/api/replies/' + bID)
        .send({
          board: bID,
          thread_id: tID,
          reply_id: rID
        })
        .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, "Sucessfully reported thread reply.")
        done();
      });
      });   
    });
    
  });
});

/*
Listening on port 1988

Running Tests...





  Functional Tests

    API ROUTING FOR /api/threads/:board

      POST


(node:3341) DeprecationWarning: current URL string parser is deprecated, and will be removed in a future version. To use the new parser, pass option { useNewUrlParser: true } to MongoClient.connect.


Connected correctly to server - performing thread operation.


Connected correctly to server - performing thread operation.


        ✓ Test POST /api/threads/:board with standard data (902ms)


      GET


Connected correctly to server - performing thread operation.


        ✓ Test GET /api/threads/:board (153ms)


      DELETE


Connected correctly to server - performing thread operation.


Found thread, checking for matching passwords.


(node:3341) DeprecationWarning: collection.remove is deprecated. Use deleteOne, deleteMany, or bulkWrite instead.


        ✓ Test delete /api/threads/:board (370ms)


Connected correctly to server - performing thread operation.


Found thread, checking for matching passwords.


        ✓ Test delete /api/threads/:board (422ms)


      PUT


Connected correctly to server - performing thread operation.


Sucessfully reported thread.

        ✓ Test PUT /api/threads/:board to report thread (87ms)


    API ROUTING FOR /api/threads/:board, reply functionality


      POST


Connected correctly to server - performing thread operation.


Connected correctly to server - performing thread operation.


Found data, modding.

Found data, modding.


        ✓ Test POST /api/replies/:board reply with standard data (603ms)


      GET


Connected correctly to server - performing thread operation.


        ✓ Test GET /api/replies/:board reply (89ms)


      DELETE


Connected correctly to server - performing thread operation.


Found thread and reply, checking for matching passwords.


(node:3341) DeprecationWarning: collection.update is deprecated. Use updateOne, updateMany, or bulkWrite instead.


        ✓ Test delete /api/replies/:board reply (324ms)


Connected correctly to server - performing thread operation.


Found thread and reply, checking for matching passwords.


        ✓ Test delete /api/replies/:board reply (233ms)


      PUT


Connected correctly to server - performing thread operation.


{ lastErrorObject: { n: 1, updatedExisting: true },

  value:

   { _id: 5d548c1acca49c0d0dfaf90a,

     text: 'ChaiTest',

     delete_password:

      '$2b$10$fw3/fviqb4QIQd6EaseAeulZRV4z70gUrwsm/5wALJyxXqbL2sY/O',

     created_on: 2019-08-14T22:32:58.014Z,

     bumped_on: 2019-08-14T22:32:59.668Z,

     reported: true,

     replies: [ [Object] ] },

  ok: 1,

  operationTime:

   Timestamp { _bsontype: 'Timestamp', low_: 3, high_: 1565821980 },

  '$clusterTime':

   { clusterTime:

      Timestamp { _bsontype: 'Timestamp', low_: 3, high_: 1565821980 },

     signature: { hash: [Binary], keyId: [Long] } } }

Sucessfully reported thread reply.


        ✓ Test PUT /api/threads/:board to report thread reply (85ms)




  10 passing (3s)



*/

