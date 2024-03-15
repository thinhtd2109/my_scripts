module.exports = class PGUTils {
    constructor() {
        this.symbols = {};
        this.events = new Array();
    }
    randomIntFromInterval(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
    genPlayWindow(reelNum, rowNum) {
        let result = [];
        for (let reelIdx = 0; reelIdx < reelNum; reelIdx++) {
            let subArray = [];
            for (let rowIdx = 0; rowIdx < rowNum; rowIdx++) {
                subArray.push(this.symbols[this.randomIntFromInterval(0, 10)]);
            }
            result.push(subArray);
        }
    
        return result;
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
}