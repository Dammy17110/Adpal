# AdPal – setup guide

AdPal is a website that people open in Chrome and can install like an app.
It needs 3 free accounts: Google AI Studio (the AI), GitHub (stores the files), Vercel (puts it online).
Setup is easiest on a computer, but it is possible on a phone using Chrome's "Desktop site".

## 1. Get your FREE AI key (no card needed)
1. Go to aistudio.google.com and sign in with a Google account.
2. Click "Get API key" and then "Create API key". Copy it and keep it SECRET.
   Never paste it into index.html or send it to anyone.
3. Do NOT add billing. Without billing you stay on the free plan, so you can never be charged.
4. Free-plan limits apply (requests per minute and per day). When they run out, the app shows
   a "try again later" message and works again the next day.
5. Privacy note: on the free plan, Google may use what is sent to improve its products.
   Tell customers not to put private details in their promos.

## 2. Put the files on GitHub
1. Create a free account at github.com.
2. Click "New repository" and name it adpal.
3. Click "uploading an existing file" and drag in ALL files from this folder.
   Keep the "api" folder (it contains generate.js).
4. Click "Commit changes".

## 3. Put it online with Vercel
1. Go to vercel.com and sign up with GitHub.
2. Click "Add New… > Project" and import your adpal repository.
3. Open "Environment Variables" and add:
   - GEMINI_API_KEY = your key from step 1
   - HOURLY_LIMIT = 12 (optional: promos per person per hour)
   - MODEL = gemini-2.5-flash (optional: if Google retires this model, put the current free Flash model name from AI Studio)
4. Click "Deploy". After a minute you get a link like adpal.vercel.app.

## 4. Use it
- Open the link in Chrome on any phone. No Claude account needed.
- Chrome shows an "Install app" button (or menu > Add to Home screen).
- To change something later, edit the file on GitHub. Vercel updates by itself.

## Notes
- The per-person limit is a simple protection, not perfect.
- Later: add a custom domain, and Paystack or Flutterwave when you start charging.
