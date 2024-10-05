document.addEventListener('DOMContentLoaded', async () => {
    // Attach event listener to the save button
    const saveButton = document.getElementById('saveDeckNames');
    saveButton.addEventListener('click', saveDeckNames);
});

// Save new deck names when the save button is clicked
async function saveDeckNames() {
    const mainDeckName = document.getElementById('mainDeck').value.trim();
    const subDeckName = document.getElementById('subDeck').value.trim();

    if (!mainDeckName) {
        alert("Main Deck Name cannot be empty!");
        return;
    }

    // Save deck names in local storage
    await chrome.storage.local.set({
        mainDeckName: mainDeckName,
        subDeckName: subDeckName
    });

    alert("Deck names saved!");

    // Close the popup after saving
    window.close();
}
