document.addEventListener('DOMContentLoaded', async () => {
    const { mainDeckName, subDeckName } = await getDeckNames();

    // Display the current deck names in the popup
    document.getElementById('mainDeck').textContent = mainDeckName;
    document.getElementById('subDeck').textContent = subDeckName;
});

// Function to retrieve deck names from local storage
function getDeckNames() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['mainDeckName', 'subDeckName'], (result) => {
            const mainDeckName = result.mainDeckName ?? '';
            const subDeckName = result.subDeckName ?? '';
            resolve({ mainDeckName, subDeckName });
        });
    });
}
