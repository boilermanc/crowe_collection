Here is a detailed prompt to provide to Cursor for integrating the new Signal Chain Guide into the Rekkrd website.

---

**Goal:** Integrate the provided `signal-chain-guide.html` file as a new blog post on the Rekkrd website (rekkrd.com).

**Context:** The Rekkrd website is built with **React** and uses **React Router** for routing. It does not use Tailwind CSS; instead, it uses a custom CSS stylesheet with a BEM-like class naming convention (e.g., `.blog-page`, `.blog-post-detail`, `.nav-logo`). The new HTML file has been built to match this existing structure and styling precisely.

### Step 1: Create the New Blog Post Page

1.  **Create a new route** in the React Router configuration for the URL `/blog/understanding-your-signal-chain-in-stakkd`.
2.  This route should render a new React component, let's call it `SignalChainPost`. This component will be a sibling to the other blog post components.
3.  The `SignalChainPost` component should replicate the structure of existing blog post pages, which is roughly:
    ```jsx
    <div className="blog-page">
      <Nav />
      <main className="container">
        <article className="blog-post-detail">
          {/* ... content goes here ... */}
        </article>
      </main>
      <Footer />
    </div>
    ```
4.  **Copy the entire `<article>` section** from the attached `signal-chain-guide.html` file and place it inside the `<main className="container">` section of your new `SignalChainPost` component. The HTML is self-contained and includes all necessary classes and structure.
5.  **Ensure the JavaScript for the tabs works.** The `<script>` tag at the bottom of `signal-chain-guide.html` contains a simple function `showTab()`. This needs to be included and executable within the React component. You can either add this to a `useEffect` hook or place it in the main `index.html` if that's more appropriate for the site's architecture.

### Step 2: Update the Main Blog Listing Page

1.  Navigate to the code for the main blog listing page, which is rendered at `/blog`.
2.  You will see a list or grid of existing blog post cards.
3.  **Add a new card** to the top of this list for the new Signal Chain guide.
4.  The card should have the following information:
    *   **Link:** `/blog/understanding-your-signal-chain-in-stakkd`
    *   **Title:** Understanding Your Signal Chain in Stakkd
    *   **Author:** Rekkrd
    *   **Date:** February 27, 2026
    *   **Summary:** Everything you need to know about your vinyl signal chain — from the basics to a deep technical dive — and how to set it up in Stakkd.
    *   **Image:** You can leave the image blank for now or use the same placeholder style as the hero section in the post itself.

### Step 3: Final Review

1.  Verify that the new blog post renders correctly at its URL.
2.  Confirm that all styles (fonts, colors, layout) match the other blog posts.
3.  Check that the tab functionality in the new post is working correctly.
4.  Ensure the new card appears correctly on the main `/blog` page and links to the new post.

All the necessary HTML and CSS are provided in `signal-chain-guide.html`. Your main task is to integrate this static content into the existing React component structure and routing system.
