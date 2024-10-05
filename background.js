chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "createAnkiCard",
        title: "Create Anki Card",
        contexts: ["selection"]
    });

    chrome.contextMenus.create({
        id: 'update-deck-names',
        title: 'Update Main Deck and Sub Deck Name',
        contexts: ['selection'] // Allows users to update deck names
    });

    // New context menu to display the current deck names
    chrome.contextMenus.create({
        id: 'display-deck-names',
        title: 'Display Current Deck Names',
        contexts: ['selection']
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "createAnkiCard") {
        const selectedText = info.selectionText;

        const { mainDeckName, subDeckName } = await getOrAskForDeckNames();
        if (!mainDeckName) alert("Main Deck Name cannot be empty. Please update it.")
        const flashcard = await generateCardWithChatGPT(selectedText);

        await processSelectedData(flashcard);
    }

    if (info.menuItemId === 'update-deck-names') {
        createPopup('popup.html');
    }

    if (info.menuItemId === 'display-deck-names') {
        createPopup('display-deck-names.html');
    }
});

function createPopup(url) {
    chrome.windows.create({
        url: url,
        type: 'popup',
        width: 300,
        height: 500
    });
}

async function generateCardWithChatGPT(selectedText) {

    const response = await fetch('https://claydol-production.up.railway.app/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({prompt: selectedText})
    });

    const data = await response.json();
    const cards = data.response;
    console.log("Flashcard generated:", cards);

    return cards;
}

async function createAnkiDeck({ mainDeckName, subDeckName }) {
    const response = await fetch('http://localhost:8765', {
        method: 'POST',
        mode: "no-cors",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'createDeck',
            version: 6,
            params: {
                deck: subDeckName ? `${mainDeckName}::${subDeckName}` : mainDeckName
            }
        })
    });
    try {
        const result = await response.json();
        console.log("Deck created:", result);
    } catch (error) {
        console.error("Error creating deck:", error);
    }
}

async function getAnkiDeckNames() {
    const response = await fetch('http://localhost:8765', {
        method: 'POST',
        mode: "no-cors",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'deckNames',
            version: 6
        })
    });
    try {
        const result = await response.json();
        console.log("Deck names:", result);
        return result;
    } catch (error) {
        console.error("Error fetching deck names:", error);
        return {};
    }
}

async function processSelectedData(cardContent) {
    const { mainDeckName, subDeckName } = await getDeckNames();
    const currentDeckNames = await getAnkiDeckNames();

    if (!currentDeckNames.result.includes(`${subDeckName ? `${mainDeckName}::${subDeckName}` : mainDeckName}`)) {
        await createAnkiDeck({ mainDeckName, subDeckName });
    }

    const constructBasicCardNotes = (basicCards) =>  basicCards.map(card => (
        
        {
        deckName: subDeckName ? `${mainDeckName}::${subDeckName}` : mainDeckName,
        modelName: 'Basic',
        fields: {
            Front: card.front,
            Back: card.back.length > 1
                ? `<ul>${card.back.map(item => `<li>${item}</li>`).join('')}</ul>`
                : card.back[0]
        },
        tags: ['generated']
    }

));

    const constructClozeCardNotes = (clozeCards) => clozeCards.map(card => ({
        deckName: subDeckName ? `${mainDeckName}::${subDeckName}` : mainDeckName,
        modelName: 'Cloze',
        fields: {
            Text: card.text,
        },
        tags: ['generated']
    }));

    const basicCards = cardContent.cards.filter(card => card.modelName === 'Basic');
    const clozeCards = cardContent.cards.filter(card => card.modelName === 'Cloze');

    const basicCardNotes = constructBasicCardNotes(basicCards);
    const clozeCardNotes = constructClozeCardNotes(clozeCards);

    if (basicCardNotes.length > 0) await createBasicAnkiNotes(basicCardNotes);
    if (clozeCardNotes.length > 0) await createClozeAnkiNotes(clozeCardNotes);
}

async function createBasicAnkiNotes(notes) {
    const response = await fetch('http://localhost:8765', {
        method: 'POST',
        mode: "no-cors",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'addNotes',
            version: 6,
            params: { notes: notes }
        })
    });
    try {
        const result = await response.json();
        console.log("Card created:", result);
    } catch (error) {
        console.error("Error creating card:", error);
    }
}

async function createClozeAnkiNotes(notes) {
    const response = await fetch('http://localhost:8765', {
        method: 'POST',
        mode: "no-cors",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'addNotes',
            version: 6,
            params: { notes: notes }
        })
    });
    try {
        const result = await response.json();
        console.log("Cloze cards created:", result);
    } catch (error) {
        console.error("Error creating cloze cards:", error);
    }
}

// Function to retrieve deck names from local storage
async function getDeckNames() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['mainDeckName', 'subDeckName'], (result) => {
            const mainDeckName = result.mainDeckName || undefined;
            console.log("Main Deck Name", mainDeckName);
            const subDeckName = result.subDeckName || undefined;
            console.log("Sub Deck Name", subDeckName);
            resolve({ mainDeckName, subDeckName });
        });
    });
}

// Function to save deck names in local storage
async function saveDeckNames(mainDeckName, subDeckName) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ mainDeckName, subDeckName }, () => {
            resolve();
        });
    });
}

async function getOrAskForDeckNames() {
    const deckNames = await getDeckNames();
    if (!deckNames.mainDeckName || deckNames.mainDeckName === "undefined") createPopup('popup.html');
    return deckNames;
}
