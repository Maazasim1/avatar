const phonemeMap = {
    "AA": "AA", "AO": "AA", "AH": "AA",
    "IY": "EE", "IH": "EE", "EY": "EE", "EH": "EE",
    "UW": "OO", "UH": "OO", "OW": "OO",
    "F": "F/V", "V": "F/V",
    "TH": "TH", "DH": "TH",
    "M": "M/B/P", "B": "M/B/P", "P": "M/B/P",
    "S": "S/SH", "Z": "S/SH", "SH": "S/SH", "CH": "S/SH", "JH": "S/SH",
    "W": "OO",
    "R": "R",
    "L": "L",
    "D": "D",
    "T": "T",
    "N": "N",
    "G": "G",
    "K": "K",
    "Y": "Y"
};

function findClosestPhoneme(phoneme) {
    if (phonemeMap[phoneme]) {
        return phonemeMap[phoneme];
    }

    // If not found, find the closest match using Levenshtein distance
    let closestMatch = "AA"; // Default fallback
    let minDistance = Infinity;

    Object.keys(phonemeMap).forEach(key => {
        let distance = levenshtein(phoneme, key);
        if (distance < minDistance) {
            minDistance = distance;
            closestMatch = phonemeMap[key];
        }
    });

    return closestMatch;
}

// Convert CMU phonemes to animation phonemes with fallback
export function convertPhonemes(cmuPhonemes) {
    return cmuPhonemes.map(phoneme => findClosestPhoneme(phoneme));
}

// Example usage:
const cmuOutput = ["DH", "AH", "F", "IH", "SH", "ZZZ"];  // "ZZZ" is unknown
const animationPhonemes = convertPhonemes(cmuOutput);
console.log(animationPhonemes); // Output: ["TH", "AA", "F/V", "EE", "S/SH", closest match]



function levenshtein(a, b) {
    const dp = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,    // Deletion
                dp[i][j - 1] + 1,    // Insertion
                dp[i - 1][j - 1] + cost // Substitution
            );
        }
    }

    return dp[a.length][b.length];
}
