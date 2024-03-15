const PGUTils = require('./PgUtils.js')
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
    11: 'PIC10',
    12: 'PIC11',
};

class LegendOfPerse extends PGUTils {
    constructor() {
        super();
        this.symbols = symbols;
        this.isNormalGame = true;
        this.spinWin = new Array();
        this.respinCount = 0;
        this.squareMap = new Map();
        this.squares = new Array();
        this.reels = [
            [ 'PIC5', 'PIC5', 'PIC5', 'PIC8', 'PIC3', 'PIC3' ],
            [ 'PIC5', 'PIC5', 'PIC5', 'PIC8', 'PIC1', 'PIC4' ],
            [ 'PIC5', 'PIC5', 'PIC5', 'PIC2', 'PIC5', 'PIC1' ],
            [ 'PIC6', 'PIC6', 'PIC8', 'PIC6', 'PIC9', 'PIC2' ],
            [ 'PIC1', 'PIC1', 'WILD', 'PIC7', 'PIC9', 'PIC8' ]
          ]
        //this.reels = this.genPlayWindow(5, 6);
        this.visited = Array.from({ length: 5 }, () => Array(6).fill(false));
    };

    checkedSquare(squareValues) {
        let squareSet = new Set();
        let countSym = 0;
        for(let square of squareValues) {
            if(!this.visited[square.reel][square.row]) countSym += 1;
            squareSet.add(square.symbol);

        }

        if(squareSet.size == 1 && countSym >= 4) {
            squareValues.forEach(square => {
                this.visited[square.reel][square.row] = true;
            })
            return true
        }
        return false;
    }

    getSquareBySize(size) {
        for (let reelIdx = 0; reelIdx < this.reels.length - (size - 1); reelIdx++) {
            for (let rowIdx = 0; rowIdx < this.reels[reelIdx].length - (size - 1); rowIdx++) {
                const squareValues = [];

                for (let i = 0; i < size; i++) {
                    for (let j = 0; j < size; j++) {
                        squareValues.push({ symbol: this.reels[reelIdx + i][rowIdx + j], reel: reelIdx + i, row: rowIdx + j });
                    }
                }
                if(this.checkedSquare(squareValues)) {
                    this.squares.push(squareValues);
                }
            }
        }
        return this.squares;
    }

    spin() {
        this.visited = Array.from({ length: 5 }, () => Array(6).fill(false));
        this.squares = this.getSquareBySize(3);
        
        console.log(this.visited)
    }
}

const instance = new LegendOfPerse();
instance.spin();
console.log(instance.reels)
console.dir(instance.squares, { depth: 5 })
