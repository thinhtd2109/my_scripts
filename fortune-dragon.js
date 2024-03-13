class FortuneDragon {
	constructor() {
		this.spinWins = new Array();
		this.symbols = {
			0: 'WILD',
			1: 'PIC1',
			2: 'PIC2',
			3: 'PIC3',
			4: 'PIC4',
			5: 'PIC5',
			6: 'PIC6',
		};
		this.events = [];
		this.symbolsPay = {
			WILD: 100,
			PIC1: 50,
			PIC2: 25,
			PIC3: 10,
			PIC4: 5,
			PIC5: 3,
			PIC6: 2,
		};
		this.lines = [
			[
				{ reel: 0, row: 1 },
				{ reel: 1, row: 1 },
				{ reel: 2, row: 1 },
			],
			[
				{ reel: 0, row: 0 },
				{ reel: 1, row: 0 },
				{ reel: 2, row: 0 },
			],
			[
				{ reel: 0, row: 2 },
				{ reel: 1, row: 2 },
				{ reel: 2, row: 2 },
			],
			[
				{ reel: 0, row: 0 },
				{ reel: 1, row: 1 },
				{ reel: 2, row: 2 },
			],
			[
				{ reel: 0, row: 2 },
				{ reel: 1, row: 1 },
				{ reel: 2, row: 0 },
			],
		];
		this.reels = this.genPlayWindow()
	}
	randomIntFromInterval(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	genPlayWindow() {
		let result = [];
		for (let reelIdx = 0; reelIdx < 3; reelIdx++) {
			let subArray = [];
			for (let rowIdx = 0; rowIdx < 3; rowIdx++) {
				subArray.push(this.symbols[this.randomIntFromInterval(0, 6)]);
			}
			result.push(subArray);
		}

		return result;
	}

	copy(data) {
		return JSON.parse(JSON.stringify(data));
	}

	remove(eventName) {
		this.events = this.events.filter((event) => event.event !== eventName);
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
	processSpinWin() {
		this.lines.forEach((line, index) => {
			let newSet = new Set();
			let symbol;
            let pay = 0;

			line.forEach((cell) => {
				if (this.reels[cell.reel][cell.row] !== 'WILD') symbol = this.reels[cell.reel][cell.row];
                pay += this.symbolsPay[this.reels[cell.reel][cell.row]];
				newSet.add(this.reels[cell.reel][cell.row]);
			});
			if (([...newSet].length == 2 && [...newSet].includes('WILD')) || [...newSet].length == 1) {
				this.spinWins.push({ symbol: symbol || 'WILD', context: line, pay: pay });
			}
		});
        this.trigger('spinWins', this.spinWins);
	}
	//---------------------------------------------------------------------------------
	//---------------------------------------------------------------------------------
	spin() {
		this.processSpinWin();
		this.trigger('playWindow', this.reels);
	}
}
let instance = new FortuneDragon();
instance.spin();

console.log(JSON.stringify(instance.events));
