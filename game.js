// Tschau Sepp Game Logic

// Deutsche/Schweizer Jasskarten
const SUITS = [
    { symbol: '🔔', name: 'Schellen', color: 'gold' },
    { symbol: '🌹', name: 'Rosen', color: 'red' },
    { symbol: '⚔️', name: 'Schilten', color: 'black' },
    { symbol: '🍃', name: 'Eicheln', color: 'green' }
];
const VALUES = ['6', '7', '8', '9', '10', 'Under', 'Ober', 'König', 'Ass'];
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
        showMessage('Diese Karte kannst du nicht spielen!');
        return;
    }

    // Remove card from hand
    playerHand.splice(cardIndex, 1);
    discardPile.push(card);

    // Check for win
    if (playerHand.length === 0) {
        showMessage('🎉 Du hast gewonnen!');
        return;
    }

    // Handle special cards
    handleSpecialCard(card);

    // Switch turn if no special effect
    if (!SPECIAL_CARDS[card.value] || SPECIAL_CARDS[card.value] === 'special') {
        currentPlayer = 'computer';
        updateDisplay();
        setTimeout(computerTurn, 1500);
    } else {
        updateDisplay();
    }
}

// Check if card can be played
function canPlayCard(card, topCard) {
    // Under (Bube) kann immer gespielt werden
    if (card.value === 'Under') return true;
    
    // Auf Under kann alles gespielt werden
    if (topCard.value === 'Under') return true;
    
    // Ass kann nur auf Ass oder gleiche Farbe
    if (card.value === 'Ass') {
        return topCard.value === 'Ass' || card.suit === topCard.suit;
    }
    
    // Normale Karten: gleiche Farbe oder gleicher Wert
    return card.suit === topCard.suit || card.value === topCard.value;
}

function canPlayAnyCard(hand) {
    const topCard = discardPile[discardPile.length - 1];
    return hand.some(card => canPlayCard(card, topCard));
}

// Handle special cards
function handleSpecialCard(card) {
    const effect = SPECIAL_CARDS[card.value];

    switch(effect) {
        case 'draw2':
            drawCount += 2;
            showMessage(`7 gespielt! Nächster zieht 2 Karten!`);
            currentPlayer = 'computer';
            setTimeout(computerDrawPenalty, 1000);
            break;

        case 'skip':
            showMessage(`8 gespielt! Computer wird übersprungen!`);
            currentPlayer = 'player';
            break;

        case 'joker':
            // Spieler muss Farbe wählen!
            showMessage(`Under (Bube) gespielt! Wähle eine Farbe:`);
            showColorPicker();
            break;

        case 'special':
            showMessage('Ass gespielt! (Nur auf Ass oder gleiche Farbe)');
            currentPlayer = 'computer';
            setTimeout(computerTurn, 1500);
            break;
    }
}

// Computer turn
function computerTurn() {
    if (currentPlayer !== 'computer') return;

    showMessage('Computer ist am Zug...');

    setTimeout(() => {
        const topCard = discardPile[discardPile.length - 1];
        let playedCard = false;

        // Priorisiere: Zuerst Spezialkarten, dann normale
        let bestCardIndex = -1;
        
        // 1. Versuche Under zu spielen (wenn mehrere Karten)
        for (let i = 0; i < computerHand.length; i++) {
            if (computerHand[i].value === 'Under' && canPlayCard(computerHand[i], topCard)) {
                bestCardIndex = i;
                break;
            }
        }
        
        // 2. Versuche 7er oder 8er
        if (bestCardIndex === -1) {
            for (let i = 0; i < computerHand.length; i++) {
                if ((computerHand[i].value === '7' || computerHand[i].value === '8') && 
                    canPlayCard(computerHand[i], topCard)) {
                    bestCardIndex = i;
                    break;
                }
            }
        }
        
        // 3. Spielbare Karte finden
        if (bestCardIndex === -1) {
            for (let i = 0; i < computerHand.length; i++) {
                if (canPlayCard(computerHand[i], topCard)) {
                    bestCardIndex = i;
                    break;
                }
            }
        }

        if (bestCardIndex !== -1) {
            const card = computerHand.splice(bestCardIndex, 1)[0];
            discardPile.push(card);
            showMessage(`Computer spielt: ${card.value} ${card.suit}`);
            playedCard = true;

            // Check for win
            if (computerHand.length === 0) {
                showMessage('🤖 Computer hat gewonnen!');
                return;
            }

            // Handle special cards
            if (SPECIAL_CARDS[card.value]) {
                handleComputerSpecialCard(card);
            } else {
                currentPlayer = 'player';
            }
        }

        // Draw if can't play
        if (!playedCard) {
            if (deck.length === 0) reshuffleDeck();
            computerHand.push(deck.pop());
            showMessage('Computer zieht eine Karte.');
            currentPlayer = 'player';
        }

        updateDisplay();
    }, 1000);
}

function computerDrawPenalty() {
    for (let i = 0; i < drawCount; i++) {
        if (deck.length === 0) reshuffleDeck();
        computerHand.push(deck.pop());
    }
    showMessage(`Computer zieht ${drawCount} Karten!`);
    drawCount = 0;
    currentPlayer = 'player';
    updateDisplay();
}

function handleComputerSpecialCard(card) {
    const effect = SPECIAL_CARDS[card.value];

    switch(effect) {
        case 'draw2':
            drawCount += 2;
            showMessage(`Computer spielt ${card.value}! Du ziehst 2 Karten!`);
            setTimeout(() => {
                for (let i = 0; i < drawCount; i++) {
                    if (deck.length === 0) reshuffleDeck();
                    playerHand.push(deck.pop());
                }
                drawCount = 0;
                currentPlayer = 'player';
                updateDisplay();
            }, 1500);
            break;

        case 'skip':
            showMessage('Computer spielt 8! Du wirst übersprungen!');
            setTimeout(computerTurn, 1500);
            break;

        case 'joker':
            showMessage('Computer spielt Under! Wählt Farbe...');
            setTimeout(() => {
                // Computer wählt Farbe basierend auf seinen Karten
                const colorCounts = {};
                computerHand.forEach(card => {
                    colorCounts[card.suitName] = (colorCounts[card.suitName] || 0) + 1;
                });
                
                // Farbe mit meisten Karten wählen
                let bestColor = 'Schellen';
                let maxCount = 0;
                for (const [color, count] of Object.entries(colorCounts)) {
                    if (count > maxCount) {
                        maxCount = count;
                        bestColor = color;
                    }
                }
                
                // Setze gewählte Farbe
                const colorMap = {
                    'Schellen': { symbol: '🔔', color: 'gold' },
                    'Rosen': { symbol: '🌹', color: 'red' },
                    'Schilten': { symbol: '⚔️', color: 'black' },
                    'Eicheln': { symbol: '🍃', color: 'green' }
                };
                
                const chosen = colorMap[bestColor];
                const topCard = discardPile[discardPile.length - 1];
                topCard.suit = chosen.symbol;
                topCard.suitName = bestColor;
                topCard.suitColor = chosen.color;
                
                showMessage(`Computer wählt: ${bestColor} ${chosen.symbol}`);
                currentPlayer = 'player';
                updateDisplay();
            }, 1500);
            break;

        case 'special':
            showMessage('Computer spielt Ass!');
            currentPlayer = 'player';
            break;
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

    // Player cards
    const playerCardsEl = document.getElementById('playerCards');
    const topCard = discardPile[discardPile.length - 1];
    
    playerCardsEl.innerHTML = playerHand.map((card, index) => {
        const playable = canPlayCard(card, topCard) && currentPlayer === 'player';
        return `
            <div class="card" 
                 style="border-color: ${card.suitColor}; color: ${card.suitColor}"
                 class="${playable ? 'playable' : ''}" 
                 onclick="${playable ? `playCard(${index})` : ''}">
                <div class="card-value">${card.value}</div>
                <div class="card-suit">${card.suit}</div>
                <div class="card-value">${card.value}</div>
            </div>
        `;
    }).join('');

    // Top card
    const topCardEl = document.getElementById('topCard');
    if (discardPile.length > 0) {
        topCardEl.innerHTML = `
            <div class="card" style="border-color: ${topCard.suitColor}; color: ${topCard.suitColor}">
                <div class="card-value">${topCard.value}</div>
                <div class="card-suit">${topCard.suit}</div>
                <div class="card-value">${topCard.value}</div>
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

// Farbwahl für Under (Bube)
function showColorPicker() {
    const messageEl = document.getElementById('message');
    messageEl.innerHTML = `
        <div>Under gespielt! Wähle eine Farbe:</div>
        <div style="display: flex; gap: 15px; justify-content: center; margin-top: 10px; flex-wrap: wrap;">
            <button onclick="chooseColor('🔔', 'Schellen', 'gold')" style="font-size: 1.5em; padding: 10px 20px; cursor: pointer;">🔔 Schellen</button>
            <button onclick="chooseColor('🌹', 'Rosen', 'red')" style="font-size: 1.5em; padding: 10px 20px; cursor: pointer;">🌹 Rosen</button>
            <button onclick="chooseColor('⚔️', 'Schilten', 'black')" style="font-size: 1.5em; padding: 10px 20px; cursor: pointer;">⚔️ Schilten</button>
            <button onclick="chooseColor('🍃', 'Eicheln', 'green')" style="font-size: 1.5em; padding: 10px 20px; cursor: pointer;">🍃 Eicheln</button>
        </div>
    `;
}

function chooseColor(symbol, name, color) {
    // Ändere die Farbe der obersten Karte
    const topCard = discardPile[discardPile.length - 1];
    topCard.suit = symbol;
    topCard.suitName = name;
    topCard.suitColor = color;
    
    showMessage(`Farbe gewählt: ${name} ${symbol}`);
    currentPlayer = 'computer';
    updateDisplay();
    setTimeout(computerTurn, 1500);
}

// Start game on load
startGame();
