
'use strict';
var User = require('../models/users.js');
var Poll = require('../models/polls.js');

var PollHandler = function(){

	// retrieves all available polls from the db
	this.getPolls = function(req, res){
		Poll.find( {} )
		.exec(function(err, result){
			if(err) throw err;
			res.json(result);
		});
	};

	// retrives a single poll based on the id from the db
	this.getPoll = function(req, res){
		var pollId = req.params.id;
		if (pollId !== 'bootstrap.min.css.map'){
			Poll.findOne({'_id': pollId}, function(err, result){
				if(err) throw err;
				res.json(result);
			});
		}
		
	};

	// retrives all polls hosted by a particular user
	this.getUserPolls = function(req, res){
		var user = req.params.userPolls;
		Poll.find({ 'authorId': user }, function (err, result) {
		  if (err) throw err;
		  res.json(result);
		});
	};

	// saves a poll
	this.addPoll = function(req, res){
		var newPoll = new Poll();

		var date = new Date();
		var months = ['Jan','Feb','Mar','April','May','June',
    			  'July','Aug','Sept','Oct','Nov',
    			  'Dec'];
    	newPoll.date = months[date.getMonth()]+" "+date.getDate()+", "+
    			  date.getFullYear();

		newPoll.authorId = req.user.github.id || req.user.twitter.id;
		newPoll.author = req.user.github.displayName || req.user.twitter.displayName;
		newPoll.question = req.body.title;
		

		var optionsArray = (req.body.options).split(',');
		newPoll.options = optionsArray.map(function(x){
			return {
				name: x,
				count: 0
			}
		});

		newPoll.save(function(err){
			if(err) throw err;
			res.redirect('/profile');
		});

	};

	// updates a poll
	this.updatePoll = function(req, res){
		console.log('updating poll');
		//to add a new custom option to poll
		if(req.body.customOption){

			Poll.update( { '_id':req.params.id },
				{
					$push: {
						'options': {name: req.body.customOption, count:1} 
					} 
				}
			 )
			.exec(function(err, result){
				if(err){
					throw err;
				}
				res.redirect('/polls/'+req.params.id);
			});

		}

		else{
			
			var clientIp = req.ip;
			var ipResult = clientIp.slice(clientIp.indexOf('1'), clientIp.length);

			Poll.findOne({'_id': req.params.id}, function(err, result){

				if(err) throw err;

				var flag=true;

				if( result.ipVoted.length === 0){
					console.log("no ips ..must update and redirect");
					Poll.update( { '_id':req.params.id, 'options.name': req.body.selectedOption },
							{ 
								$inc: { 'options.$.count': 1 },
								$push: {
									'ipVoted': ipResult 
								} 
							}
						)
					.exec(function(err, result){
						if(err) throw err;
						res.redirect('/polls/'+req.params.id);
					});
				}

				for(var i=0; i<result.ipVoted.length; i++){

					if( result.ipVoted[i] === ipResult ){
						console.log("ipFound ..must redirect ");
						flag=false;
						req.flash('alert', 'Opps! You can vote only once a poll.');
						res.redirect('/polls/'+req.params.id);
						break;
					}

				}

				if(flag && result.ipVoted.length !== 0){

					Poll.update( { '_id':req.params.id, 'options.name': req.body.selectedOption },
							{ 
								$inc: { 'options.$.count': 1 },
								$push: {
									'ipVoted': ipResult 
								} 
							}
						)
					.exec(function(err, result){
						if(err) throw err;
						console.log("ipNotFound ..must update and redirect");
						res.redirect('/polls/'+req.params.id);
					});
				}

			});
			
		}
		

	};

	// deletes a poll
	this.deletePoll = function(req, res){
		Poll.remove( {_id: req.params.id}, function (err, result) {
			if(err)
				throw err;
			else
				res.send("deleted.");
		});
	};



};

module.exports = PollHandler;
