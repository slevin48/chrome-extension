document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.getElementById('saveBtn');
    const tagsInput = document.getElementById('tagsInput');
    const statusDiv = document.getElementById('status');

    saveBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            const title = tab.title;
            const url = tab.url;
            const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
            const created_at = new Date().toISOString();

            // Prepare data to send to Supabase
            const data = {
                title: title,
                url: url,
                created_at: created_at,
                tags: tags
            };

            // Send data to Supabase
            saveBookmark(data)
                .then(response => {
                    statusDiv.textContent = 'Bookmark saved!';
                    tagsInput.value = ''; // Clear the input field
                })
                .catch(error => {
                    console.error('Error:', error);
                    statusDiv.style.color = 'red';
                    statusDiv.textContent = 'Error saving bookmark.';
                });
        });
    });
});

// Function to save bookmark to Supabase
async function saveBookmark(data) {
    // Replace with your Supabase project URL and anon key
    const SUPABASE_URL = 'https://YOUR_SUPABASE_PROJECT.supabase.co';
    const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

    const response = await fetch(`${SUPABASE_URL}/rest/v1/bookmarks`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
}
