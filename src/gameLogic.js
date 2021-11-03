/** The whole gameLogic.js code wasn't written by me. Creds go to Karolis Paulauskas. */

/** Given the required number of cards to deal, deals cards. Returns cards in the following structure:
 * [
 *  {s: 0, r: 1},
 *  {s: 3, r: 3},
 *  ...
 * ]
 */
function dealCards(numCards) {
  let allCards = [];
  let dealtCards = [];
  let left = 24;
  let current = 0;
  for (let i = 0; i < 4; i++) {
    //Creates a structure array of all cards that can be dealt;
    for (let j = 0; j < 6; j++) {
      allCards[i * 6 + j] = { s: i, r: j };
    }
  }
  for (let i = 0; i < numCards; i++) {
    //Randomly selects cards from the array of all cards to be put in a new dealt card array;
    current = Math.floor(Math.random() * left);
    dealtCards.push(allCards[current]);
    allCards[current] = allCards[left - 1];
    left--;
  }
  return dealtCards;
}

/**Checks a call.
 * Returns true, if combination exists.
 * Returns false otherwise.
 * Params: Current combination(obj); Number of dealt cards(Number); All dealt cards(arr_of_obj); Number of Players(let). */
function checkIfCombIsPresent(call, totalCards, dealtCards) {
  let combinationValid = false;

  switch (
  call.comb //Checks each combination using functions;
  ) {
    case 0: //High card
      if (isContained(dealtCards, totalCards, 1, call)) combinationValid = true;
      break;

    case 1: //Pair
      if (isContained(dealtCards, totalCards, 2, call)) combinationValid = true;
      break;

    case 2: //Two Pairs
      if (totalCards > 3) {
        if (isPaired(dealtCards, totalCards, 2, call)) combinationValid = true;
      }
      break;

    case 3: //Three of a kind
      if (totalCards > 2) {
        if (isContained(dealtCards, totalCards, 3, call))
          combinationValid = true;
      }
      break;

    case 4: //Straight
      if (totalCards > 4) {
        if (isStraight(dealtCards, totalCards, call)) combinationValid = true;
      }
      break;

    case 5: //Flush
      if (totalCards > 4) {
        if (isFlush(dealtCards, totalCards, call)) combinationValid = true;
      }
      break;

    case 6: //Full house
      if (totalCards > 4) {
        if (isPaired(dealtCards, totalCards, 3, call)) combinationValid = true;
      }
      break;

    case 7: //Four of a kind
      if (totalCards > 3) {
        if (isContained(dealtCards, totalCards, 4, call))
          combinationValid = true;
      }
      break;

    case 8: //Straight from 9 flush
      if (totalCards > 4) {
        if (isStraightFlush(dealtCards, totalCards, call, 0))
          combinationValid = true;
      }
      break;

    case 9: //Royal flush
      if (totalCards > 4) {
        if (isStraightFlush(dealtCards, totalCards, call, 1))
          combinationValid = true;
      }
      break;
  }
  return combinationValid;
}

/**Compares two combinations and returns Boolean(true) if the first combintion is greater than the second one.
 * Returns Boolean(false) otherwise.
 * IMPORTANT: When calling a full-house rankA represents three of a kind and rankB represents a pair.
 */
function compareCombs(comb1, comb2) {
  let validity;
  let containedValidity = () => {
    if (comb1.rankA > comb2.rankA) {
      validity = true;
    } else {
      validity = false;
    }
  };

  let checkA = () => {
    return comb1.rankA !== -1 ? true : false;
  };

  let checkB = () => {
    return comb1.rankB !== -1 ? true : false;
  };

  let checkSuit = () => {
    return comb1.suit !== -1 ? true : false;
  };

  if (comb1.comb > comb2.comb) {
    switch (comb1.comb) {
      case 0: //HIGH
        checkA() ? (validity = true) : (validity = false);
        break;
      case 1: //PAIR
        checkA() ? (validity = true) : (validity = false);
        break;
      case 2: //TWO PAIR
        checkA() && checkB() && comb1.rankA !== comb1.rankB
          ? (validity = true)
          : (validity = false);
        break;
      case 3: //THREE
        checkA() ? (validity = true) : (validity = false);
        break;
      case 4: //STRAIGHT
        checkA() ? (validity = true) : (validity = false);
        break;
      case 5: //FLUSH
        checkSuit() ? (validity = true) : (validity = false);
        break;
      case 6: //FULL HOUSE
        checkA() && checkB() && comb1.rankA !== comb1.rankB
          ? (validity = true)
          : (validity = false);
        break;
      case 7: //FOUR
        checkA() ? (validity = true) : (validity = false);
        break;
      case 8: //STRAIGHT FLUSH
      case 9: //ROYAL FLUSH
        checkSuit() ? (validity = true) : (validity = false);
        break;
      default:
        validity = false;
        console.log("!!! unexpected behaviour @game-logic.js");
    }
  } else if (comb1.comb == comb2.comb) {
    switch (comb1.comb) {
      case 0:
        if (checkA()) containedValidity();
        break;
      case 1:
        if (checkA()) containedValidity();
        break;
      case 2:
        if (checkA() && checkB()) {
          if (comb1.rankA == comb1.rankB) {
            validity = false;
          } else {
            let rankA, rankB;
            if (comb1.rankA > comb1.rankB) {
              rankA = comb1.rankA;
              rankB = comb1.rankB;
            } else {
              rankA = comb1.rankB;
              rankB = comb1.rankA;
            }
            if (rankA > comb2.rankA) {
              validity = true;
            } else if (rankA == comb2.rankA) {
              if (rankB > comb2.rankB) {
                validity = true;
              } else {
                validity = false;
              }
            } else {
              validity = false;
            }
          }
        }
        break;
      case 3:
        if (checkA()) containedValidity();
        break;
      case 4:
        if (comb1.rankA > comb2.rankA && checkA()) {
          validity = true;
        } else {
          validity = false;
        }
        break;
      case 5:
        validity = false;
        break;
      case 6:
        if (checkA() && checkB()) {
          if (comb1.rankA == comb1.rankB) {
            validity = false;
          } else {
            if (comb1.rankA > comb2.rankA) {
              validity = true;
            } else if (comb1.rankA == comb2.rankA) {
              if (comb1.rankB > comb2.rankB) {
                validity = true;
              } else {
                validity = false;
              }
            } else {
              validity = false;
            }
          }
        }
        break;
      case 7:
        if (checkA()) containedValidity();
        break;
      case 8:
      case 9:
        validity = false;
        break;
      default:
        validity = false;
        console.log("!!! unexpected behaviour @game-logic.js");
    }
  } else {
    validity = false;
  }
  return validity;
}

function isContained(dealtCards, totalCards, ammount, currentCall) {
  //Checks if a given ammount of a certain rank of cards are on the table;
  let total = 0;
  let contains = false;
  for (let i = 0; i < totalCards; i++) {
    if (dealtCards[i].r == currentCall.rankA) {
      total++;
      if (total == ammount) {
        contains = true;
        break;
      }
    }
  }
  return contains;
}

function isPaired(dealtCards, totalCards, ammount, currentCall) {
  //Checks if there is a pair or a full house of given rank cards;
  let total = 0;
  let totalB = 0;
  let contains = false;
  for (let i = 0; i < totalCards; i++) {
    if (dealtCards[i].r == currentCall.rankA) total++;
    if (dealtCards[i].r == currentCall.rankB) totalB++;
    if (total >= ammount && totalB >= 2) {
      contains = true;
      break;
    }
  }
  return contains;
}

function isStraight(dealtCards, totalCards, currentCall) {
  //Checks if there is a straight from a given rank;
  let contains = false;
  for (let i = currentCall.rankA; i < 5 + currentCall.rankA; i++) {
    contains = false;
    for (let j = 0; j < totalCards; j++) {
      if (dealtCards[j].r == i) {
        contains = true;
        break;
      }
    }
    if (!contains) {
      return false;
    }
  }
  return true;
}

function isFlush(dealtCards, totalCards, currentCall) {
  //Checks if there is a flush on the table of the given suit;
  let total = 0;
  for (let i = 0; i < totalCards; i++) {
    if (dealtCards[i].s == currentCall.suit) total++;
  }
  if (total > 4) return true;
  else return false;
}

function isStraightFlush(dealtCards, totalCards, currentCall, rank) {
  //Checks if there is a straight flush of a given suit from a certain rank;
  let contains = false;
  for (let i = rank; i < 5 + rank; i++) {
    contains = false;
    for (let j = 0; j < totalCards; j++) {
      if (dealtCards[j].r == i && dealtCards[j].s == currentCall.suit) {
        contains = true;
        break;
      }
    }
    if (contains == false) {
      return false;
    }
  }
  return true;
}

module.exports.dealCards = dealCards;
module.exports.checkIfCombIsPresent = checkIfCombIsPresent;
module.exports.compareCombs = compareCombs;
