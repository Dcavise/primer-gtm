# Primer GTM Dashboard

*Updated: March 7, 2025 - Added new features for CRM Pipeline, Campus Staff, and Admissions Analytics*

## Project info

## Installation and Development

There are several ways of editing your application.

### Quick Start

```sh
# Step 1: Clone the repository
git clone https://github.com/Dcavise/primer-gtm.git

# Step 2: Navigate to the project directory
cd primer-gtm

# Step 3: Install the necessary dependencies
npm install

# Step 4: Start the development server
npm run dev
```

## Database Setup for Salesforce Integration

The application uses SQL functions in Supabase to access Salesforce data. To set up these functions in a new environment:

1. Create a `.env` file with your Supabase credentials:
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

2. Execute the SQL functions needed for Salesforce integration:
```bash
node execute_fivetran_functions.js
node execute_fivetran_views.js
```

These scripts will create the necessary SQL functions and views to access Salesforce data through Supabase.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Deploy with Vercel

1. Create a new project in Vercel
2. Connect your GitHub repository
3. Configure the following settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. Set up the environment variables in the Vercel project settings:
   - Copy all variables from your `.env` file to Vercel's environment variables section
   - Make sure to update `VITE_APP_URL` to your Vercel deployment URL
5. Deploy the project

If you encounter any issues with deployment:
- Make sure all required environment variables are set in Vercel
- Check that the build command and output directory are correctly configured
- Verify that the Vercel project is connected to the correct branch of your repository

## Custom Domains

To use a custom domain with your application, you can configure it through Vercel's domain settings or deploy with Netlify which offers similar custom domain capabilities.
