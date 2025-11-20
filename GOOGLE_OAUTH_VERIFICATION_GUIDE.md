# Google OAuth App Verification Guide

## Current OAuth Scopes Analysis

Your application currently uses the following scopes:

### ✅ Current Scopes (Appropriate for Your Use Case)

1. **`email`** - Basic profile information
   - **Purpose**: User identification and authentication
   - **Why needed**: To identify users logging into your application

2. **`profile`** - User profile information
   - **Purpose**: User profile data (name, picture)
   - **Why needed**: To display user information in the dashboard

3. **`https://www.googleapis.com/auth/spreadsheets.readonly`** - Read-only access to Google Sheets
   - **Purpose**: Read data from Google Sheets to extract milestone information
   - **Why needed**: Your app reads milestone data (Title, Description, Due Date, etc.) from user's Google Sheets to create Trello cards
   - **Operations**: 
     - `spreadsheets.values.get` - Read cell values
     - `spreadsheets.get` - Get sheet metadata

4. **`https://www.googleapis.com/auth/drive.readonly`** - Read-only access to Google Drive
   - **Purpose**: List and access Google Sheets files
   - **Why needed**: Users need to browse and select their Google Sheets from Drive
   - **Operations**:
     - `drive.files.list` - List Google Sheets files

### ✅ Scope Assessment: **NO ADDITIONAL SCOPES NEEDED**

Your current scopes are **minimal and appropriate** for your use case:
- ✅ Read-only access (no write permissions)
- ✅ Only accesses what's necessary
- ✅ Follows principle of least privilege

**You do NOT need any additional scopes** because:
- ❌ You don't create or modify Google Sheets
- ❌ You don't create or modify Google Drive files
- ❌ You don't need write access to any Google services
- ❌ You only read data to extract milestone information

---

## Step-by-Step: Google App Verification for External Publishing

### Prerequisites Checklist

Before starting verification, ensure you have:

- [ ] **Google Cloud Project** with OAuth consent screen configured
- [ ] **OAuth 2.0 Client ID** created
- [ ] **Production domain** (not localhost) for redirect URIs
- [ ] **Privacy Policy URL** (required)
- [ ] **Terms of Service URL** (recommended)
- [ ] **Support email** (required)
- [ ] **Application homepage URL** (required)
- [ ] **Application logo** (recommended, 120x120px minimum)

---

### Step 1: Configure OAuth Consent Screen

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/
   - Select your project

2. **Open OAuth Consent Screen**
   - Go to: **APIs & Services** → **OAuth consent screen**

3. **Configure App Information**
   - **User Type**: Select **External** (for public users)
   - **App name**: `Sheet to Trello Automation` (or your preferred name)
   - **User support email**: Your support email address
   - **App logo**: Upload a logo (120x120px minimum, PNG or JPG)
   - **Application homepage link**: Your production URL (e.g., `https://yourdomain.com`)
   - **Application privacy policy link**: **REQUIRED** - URL to your privacy policy
   - **Application terms of service link**: Recommended - URL to your terms
   - **Authorized domains**: Add your production domain (e.g., `yourdomain.com`)
   - **Developer contact information**: Your email address

4. **Add Scopes**
   - Click **"Add or Remove Scopes"**
   - Add the following scopes:
     - ✅ `.../auth/userinfo.email`
     - ✅ `.../auth/userinfo.profile`
     - ✅ `.../auth/spreadsheets.readonly`
     - ✅ `.../auth/drive.readonly`
   - Click **"Update"** then **"Save and Continue"**

5. **Add Test Users (Optional - for testing before verification)**
   - Add email addresses of users who can test your app
   - Click **"Save and Continue"**

6. **Review Summary**
   - Review all information
   - Click **"Back to Dashboard"**

---

### Step 2: Prepare Required Documentation

#### A. Privacy Policy (REQUIRED)

Your privacy policy must include:

1. **What data you collect**
   ```
   - User email and profile information (for authentication)
   - Google Sheets data (read-only, to extract milestone information)
   - Trello API credentials (encrypted and stored securely)
   ```

2. **How you use the data**
   ```
   - Authentication and user account management
   - Reading Google Sheets to extract milestone data
   - Creating Trello cards based on milestone data
   - Storing encrypted Trello credentials for API access
   ```

3. **Data storage and security**
   ```
   - Data is stored in PostgreSQL database
   - Trello credentials are encrypted using AES-256 encryption
   - Access tokens are stored securely and refreshed automatically
   - No data is shared with third parties except Trello API (for card creation)
   ```

4. **User rights**
   ```
   - Users can revoke access at any time
   - Users can delete their account and data
   - Users can request data export
   ```

**Example Privacy Policy URL**: `https://yourdomain.com/privacy-policy`

#### B. Terms of Service (Recommended)

Include:
- Service description
- User responsibilities
- Data usage terms
- Limitation of liability

**Example Terms URL**: `https://yourdomain.com/terms-of-service`

#### C. Video Demonstration (Recommended)

Create a short video (2-5 minutes) showing:
1. How users connect their Google account
2. How the app reads Google Sheets (read-only)
3. How the app creates Trello cards
4. That no data is modified in Google Sheets/Drive

**Upload to**: YouTube or your website

---

### Step 3: Submit for Verification

1. **Go to OAuth Consent Screen**
   - Navigate to: **APIs & Services** → **OAuth consent screen**

2. **Click "PUBLISH APP"**
   - This will make your app available to external users
   - You'll see a warning about verification requirements

3. **Click "SUBMIT FOR VERIFICATION"**
   - You'll be redirected to the verification form

4. **Fill Out Verification Form**

   **Section 1: App Information**
   - App name: `Sheet to Trello Automation`
   - Support email: Your support email
   - Homepage URL: `https://yourdomain.com`
   - Privacy Policy URL: `https://yourdomain.com/privacy-policy`
   - Terms of Service URL: `https://yourdomain.com/terms-of-service` (if available)

   **Section 2: Scopes Justification**

   For each scope, provide justification:

   **Scope: `https://www.googleapis.com/auth/userinfo.email`**
   ```
   Justification:
   "This scope is required to identify and authenticate users logging into our application. We use the email address to create and manage user accounts, associate workflows with specific users, and provide personalized dashboard experiences. The email is stored securely in our database and is never shared with third parties."
   ```

   **Scope: `https://www.googleapis.com/auth/userinfo.profile`**
   ```
   Justification:
   "This scope allows us to display user profile information (name and profile picture) in the application dashboard for a personalized user experience. This information is used only for display purposes within the application and is not shared externally."
   ```

   **Scope: `https://www.googleapis.com/auth/spreadsheets.readonly`**
   ```
   Justification:
   "This read-only scope is essential for our core functionality. Our application automates Trello card creation from milestone data stored in users' Google Sheets. We need read-only access to:
   
   1. Read milestone data (Title, Description, Due Date, Labels, Members, etc.) from user-selected Google Sheets
   2. Extract structured data to create corresponding Trello cards
   3. Display sheet information (title, metadata) in the user interface
   
   We use the following read-only operations:
   - spreadsheets.values.get: To read cell values and extract milestone rows
   - spreadsheets.get: To retrieve sheet metadata and titles
   
   IMPORTANT: We do NOT modify, create, or delete any Google Sheets. All operations are read-only. The data is only used temporarily during workflow execution to create Trello cards, and is not stored permanently except for workflow configuration (sheet ID reference)."
   ```

   **Scope: `https://www.googleapis.com/auth/drive.readonly`**
   ```
   Justification:
   "This read-only scope is required to allow users to browse and select their Google Sheets from Google Drive. We need this scope to:
   
   1. List Google Sheets files from the user's Drive
   2. Display available sheets in a user-friendly interface
   3. Allow users to select which sheet to use for workflow automation
   
   We use the following read-only operation:
   - drive.files.list: To list Google Sheets files (filtered by MIME type 'application/vnd.google-apps.spreadsheet')
   
   IMPORTANT: We do NOT access, modify, or delete any files other than Google Sheets. We only list files to help users select their data source. We do not read file contents from Drive API - we only use the file list to get sheet IDs, then access sheets directly via Sheets API."
   ```

   **Section 3: Video Demonstration (Optional but Recommended)**
   - Upload a video link showing your app's functionality
   - Demonstrate that you only read data, never modify

   **Section 4: Additional Information**
   - **App domain**: `yourdomain.com`
   - **Authorized redirect URIs**: List all your production redirect URIs
   - **Use case description**: 
     ```
     "Our application helps users automate project management by reading milestone data from Google Sheets and automatically creating corresponding Trello cards. This eliminates manual data entry and streamlines workflow automation between Google Sheets and Trello."
     ```

5. **Submit the Form**
   - Review all information carefully
   - Click **"Submit for Verification"**

---

### Step 4: Verification Review Process

**Timeline**: Google typically reviews verification requests within **3-7 business days**

**What Google Reviews**:
- ✅ Scope justification clarity
- ✅ Privacy policy completeness
- ✅ App functionality matches stated use case
- ✅ Security practices
- ✅ User data handling

**Possible Outcomes**:
1. **✅ Approved**: Your app is verified and can be used by all users
2. **⚠️ More Information Needed**: Google requests additional details
3. **❌ Rejected**: Google rejects (rare, usually fixable with clarification)

---

### Step 5: Handle Verification Response

**If Approved**:
- ✅ Your app is now verified
- ✅ All users can use your app
- ✅ No user limit restrictions

**If More Information Needed**:
- Respond to Google's questions promptly
- Provide additional documentation if requested
- Clarify any scope usage if unclear

**Common Questions Google May Ask**:
- "Why do you need Drive access if you only use Sheets?"
  - **Answer**: "We need Drive API to list Google Sheets files so users can browse and select their sheets. We filter results to only show Google Sheets (MIME type: application/vnd.google-apps.spreadsheet) and do not access any other file types."

- "Do you store Google Sheets data?"
  - **Answer**: "We temporarily read Google Sheets data during workflow execution to extract milestone information. We do not permanently store the sheet content. We only store the sheet ID reference in workflow configuration so users can re-run workflows on the same sheet."

---

## Scope Justification Template (Copy-Paste Ready)

### For Verification Form:

**Application Purpose**:
```
Our application automates project management workflows by reading milestone data from users' Google Sheets and automatically creating corresponding Trello cards. This eliminates manual data entry and streamlines workflow automation between Google Sheets and Trello boards.
```

**Why We Need Each Scope**:

1. **`userinfo.email`**: Required for user authentication and account management. We use email to identify users and associate their workflows with their accounts.

2. **`userinfo.profile`**: Used to display user name and profile picture in the dashboard for a personalized experience.

3. **`spreadsheets.readonly`**: **Core functionality** - We read milestone data (Title, Description, Due Date, Labels, Members) from user-selected Google Sheets to create Trello cards. We use read-only operations: `spreadsheets.values.get` and `spreadsheets.get`. We do NOT modify any sheets.

4. **`drive.readonly`**: Required to list Google Sheets files from users' Drive so they can browse and select which sheet to use. We use `drive.files.list` filtered to only show Google Sheets. We do NOT access other file types or modify any files.

**Data Handling**:
- We temporarily read Google Sheets data during workflow execution
- We do not permanently store sheet content
- We only store sheet ID references in workflow configuration
- Trello credentials are encrypted using AES-256
- No data is shared with third parties except Trello API (for card creation)

**Security**:
- All API credentials are encrypted at rest
- Access tokens are stored securely and auto-refreshed
- Users can revoke access at any time
- HTTPS encryption for all data transmission

---

## Important Notes

### ⚠️ Before Verification

1. **Test Thoroughly**: Ensure your app works correctly with test users
2. **Update Redirect URIs**: Use production URLs, not localhost
3. **Privacy Policy**: Must be publicly accessible
4. **Support Email**: Must be monitored and responsive

### ✅ Best Practices

1. **Minimal Scopes**: You're already using minimal scopes ✅
2. **Clear Justification**: Be specific about why each scope is needed
3. **Security**: Emphasize encryption and secure storage
4. **Transparency**: Clearly state what data you access and why

### 🔒 Security Reminders

- Never request more scopes than needed
- Always use read-only scopes when possible (you're doing this ✅)
- Encrypt sensitive data (Trello credentials)
- Provide clear privacy policy
- Allow users to revoke access easily

---

## Quick Checklist for Submission

- [ ] OAuth consent screen configured with all app details
- [ ] All scopes added and justified
- [ ] Privacy policy published and accessible
- [ ] Terms of service published (recommended)
- [ ] Support email configured and monitored
- [ ] Production domain configured
- [ ] Redirect URIs updated to production URLs
- [ ] Video demonstration created (optional but recommended)
- [ ] Scope justifications prepared
- [ ] Application tested with test users
- [ ] Ready to submit for verification

---

## Resources

- [Google OAuth Verification Guide](https://support.google.com/cloud/answer/9110914)
- [OAuth Consent Screen Documentation](https://developers.google.com/identity/protocols/oauth2/policies)
- [Scope Verification Best Practices](https://developers.google.com/identity/protocols/oauth2/policies#scope-verification)

---

## Need Help?

If you encounter issues during verification:
1. Check Google's verification status in Cloud Console
2. Review Google's feedback carefully
3. Update documentation based on feedback
4. Resubmit with clarifications

**Common Issues**:
- Privacy policy not accessible → Ensure it's publicly available
- Scope justification unclear → Be more specific about use case
- Missing information → Complete all required fields

