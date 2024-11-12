document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.getElementById('saveBtn');
    const tagsInput = document.getElementById('tagsInput');
    const statusDiv = document.getElementById('status');

    // Add function to get page content
    async function getPageContent() {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        return new Promise((resolve) => {
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                function: () => document.body.innerText
            }, (results) => {
                resolve({
                    title: tab.title,
                    content: results[0].result
                });
            });
        });
    }

    // Add function to suggest tags
    async function suggestTags() {
        try {
            statusDiv.textContent = 'Generating tags...';
            const pageData = await getPageContent();
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_OPENAI_API_KEY'
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{
                        role: "system",
                        content: "You are a helpful assistant that suggests relevant tags for web pages. Respond with only 3-5 comma-separated tags, no explanation."
                    }, {
                        role: "user",
                        content: `Suggest tags for this webpage. Title: ${pageData.title}\n\nContent: ${pageData.content.substring(0, 1000)}`
                    }]
                })
            });

            const data = await response.json();
            const suggestedTags = data.choices[0].message.content;
            tagsInput.value = suggestedTags;
            statusDiv.textContent = 'Tags suggested!';
        } catch (error) {
            console.error('Error suggesting tags:', error);
            statusDiv.textContent = 'Error generating tags';
        }
    }

    // Add suggest tags button
    const suggestBtn = document.createElement('button');
    suggestBtn.textContent = 'Suggest Tags';
    suggestBtn.addEventListener('click', suggestTags);
    tagsInput.parentNode.insertBefore(suggestBtn, tagsInput.nextSibling);

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
