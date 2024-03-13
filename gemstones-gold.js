let symbols = {
	0: 'BONUS',
	1: 'WILD',
	2: 'PIC1',
	3: 'PIC2',
	4: 'PIC3',
	5: 'PIC4',
	6: 'PIC5',
	7: 'PIC6',
	8: 'PIC7',
	9: 'PIC8',
	10: 'PIC9',
};

class GemStonesGold {
	constructor() {
		this.clusters = new Array();
		this.respinCount = 0;
		this.results = new Array();
		this.events = new Array();
		this.reels = this.genPlayWindow();
		this.playedSpin = new Array();
		this.multiplierSets = new Array(6).fill(null);
		this.isNormalGame = true;
	}

	genPlayWindow() {
		let result = [];
		for (let reelIdx = 0; reelIdx < 6; reelIdx++) {
			let subArray = [];
			for (let rowIdx = 0; rowIdx < 5; rowIdx++) {
				subArray.push(symbols[this.randomIntFromInterval(0, 10)]);
			}
			result.push(subArray);
		}

		return result;
	}

	 randomCustom() {
		let rand = Math.random() * 100;
		
		if (rand < 95) { 
		  return Math.floor(2 + Math.random() * (8 - 2 + 1)); 
		} else if (rand < 99) { 
		  return Math.floor(9 + Math.random() * (100 - 9 + 1));
		} else if (rand < 100) {
		  return Math.floor(101 + Math.random() * (200 - 101 + 1));
		} else {
		  return Math.floor(201 + Math.random() * (500 - 201 + 1));
		}
	  }
	  
	  

	genMultipliers() {
		let newSet = new Set();
		while (true) {
			let index = this.randomIntFromInterval(0, 4);
			if (!this.multiplierSets[index])
				this.multiplierSets[index] = {
					reel: index,
					value: this.randomCustom(),
					level: 1,
				};
			newSet.add(index);
			if (Array.from(newSet).length == 3) break;
		}

		this.trigger('multiplierSets', this.multiplierSets);
	}

	trigger(name, data) {
		let isFinded = false;
		for (let i = 0; i < this.events.length; i++) {
			if (this.events[i].event === name) {
				this.events[i].context = data;
				isFinded = true;
				break;
			}
		}

		if (!isFinded) {
			this.events.push({
				event: name,
				context: data,
			});
		}
	}

	printGrid() {
		this.reels.forEach((row) => console.log(row.join(' ')));
	}

	copy(data) {
		return JSON.parse(JSON.stringify(data));
	}

	remove(eventName) {
		this.events = this.events.filter((event) => event.event !== eventName);
	}

	findCluters(reel, row, visited, symbol) {
		let clusters = [];
		if (reel < 0 || reel > 4 || row < 0 || row > 5) return [];

		if (visited[reel][row] || (this.reels[reel][row] !== symbol && this.reels[reel][row] !== 'WILD') || symbol == 'BONUS') return [];

		visited[reel][row] = true;

		let top = this.findCluters(reel + 1, row, visited, symbol); // top
		let bottom = this.findCluters(reel - 1, row, visited, symbol); // bottom
		let left = this.findCluters(reel, row - 1, visited, symbol); // left
		let right = this.findCluters(reel, row + 1, visited, symbol); // right

		if (top.length) clusters.push(...top);
		if (bottom.length) clusters.push(...bottom);
		if (left.length) clusters.push(...left);
		if (right.length) clusters.push(...right);
		clusters.push({ reel, row });
		return clusters;
	}

	//---------------------------------------------------------------------------------
	//---------------------------------------------------------------------------------

	processCascade() {
		let cascade = Array(6).fill([]);
		let isCascade = false;
		if (this.playedSpin.length) {
			for (let reelIdx = 0; reelIdx < this.playedSpin.length; reelIdx++) {
				let reel = this.playedSpin[reelIdx].filter(Boolean);
				let newSyms = [];
				while (reel.length < 5) {
					let newSym = symbols[this.randomIntFromInterval(0, 10)];
					newSyms.unshift(newSym);
					reel.unshift(newSym);
					isCascade = true;
				}
				cascade[reelIdx] = newSyms;
				this.reels[reelIdx] = reel;
			}
		}
		if (isCascade) this.trigger('Cascade', cascade);
	}
	//---------------------------------------------------------------------------------
	//---------------------------------------------------------------------------------
	processMultiplierSet() {
		let reelNeedUpdated = new Set();
		this.multiplierSets = this.copy(this.multiplierSets);
		for (let cluster of this.clusters) {
			cluster.context.forEach((item) => reelNeedUpdated.add(item.reel));
		}
		Array.from(reelNeedUpdated).forEach((reelIdx) => {
			if (this.multiplierSets[reelIdx] && this.multiplierSets[reelIdx]['level'] > 0) this.multiplierSets[reelIdx]['level'] -= 1;
		});
		this.trigger('multiplierSets', this.multiplierSets);
	}
	//---------------------------------------------------------------------------------
	//---------------------------------------------------------------------------------
	processSpinWin() {
		this.clusters = new Array();
		let visited = Array.from({ length: 5 }, () => Array(6).fill(false));
		let spinWinMap = new Map();
		let playedSpin = this.copy(this.reels);
		for (let reelIdx = 0; reelIdx < this.reels.length; reelIdx++) {
			let reel = this.reels[reelIdx];
			for (let rowIdx = 0; rowIdx < reel.length; rowIdx++) {
				let clusters = this.findCluters(reelIdx, rowIdx, visited, this.reels[reelIdx][rowIdx]);
				if (clusters.length > 3) {
					spinWinMap.set(this.reels[reelIdx][rowIdx], clusters);
					this.clusters.push({
						symbol: this.reels[reelIdx][rowIdx],
						context: clusters,
					});
				}
			}
		}
		if (this.clusters.length) {
			for (let cluster of this.clusters) {
				for (let cell of cluster.context) {
					playedSpin[cell.reel][cell.row] = null;
				}
			}
			this.trigger('spinWin', this.clusters);
			this.trigger('SpinMultiplier', 1);
		} else {
			let multiplier = this.multiplierSets.reduce((prev, curr) => {
				console.log(curr);
				if (curr && curr.level == 0) {
					return prev + curr.value;
				}
				return prev;
			}, 0);
			this.remove('spinWin');
			this.trigger('SpinMultiplier', multiplier || 1);
		}

		this.trigger('playedSpin', playedSpin);
		this.playedSpin = playedSpin;
	}
	spin() {
		if (this.clusters.length) {
			this.processMultiplierSet();
		}
		if (this.respinCount == 0) this.genMultipliers();
		this.processCascade();
		this.trigger('playWindow', this.reels);
		this.processSpinWin();

		this.trigger('respinCount', ++this.respinCount);
		this.results.push(this.copy(this.events));
	}
}

let instance = new GemStonesGold();
do {
	instance.spin();
} while (instance.clusters.length);

console.log(JSON.stringify(instance.results));
