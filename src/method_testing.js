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
