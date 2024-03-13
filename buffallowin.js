const fs = require('fs')
let symbolList = ['WILD', 'PIC1', 'PIC2', 'PIC3', 'PIC4', 'PIC5', 'PIC6', 'PIC7', 'PIC8', 'PIC9', 'PIC10'];
let events = [];
let currentScatters = [];
let result = [];

class BuffalloWin {
	constructor() {
		this.symPay = {
			PIC1: 5,
			PIC2: 4,
			PIC3: 3,
			PIC4: 3,
			PIC5: 2,
			PIC6: 2,
			PIC7: 2,
			PIC8: 1,
			PIC9: 1,
			PIC10: 1,
		};
		this.symbols = {
			0: 'WILD',
			1: 'PIC1',
			2: 'PIC2',
			3: 'PIC3',
			4: 'PIC4',
			5: 'PIC5',
			6: 'PIC6',
			7: 'PIC7',
			8: 'PIC8',
			9: 'PIC9',
			10: 'PIC10',
			11: 'BONUS',
			12: 'BLANK',
		};

		this.multiplier = 0;
		this.respinCount = 0;
		this.result = [];
		this.bigSymbolIdx = 0;
		this.bigSymbols = new Array();
		this.scatter = new Array();
		this.isNormalSpin = true;
		this.freegameSymbols = new Array();
		this.symbolHeights = this.generateSymbolHeights(4);
		this.obj = new Object();
		this.reels = this.symbolHeights.map((heights, reelIdx) =>
			heights.map((height) => {
				let symbol = this.symbols[this.randomIntFromInterval(0, 12)];
				if (height > 1 && ['BONUS', 'BLANK'].includes(symbol)) {
					symbol = this.symbols[this.randomIntFromInterval(0, 10)];
				} else if (reelIdx == 0 && symbol == 'WILD') {
					symbol = this.symbols[this.randomIntFromInterval(1, 12)];
				}

				if(!this.isNormalSpin && height > 1) {
					symbol = 'WILD';
				}

				return symbol;
			})
		);
		this.events = [];
	}

	generateRandomHeight(maxSum) {
		let subArray = [];
		let sum = 0;
		while (sum < maxSum) {
			var value = Math.floor(Math.random() * 3) + 1; // Giá trị ngẫu nhiên từ 1 đến 4
			if(!this.isNormalSpin && value > 1) {
				subArray.push(maxSum);
				break;
			}
			if (sum + value <= maxSum) {
				subArray.push(value);
				sum += value;
			}
		}

		return subArray;
	}

	generateSymbolHeights(maxSum) {
		let array = [];
		for (let i = 0; i < 3; i++) {
			array.push(this.generateRandomHeight(maxSum));
		}
		return array;
	}

	getRandomSymbol(height, reelIdx) {
		let symbol = this.symbols[this.randomIntFromInterval(0, 12)];
		if (height > 1 && ['BONUS', 'BLANK'].includes(symbol)) {
			symbol = this.symbols[this.randomIntFromInterval(1, 11)];
		} else if (reelIdx == 0 && symbol == 'WILD') {
			symbol = this.symbols[this.randomIntFromInterval(2, 11)];
		}

		if(height > 1 && !this.isNormalSpin) {
			symbol = 'WILD'
		}

		return symbol;
	}
	randomIntFromInterval(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	randomSymbolExpand(type) {
		if (type == 2) {
			return this.randomIntFromInterval(3, 4);
		} else if (type == 3) {
			return this.randomIntFromInterval(4, 6);
		} else if (type == 4) {
			return this.randomIntFromInterval(5, 8);
		}


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
	//---------------------------------------------------------------------------------

	//---------------------------------------------------------------------------------
	processSpin() {
		if (this.result.length > 0) {
			let eventBefore = JSON.parse(JSON.stringify(this.result[this.result.length - 1]));
			if (eventBefore) {
				eventBefore = JSON.parse(JSON.stringify(eventBefore));
				for (let i = 0; i < eventBefore.length; i++) {
					let event = eventBefore[i];

					if (event.event == 'bigSymbols') {
						let bigSymbols = event.context;
						for (let i = 0; i < bigSymbols.length; i++) {
							let bigSymbol = bigSymbols[i];
							if (!bigSymbol.isExpand && bigSymbol.expand > 0) {
								this.reels[bigSymbol.cell.reel].splice(bigSymbol.cell.row, 0, ...Array(bigSymbol.expand - 1).fill(bigSymbol.symbol));
								this.symbolHeights[bigSymbol.cell.reel][bigSymbol.cell.row] = 1;
								this.symbolHeights[bigSymbol.cell.reel].splice(bigSymbol.cell.row, 0, ...Array(bigSymbol.expand - 1).fill(1));
								this.bigSymbols[bigSymbol.id].isExpand = true;
							}
						}
					}
				}
				this.result[this.result.length - 1] = eventBefore;
			}
		}
		if (this.respinCount == 0) {
			for (let reelIdx = 0; reelIdx < this.symbolHeights.length; reelIdx++) {
				let reel = this.symbolHeights[reelIdx];
				for (let rowIdx = 0; rowIdx < reel.length; rowIdx++) {
					if (this.reels[reelIdx][rowIdx] == 'BONUS') {
						this.freegameSymbols.push({ reel: reelIdx, row: rowIdx });
					}
					if (reel[rowIdx] > 1) {
						this.bigSymbols.push({
							id: this.bigSymbolIdx,
							symbol: this.reels[reelIdx][rowIdx],
							cell: { reel: reelIdx, row: rowIdx },
							occupies: reel[rowIdx],
							expand: 0,
							isExpand: false,
						});
						this.bigSymbolIdx++;
					}
				}
			}
		} else {
			for (let rowIdx = 0; rowIdx < this.symbolHeights[this.symbolHeights.length - 1].length; rowIdx++) {
				let reelIdx = this.symbolHeights.length - 1;
				let reel = this.symbolHeights[reelIdx];
				if (this.reels[reelIdx][rowIdx] == 'BONUS') {
					this.freegameSymbols.push({ reel: reelIdx, row: rowIdx });
				}
				if (this.symbolHeights[reelIdx][rowIdx] > 1) {
					this.bigSymbols.push({
						id: this.bigSymbolIdx,
						symbol: this.reels[reelIdx][rowIdx],
						cell: { reel: reelIdx, row: rowIdx },
						occupies: reel[rowIdx],
						expand: 0,
						isExpand: false,
					});
					this.bigSymbolIdx++;
				}
			}
		}

		this.processSpinWin();
	}
	//---------------------------------------------------------------------------------

	//---------------------------------------------------------------------------------
	processSpinWin() {
		this.scatter = [];
		let symbolsMap = new Map();
		this.countScatters = 0;

		for(let idx = 0; idx < this.reels[0].length; idx++) {
			let checkedSymbol = this.reels[0][idx];
			let setReels = new Set([0]);
			for(let reelIdx = 1; reelIdx < this.reels.length; reelIdx++) {
				for(let rowIdx = 0; rowIdx < this.reels[reelIdx].length; rowIdx++) {
					if(this.reels[reelIdx][rowIdx] == checkedSymbol || this.reels[reelIdx][rowIdx] == 'WILD') {
						setReels.add(reelIdx);
					};
				}
			};

			if(Array.from(setReels).length == this.reels.length) {
				this.countScatters++;
				symbolsMap.set(checkedSymbol, { cells: [], symbol: checkedSymbol })
			}
		};

		// process spin win
		for(let reelIdx = 0; reelIdx < this.reels.length; reelIdx++) {
			let reel = this.reels[reelIdx];

			for(let rowIdx = 0; rowIdx < reel.length; rowIdx++ ) {
				let obj = symbolsMap.get(reel[rowIdx])
				if(reel[rowIdx] == 'WILD') {
					symbolsMap.forEach((value, key) => {
						value.cells.push({ reel: reelIdx, row: rowIdx });
						symbolsMap.set(key, value);
					})
				}

				if(obj) {
					obj.cells.push({ reel:reelIdx, row: rowIdx });
					symbolsMap.set(reel[rowIdx], obj);
				};

				if((reel[rowIdx] == 'WILD' || obj) && this.symbolHeights[reelIdx][rowIdx] > 1) {
					for(let i = 0; i < this.bigSymbols.length; i++) {
						if(this.bigSymbols[i].cell.reel == reelIdx && this.bigSymbols[i].cell.row == rowIdx && this.bigSymbols[i].expand == 0) {
							this.bigSymbols[i].expand = this.randomSymbolExpand(this.symbolHeights[reelIdx][rowIdx]);
						}
					}
				}
			};
 		}

		Array.from(symbolsMap).forEach(([key, value]) => {
			this.scatter.push({...value, pay: this.symPay[key] * value.cells.length})
		});

		if (this.scatter.length) {
			if (this.countScatters == 0) {
				this.trigger('spinWin', this.scatter);
			} else {
				this.multiplier++;
			}
			
			this.trigger('scatter', this.scatter);
		}
		this.trigger('bigSymbols', this.bigSymbols);
		this.trigger('SpinMultiplier', this.multiplier || 1);
	}

	//---------------------------------------------------------------------------------
	//---------------------------------------------------------------------------------
	spin(playWindowBefore = null) {
		if (playWindowBefore) {
			this.trigger('playWindowBefore', playWindowBefore);
		}
		this.processSpin();
		currentScatters = this.countScatters;

		this.trigger('playWindow', this.reels);
		this.trigger('symbolHeights', this.symbolHeights);
		this.respinCount++;
		this.trigger('respinCount', this.respinCount);
		this.result.push(JSON.parse(JSON.stringify(this.events)));
	}
}
let buffalloWin = new BuffalloWin();
if (buffalloWin.respinCount == 0) buffalloWin.spin();

if (buffalloWin.isNormalSpin) {
	while (currentScatters > 0) {
		let playWindowBefore = JSON.parse(JSON.stringify(buffalloWin.reels));
		let symbolHeights = buffalloWin.generateRandomHeight(4);
		buffalloWin.symbolHeights = [...buffalloWin.symbolHeights, symbolHeights];
		buffalloWin.reels = [...buffalloWin.reels, symbolHeights.map((height) => buffalloWin.getRandomSymbol(height, buffalloWin.reels.length))];
		buffalloWin.spin(playWindowBefore);
	}

	buffalloWin.isNormalSpin = false;
}
console.log(buffalloWin.freegameSymbols);

if (!buffalloWin.isNormalSpin && buffalloWin.freegameSymbols.length >= 3) {
	let freeSpins = ((buffalloWin.freegameSymbols.length - 3) * 2) + 10
	
	while(freeSpins > 0) {
		let freegame = new BuffalloWin();
		if (freegame.respinCount == 0) {
			currentScatters = 0;
			freegame.spin();
		}
		while (currentScatters > 0) {
			let playWindowBefore = JSON.parse(JSON.stringify(freegame.reels));
			let symbolHeights = freegame.generateRandomHeight(4);
			freegame.symbolHeights = [...freegame.symbolHeights, symbolHeights];
			freegame.reels = [...freegame.reels, symbolHeights.map((height) => freegame.getRandomSymbol(height, freegame.reels.length))];
			freegame.spin(playWindowBefore);
		}
		buffalloWin.result.push(...JSON.parse(JSON.stringify(freegame.result)));
		freeSpins--;
	}
	
	buffalloWin.freegameSymbols = [];
}
const filePath = './log.txt';
async function rtes() {
	try {
		await fs.promises.access(filePath, fs.constants.F_OK);
	} catch (err) {
		await fs.promises.writeFile(filePath, '');
	}

	await fs.promises.writeFile(filePath, JSON.stringify(buffalloWin.result));
}
rtes()

console.log('🚀 ~ result:', JSON.stringify(buffalloWin.result));
