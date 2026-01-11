# AI Creative Platform

A full-stack AI-powered creative platform designed to assist users with various generative AI tasks, including AI chat, book outline generation, murder mystery plotting, and game story creation. The platform features user authentication, trial credit management, and subscription options.

## Features

-   **AI Chat:** Interact with an AI assistant with a chat-like interface.
-   **Book Outline Generator:** Generate detailed outlines for your book projects.
-   **Murder Mystery Generator:** Create immersive whodunits with plot details.
-   **Game Story & Characters Generator:** Build narratives and characters for games.
-   **Saved Content:** Save and review your generated AI content.
-   **Trial Management:** Users receive a limited number of free trial credits before requiring a subscription.
-   **Subscription System:** Premium access for unlimited generations.
-   **Gmail-Only Sign-up:** Restrict user registrations to valid Gmail accounts (client-side validation).
-   **User Authentication:** Secure sign-up, sign-in, and session management powered by Supabase.

## Technologies Used

-   **Frontend:** Next.js (React), ReactMarkdown for content rendering.
-   **Backend:** Next.js API Routes (Edge Runtime).
-   **Styling:** Inline styles (for rapid prototyping and component-level styling).
-   **Authentication & Database:** Supabase (Auth, PostgreSQL database).
-   **AI Integration:** AI SDK (`ai`, `@ai-sdk/openai`).
-   **Stripe:** For subscription management (API routes for checkout sessions and webhooks).

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

-   Node.js (v18 or higher)
-   npm or yarn
-   A Supabase project (with PostgreSQL database enabled)
-   An OpenAI API Key
-   (Optional) A Stripe account for subscription testing

### 1. Clone the Repository

```bash
git clone https://github.com/sunder-kumar/ai-creative-platform.git
cd ai-creative-platform
```

### 2. Install Dependencies

```bash
npm install
# or yarn install
# or pnpm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root of your project and add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

OPENAI_API_KEY=YOUR_OPENAI_API_KEY

STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET
```

-   **Supabase:** You can find your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your Supabase project settings under "API".
-   **OpenAI:** Obtain your `OPENAI_API_KEY` from the OpenAI platform.
-   **Stripe:** Obtain your `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` from your Stripe dashboard.

#### Supabase Database Setup

You'll need to set up your Supabase database schema. A basic schema is provided in `supabase/schema.sql`. You can apply this schema using the Supabase SQL Editor.

**Important Supabase Configuration:**
-   **Email Confirmations:** For robust user verification (recommended for trial management), navigate to your Supabase Project Dashboard -> Authentication -> Settings, and ensure "Enable Email Confirmations" is turned ON.
-   **Auth Redirect URLs:** Add `http://localhost:3000/auth/callback` to your Supabase Auth Redirect URLs for local development.

### 4. Run the Development Server

```bash
npm run dev
# or yarn dev
# or pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

-   **Sign Up/Sign In:** Create an account (only Gmail accounts are accepted).
-   **Dashboard:** Navigate through various AI tools.
-   **AI Chat:** Start a conversation with the AI assistant.
-   **Generators:** Use the Book Outline, Murder Mystery, and Game Story generators.
-   **Saved Content:** View and manage your saved generations.
-   **Subscription:** Access the subscribe page for unlimited usage.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any features, bug fixes, or improvements.

## License

This project is open-source and available under the [MIT License](LICENSE).

You can try it [Live!](https://ai-creative-platform-nu.vercel.app/).
