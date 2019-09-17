var sqlite = require('sqlite');
var _ = require('lodash');


var branches = [{
	word: 'ROOT',
	children: [process.argv[2]],
	history: []
}];

var winner = null;

function isWord(word, db, history) {
	return new Promise( (resolve, reject) => {
		db.get(`SELECT * from entries where word = "${word}";`).then(result => {
			resolve({
				word,
				history,
				isWord: (typeof result !== 'undefined')
			});
		});
	});
}

function branchWord(word) {
	//Returns an array of one letter missing from word
	var branches = [];
	if (word.length === 1) {
		return false;
	}
	for( var i=0; i<word.length;i++) {
		branches.push( word.slice(0,i)+word.slice(i+1));
	}
	return branches;
}

async function iterate(db, list) {
	return new Promise( function(resolve, reject) {
		var promises = [];
		while (list.length > 0) {
			var current = list.pop();
			current.children.forEach( function (childWord) {
				if (childWord !== '') {
					promises.push(
						isWord(childWord, db, current.history)
					);
				}
			});
		}
		Promise.all(promises).then( function(results) {
			var newList = [];
			results.forEach( function(result) {
				if (result.isWord !== false) { //Was a word
					var newHistory = _.cloneDeep(result.history);
					newHistory.push(result.word);
					var subList = branchWord(result.word);
					if (subList !== false) {
						newList.push({
							word: result,
							children: subList,
							history: newHistory
						});
					} else {
						console.log(newHistory);	
					}
				}
			});
			resolve(newList);
		});
	});
}

async function loop() {
	var db = await sqlite.open('./dictionary.db');
	var lastList = branches;
	while(lastList.length > 0) {
		var newList = [];
		newList = await iterate(db, lastList);
		lastList = _.cloneDeep(newList);
	}
}

loop();
