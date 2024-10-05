chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log('Content script works!');
    if (request.action === "createAnkiCard") {
        const flashcardContent = request.flashcard;

        // Use AnkiConnect to create a card
        // await processSelectedData(flashcardContent);
    }
});