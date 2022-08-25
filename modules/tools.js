function roundTo(digits, num) {
    console.log(num);
    return Math.round(num*(10^digits))/(10^digits);
}

function getNthBiggest(arr, n) {
    n += 1;
    let arrcopy = JSON.parse(JSON.stringify(arr));
    for (val in arrcopy) {
        const num = Math.max(...arrcopy); 
        const numInd = arrcopy.indexOf(num);
        arrcopy.splice(numInd, 1, -Infinity);

        if (val >= n-1) {
            return numInd;
        }
    }
    
    return 0;
}

function shuffleArray(arr) {
    let [currentIndex, randomIndex] = [arr.length, null];
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
    }
    return arr;
}

module.exports = {
    roundTo: (digits, num) => roundTo(digits,num),
    getNthBiggest: (arr, n) => getNthBiggest(arr, n),
    shuffleArray: (arr) => shuffleArray(arr)
}