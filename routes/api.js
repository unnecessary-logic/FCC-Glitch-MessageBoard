/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var DbHandler = require('../controllers/dbHandler.js')

module.exports = function (app) {
  
  const dbHandler = new DbHandler();
  
  //We'll handle the thread-type operations here.
  app.route('/api/threads/:board')
  .get(function (req, res) {
    let board = req.params.board
    dbHandler.getThreads(board, function (err, result) {
      res.json(result)
    })
  })
  
  .post(function (req, res) {
    let board = req.body.board
    let text = req.body.text
    let dPass = req.body.delete_password
    dbHandler.postThread(text, dPass, board, function(err, response){
      if(err) return console.log("There was an error");
      res.redirect('/b/'+ board);
      })
  })
  
  .put(function (req, res) {
    let board = req.body.board
    let thread = req.body.thread_id
    
    dbHandler.reportThread(board, thread, function(err, response) {
      if (err) {
        console.log("Error in reporting thread.")
        res.send(err)
      }
      else {
        console.log(response)
        res.send(response)
      }
    })
  })
  .delete(function (req, res) {
    let board = req.body.board
    let thread = req.body.thread_id
    let dPass = req.body.delete_password
    
    dbHandler.deleteThread(board, thread, dPass, function(err, response) {
      if (err) {
        console.log("Error in deleting thread reply.")
      }
      else {
        res.send(response)
      }
    })
  })
  //We'll handle the thread replies actions here.
  app.route('/api/replies/:board')
  .post(function (req, res) {
    let thread = req.body.thread_id
    let board = req.body.board
    let text = req.body.text
    let dPass = req.body.delete_password
    
    dbHandler.postReplies(thread, board, text, dPass, function(err, response){
      if(err) return console.log("There was an error");
      res.redirect('/b/'+ board + "/" + thread);
      })
  })
  .get(function (req, res) {
    let thread = req.query.thread_id
    let board = req.params.board
    dbHandler.getReplies(thread, board, function (err, result) {
      res.json(result)
    })
  })
  .put(function (req, res) {
    let board = req.body.board
    let thread = req.body.thread_id
    let reply = req.body.reply_id
    
    dbHandler.reportReply(thread, board, reply, function(err, response) {
      if (err) {
        console.log("Error in reporting thread.")
        res.send(err)
      }
      else {
        console.log(response)
        res.send(response)
      }
    })
  })
  .delete(function (req, res) {
    let board = req.body.board
    let thread = req.body.thread_id
    let dPass = req.body.delete_password
    let reply = req.body.reply_id
    
    dbHandler.deleteReplies(thread, board, reply, dPass, function(err, response) {
      if (err) {
        console.log("Error in deleting thread reply.")
      }
      else {
        res.send(response)
      }
    })
  })

}

