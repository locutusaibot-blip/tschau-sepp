// Tschau Sepp Game Logic - with Real Card Images

// Deutsche/Schweizer Jasskarten
const SUITS = [
    { symbol: '🔔', name: 'Schellen', color: 'gold', key: 'schellen' },
    { symbol: '🌹', name: 'Rosen', color: 'red', key: 'rosen' },
    { symbol: '⚔️', name: 'Schilten', color: 'black', key: 'schilten' },
    { symbol: '🍃', name: 'Eicheln', color: 'green', key: 'eicheln' }
];
const VALUES = ['6', '7', '8', '9', '10', 'Under', 'Ober', 'König', 'Ass'];
const VALUE_KEYS = {
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '10': '10',
    'Under': 'under',
    'Ober': 'ober',
    'König': 'konig',
    'Ass': 'ass'
};
const SPECIAL_CARDS = {
    '7': 'draw2',
    '8': 'skip',
    'Under': 'joker',      // Bube = Under = Joker
    'Ass': 'special'       // Ass = spezielle Regel
};

let deck = [];
let playerHand = [];
let computerHand = [];
let discardPile = [];
let currentPlayer = 'player';
let direction = 1;
let drawCount = 0;

// Get card image path
function getCardImagePath(card) {
    const suit = SUITS.find(s => s.symbol === card.suit);
    const valueKey = VALUE_KEYS[card.value];
    return `assets/cards/${suit.key}_${valueKey}.jpg`;
}

// Initialize deck
function createDeck() {
    deck = [];
    SUITS.forEach(suit => {
        VALUES.forEach(value => {
            deck.push({ suit: suit.symbol, suitName: suit.name, suitColor: suit.color, value });
        });
    });
    shuffleDeck();
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Start game
function startGame() {
    createDeck();
    playerHand = [];
    computerHand = [];
    discardPile = [];
    currentPlayer = 'player';
    direction = 1;
    drawCount = 0;

    // Deal 5 cards to each player
    for (let i = 0; i < 5; i++) {
        playerHand.push(deck.pop());
        computerHand.push(deck.pop());
    }

    // Start discard pile (keine Spezialkarten)
    let firstCard;
    do {
        firstCard = deck.pop();
    } while (SPECIAL_CARDS[firstCard.value]); // Wiederhole bis normale Karte
    
    discardPile.push(firstCard);

    updateDisplay();
    showMessage('Spiel gestartet! Dein Zug.');
}

// Draw card
function drawCard() {
    if (currentPlayer !== 'player') return;
    
    if (deck.length === 0) {
        reshuffleDeck();
    }

    playerHand.push(deck.pop());
    updateDisplay();
    
    // Check if player can play
    if (!canPlayAnyCard(playerHand)) {
        showMessage('Keine spielbaren Karten. Computer ist dran.');
        setTimeout(computerTurn, 1000);
    } else {
        showMessage('Karte gezogen. Wähle eine Karte oder ziehe nochmal.');
    }
}

function reshuffleDeck() {
    if (discardPile.length <= 1) return;
    
    const topCard = discardPile.pop();
    deck = [...discardPile];
    discardPile = [topCard];
    shuffleDeck();
}

// Play card
function playCard(cardIndex) {
    if (currentPlayer !== 'player') return;

    const card = playerHand[cardIndex];
    const topCard = discardPile[discardPile.length - 1];

    if (!canPlayCard(card, topCard)) {
        showMessage('Diese Karte kann nicht gespielt werden!');
        return;
    }

    // Remove from hand and add to discard
    playerHand.splice(cardIndex, 1);
    discardPile.push(card);

    // Check win
    if (playerHand.length === 0) {
        updateDisplay();
        showMessage('🎉 Du hast gewonnen!');
        return;
    }

    // Handle special cards
    handleSpecialCard(card);

    updateDisplay();

    // Computer's turn
    if (currentPlayer === 'computer') {
        setTimeout(computerTurn, 1500);
    }
}

function canPlayCard(card, topCard) {
    // Under (Bube) is always playable
    if (card.value === 'Under') return true;
    
    // Match suit or value
    return card.suit === topCard.suit || card.value === topCard.value;
}

function canPlayAnyCard(hand) {
    const topCard = discardPile[discardPile.length - 1];
    return hand.some(card => canPlayCard(card, topCard));
}

function handleSpecialCard(card) {
    switch (SPECIAL_CARDS[card.value]) {
        case 'draw2':  // 7
            drawCount += 2;
            showMessage('7 gespielt! Nächster Spieler muss 2 Karten ziehen.');
            currentPlayer = 'computer';
            break;
        case 'skip':  // 8
            showMessage('8 gespielt! Überspringen.');
            // Player spielt nochmal
            break;
        case 'joker':  // Under
            showMessage('Under gespielt! Joker - wähle beliebige Farbe.');
            // For simplicity, keep same suit for now
            break;
        default:
            currentPlayer = 'computer';
    }
}

// Check win
function checkWin() {
    if (playerHand.length === 0) {
        showMessage('🎉 Du hast gewonnen!');
        return true;
    }
    if (computerHand.length === 0) {
        showMessage('💻 Computer hat gewonnen!');
        return true;
    }
    return false;
}

// Computer turn
function computerTurn() {
    if (currentPlayer !== 'computer') return;

    const topCard = discardPile[discardPile.length - 1];
    
    // Handle draw count (from 7)
    if (drawCount > 0) {
        for (let i = 0; i < drawCount; i++) {
            if (deck.length === 0) reshuffleDeck();
            computerHand.push(deck.pop());
        }
        showMessage(`Computer zieht ${drawCount} Karten.`);
        drawCount = 0;
        currentPlayer = 'player';
        updateDisplay();
        return;
    }

    // Find playable cards
    const playableCards = computerHand
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => canPlayCard(card, topCard));

    if (playableCards.length === 0) {
        // Draw card
        if (deck.length === 0) reshuffleDeck();
        computerHand.push(deck.pop());
        showMessage('Computer zieht eine Karte.');
        currentPlayer = 'player';
        updateDisplay();
        return;
    }

    // Play random playable card
    const { card, index } = playableCards[Math.floor(Math.random() * playableCards.length)];
    computerHand.splice(index, 1);
    discardPile.push(card);

    showMessage(`Computer spielt ${card.value} ${card.suitName}`);

    // Check win
    if (computerHand.length === 0) {
        updateDisplay();
        showMessage('💻 Computer hat gewonnen!');
        return;
    }

    // Handle special cards
    handleComputerSpecialCard(card);

    updateDisplay();

    // Continue if computer plays again
    if (currentPlayer === 'computer') {
        setTimeout(computerTurn, 1500);
    }
}

function handleComputerSpecialCard(card) {
    switch (SPECIAL_CARDS[card.value]) {
        case 'draw2':  // 7
            drawCount += 2;
            currentPlayer = 'player';
            break;
        case 'skip':  // 8
            // Computer spielt nochmal
            break;
        case 'joker':  // Under
            // Computer wählt Farbe (random)
            break;
        default:
            currentPlayer = 'player';
    }
}

// Update display
function updateDisplay() {
    // Computer cards (show backs)
    const computerCardsEl = document.getElementById('computerCards');
    computerCardsEl.innerHTML = computerHand.map(() => 
        '<div class="card-back">🎴</div>'
    ).join('');
    
    // Update counts
    document.getElementById('computerCount').textContent = computerHand.length;
    document.getElementById('playerCount').textContent = playerHand.length;

    // Player cards - using real images
    const playerCardsEl = document.getElementById('playerCards');
    const topCard = discardPile[discardPile.length - 1];
    
    playerCardsEl.innerHTML = playerHand.map((card, index) => {
        const playable = canPlayCard(card, topCard) && currentPlayer === 'player';
        const imagePath = getCardImagePath(card);
        return `
            <div class="card-image-container ${playable ? 'playable' : ''}" 
                 onclick="${playable ? `playCard(${index})` : ''}">
                <img src="${imagePath}" alt="${card.value} ${card.suitName}" class="card-img" />
            </div>
        `;
    }).join('');

    // Top card - using real image
    const topCardEl = document.getElementById('topCard');
    if (discardPile.length > 0) {
        const imagePath = getCardImagePath(topCard);
        topCardEl.innerHTML = `
            <div class="card-image-container">
                <img src="${imagePath}" alt="${topCard.value} ${topCard.suitName}" class="card-img" />
            </div>
        `;
    }

    // Deck count
    document.getElementById('deckCount').textContent = `${deck.length} Karten`;

    // Game info
    const gameInfoEl = document.getElementById('gameInfo');
    gameInfoEl.textContent = currentPlayer === 'player' ? 'Dein Zug!' : 'Computer am Zug...';

    // Direction
    document.getElementById('direction').textContent = direction === 1 ? '↓' : '↑';
}

function showMessage(msg) {
    document.getElementById('message').innerHTML = msg;
}

// Start game on load
window.addEventListener('load', () => {
    const messageEl = document.getElementById('message');
    messageEl.innerHTML = 'Klicke auf "Neues Spiel" um zu beginnen!';
});
