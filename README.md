# Chrome extension 🧩

Simple chrome extension to bookmark webpage with tags 🔖 

**Prompt:**
`Create a chrome extension that enables to bookmark the current page, with a choice of tags.
Store the article title, url, date and time created_at as well as the associated tags in a supabase database.`

Below is a step-by-step guide to creating a Chrome extension that bookmarks the current page with tags and stores the information in a Supabase database. The extension will:

- Capture the current page's title and URL.
- Allow the user to enter tags for the bookmark.
- Store the title, URL, creation date and time, and tags in a Supabase database.

**Note:** Ensure you have a Supabase project set up before proceeding.

---

### **1. Set Up the Supabase Database**

**a. Create a Supabase Project**

- Go to [Supabase](https://supabase.io/) and sign up or log in.
- Create a new project and take note of your **API URL** and **anon key**.

**b. Create a Table**

- Navigate to the **Database** section.
- Create a new table named `bookmarks` with the following columns:

  | Column Name | Data Type             | Note                      |
  |-------------|-----------------------|---------------------------|
  | `id`        | `uuid` (Primary Key)  | Default: `uuid_generate_v4()` |
  | `title`     | `text`                |                           |
  | `url`       | `text`                |                           |
  | `created_at`| `timestamp with time zone` | Default: `now()`          |
  | `tags`      | `text[]`              |                           |

**c. Configure Row Level Security (RLS)**

- Enable RLS on the `bookmarks` table.
- Create a policy to allow inserts:

  ```sql
  -- Allow anyone to insert
  CREATE POLICY "Allow insert for all" ON public.bookmarks
  FOR INSERT USING (true);
  ```

### **2. Create the Chrome Extension**

**a. Create the Project Folder**

Create a new folder for your Chrome extension, e.g., `bookmark_extension`.

**b. Add the `manifest.json` File**

Create a `manifest.json` file with the following content:

```json
{
  "manifest_version": 3,
  "name": "Bookmark with Tags to Supabase",
  "version": "1.0",
  "description": "Bookmark the current page with tags and store it in Supabase.",
  "permissions": [
    "activeTab",
    "scripting",
    "storage"
  ],
  "action": {
    "default_popup": "popup.html"
  }
}
```

**c. Create `popup.html`**

Create a `popup.html` file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Bookmark with Tags</title>
    <style>
        body {
            min-width: 250px;
            min-height: 150px;
            font-family: Arial, sans-serif;
            padding: 10px;
        }
        input[type="text"] {
            width: 100%;
            box-sizing: border-box;
        }
        button {
            margin-top: 10px;
            width: 100%;
        }
        #status {
            margin-top: 10px;
            color: green;
        }
    </style>
</head>
<body>
    <h3>Add Tags</h3>
    <input type="text" id="tagsInput" placeholder="Enter tags separated by commas">
    <button id="saveBtn">Save Bookmark</button>
    <div id="status"></div>
    <script src="popup.js"></script>
</body>
</html>
```

**d. Create `popup.js`**

Create a `popup.js` file:

```javascript
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
```

**Important:**

- **Replace** `'https://YOUR_SUPABASE_PROJECT.supabase.co'` with your actual Supabase project URL.
- **Replace** `'YOUR_SUPABASE_ANON_KEY'` with your actual Supabase anon key.
- **Security Note:** In a production environment, consider securing your API keys appropriately.

### **3. Load the Extension into Chrome**

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** by toggling the switch in the top right corner.
3. Click on **Load unpacked** and select your extension folder (`bookmark_extension`).

![chrome-ext](img/chrome-extension.png)

### **4. Test the Extension**

1. Navigate to any webpage you want to bookmark.
2. Click on the extension icon in the Chrome toolbar.
3. Enter tags separated by commas (e.g., `news, technology, ai`).
4. Click **Save Bookmark**.
5. Check your Supabase database to confirm that the bookmark has been saved.

![supabase](img/supabase.png)

---

### **Additional Notes**

- **Error Handling:** The extension includes basic error handling. Errors will be displayed in red text in the popup.
- **Tags Input:** The tags input field splits the input by commas, trims whitespace, and filters out empty strings.
- **Permissions:** The extension requires the `activeTab`, `scripting`, and `storage` permissions to function correctly.
- **Security Considerations:**
  - Storing API keys directly in the extension code is not secure. For a production environment, consider implementing a secure method to handle API keys, such as fetching them from a secure server.
  - Ensure that RLS policies in Supabase are appropriately configured to prevent unauthorized data access.

---

### **Supabase Table Schema (SQL)**

For reference, here is the SQL command to create the `bookmarks` table:

```sql
CREATE TABLE public.bookmarks (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title text,
    url text,
    created_at timestamp with time zone DEFAULT now(),
    tags text[],
    PRIMARY KEY (id)
);
```

---

### **Testing with Postman**

![error-message](img/error-saving-bookmark.png)

If the extension yields an error message "Error saving bookmark", this indicates that something went wrong while attempting to save the bookmark to Supabase. 

To test the Supabase API with **Postman**, follow these steps. This will allow you to ensure that your Supabase API is correctly configured and that it can accept data as expected.

### 1. Set Up Your Supabase API Endpoint in Postman

1. Open **Postman** and create a new **POST** request.
2. Set the request URL to your Supabase endpoint for inserting into the `bookmarks` table. The URL format should be:

   ```
   https://YOUR_SUPABASE_PROJECT.supabase.co/rest/v1/bookmarks
   ```

   Replace `YOUR_SUPABASE_PROJECT` with your actual Supabase project identifier.

### 2. Add the Headers

In the **Headers** section of your Postman request, add the following headers:

| Key            | Value                                         |
|----------------|-----------------------------------------------|
| `apikey`       | `YOUR_SUPABASE_ANON_KEY`                      |
| `Authorization`| `Bearer YOUR_SUPABASE_ANON_KEY`               |
| `Content-Type` | `application/json`                            |
| `Prefer`       | `return=representation`                       |

- **Replace** `YOUR_SUPABASE_ANON_KEY` with your actual Supabase anon key.
- 

### 3. Add the JSON Body

In the **Body** section, select **raw** and set the type to **JSON**. Add the following JSON data to simulate a bookmark entry:

```json
{
  "title": "Sample Bookmark Title",
  "url": "https://example.com",
  "created_at": "2024-11-11T10:30:00Z",
  "tags": ["sample", "test", "postman"]
}
```

This JSON object contains sample data for the title, URL, creation time, and tags. You can adjust the values as needed.

### 4. Send the Request

Click **Send** to execute the request. 

### 5. Check the Response

- If the request is successful, you should see a **201 Created** response with a JSON response body showing the newly created bookmark entry.
- If there’s an error, the response will include an error message indicating the issue. This could be due to authentication, permissions, table structure, or data formatting.

### 6. Troubleshoot Common Issues

- **401 Unauthorized**: This usually means there's an issue with the `apikey` or `Authorization` header. Double-check that the `anon key` is correct.
- **403 Forbidden**: This could mean that Row Level Security (RLS) is enabled on the `bookmarks` table, and the insert policy doesn’t allow for anonymous writes.
- **400 Bad Request**: Indicates an issue with the JSON structure. Make sure the data types (like `text[]` for tags) match the Supabase table schema.
  
![postman](img/postman.png)

---


The `Prefer: return=representation` header in Supabase requests tells the API to return the newly created row as a response, which is why removing it leads to no response in your case. However, if `return=representation` is causing issues with your Row Level Security (RLS) policy, there may be a workaround to get a response while keeping RLS enabled.

Here are a few ways to troubleshoot or work around this issue:

### 7. Check RLS Policy Configuration

Ensure that your RLS policy allows reading the inserted rows. Sometimes, the issue is that the `return=representation` header requires read permissions immediately after the row is inserted. Try adding a policy that allows read access to the table:

```sql
-- Allow everyone to select (read) rows
CREATE POLICY "Allow select for all" ON public.bookmarks
FOR SELECT USING (true);
```

After adding this policy, test the request again with `Prefer: return=representation` in the header. This policy allows read access for the table, so the inserted row should be returned in the response.

### 8. Use `return=minimal` as an Alternative

If you don’t need the response data and only want confirmation that the row was created, you can use `Prefer: return=minimal` instead of `return=representation`. This will reduce the response payload and might work better with RLS.

Update the headers in Postman as follows:

```plaintext
Prefer: return=minimal
```

This option will not return the row data, but it will give a success response code if the request is successful.

### 9. Use `select` After Insert as a Separate Request

If you absolutely need the response and `return=representation` doesn’t work with your RLS setup, you could make a **two-step** request:

1. **Insert the Bookmark**: Send the initial POST request without `Prefer: return=representation`.
2. **Retrieve the Bookmark**: Send a GET request to fetch the inserted bookmark using filters, such as `title` or `created_at`.

For example, your GET request in Postman might look like this:

```
GET https://YOUR_SUPABASE_PROJECT.supabase.co/rest/v1/bookmarks?title=eq.Sample%20Bookmark%20Title
```