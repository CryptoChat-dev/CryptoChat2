import {eff} from '../assets/eff';

export function scorePassword(pass) {
    var score = 0;
    if (! pass) 
        return score;
    
    // award every unique letter until 5 repetitions
    var letters = Object();
    for (var i = 0; i < pass.length; i++) {
        letters[pass[i]] = (letters[pass[i]] || 0) + 1;
        score += 5.0 / letters[pass[i]];
    }

    // bonus points for mixing it up
    var variations = {
        digits: /\d/.test(pass),
        lower: /[a-z]/.test(pass),
        upper: /[A-Z]/.test(pass),
        nonWords: /\W/.test(pass)
    }

    var variationCount = 0;
    for (var check in variations) {
        variationCount += (variations[check] === true) ? 1 : 0;
    }
    score += (variationCount - 1) * 10;

    return parseInt(score);
}

function secureRandom(count) { 
    // generate a cryptographically secure integer
    
    var cryptoObj = window.crypto || window.msCrypto
    var rand = new Uint32Array(1)
    var skip = 0x7fffffff - 0x7fffffff % count
    var result

    if (((count - 1) & count) === 0) {
        cryptoObj.getRandomValues(rand)
        return rand[0] & (count - 1)
    }

    do {
        cryptoObj.getRandomValues(rand)
        result = rand[0] & 0x7fffffff
    } while (result >= skip)

    return result % count
}

export function getWordNum(length) { // get the random words from the dice ware dict
    var wordslist = []
    for (var i = 0; i < length; i++) {
        var newnum = []
        for (var j = 0; j < 5; j += 1) { // roll a 6 sided die
            newnum.push(secureRandom(6) + 1)
        }
        var theword = eff[newnum.join('')]
        wordslist.push(theword.charAt(0).toUpperCase() + theword.slice(1))
    }
    return wordslist.join('')
}

export function randomUID(length) {
    var UIDlist = [];
    for (var i = 0; i < length; i++) {
        UIDlist.push(secureRandom(9));
    }
    return UIDlist.join('')
}