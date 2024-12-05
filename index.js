const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

// Environment Variables (Replace these with your actual values for testing)
const LINKEDIN_CLIENT_ID = '864jl3dc01smkf';
const LINKEDIN_CLIENT_SECRET = 'WPL_AP1.EZtmamGVVTNEdWOt.NksrwA==';
const REDIRECT_URI = 'http://localhost:3000/auth/linkedin/callback';

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Logging middleware for requests (Optional)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Step 1: Handle LinkedIn Redirect (Exchange Code for Access Token)
app.post('/auth/linkedin/callback', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Step 2: Fetch User Profile using Access Token
    const profileResponse = await axios.get(
      'https://api.linkedin.com/v2/me',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Step 3: Fetch User Email using Access Token (Optional)
    const emailResponse = await axios.get(
      'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userProfile = profileResponse.data;
    const userEmail = emailResponse.data.elements[0]['handle~'].emailAddress;

    // Send user data to the frontend
    res.json({
      accessToken,
      user: {
        id: userProfile.id,
        name: `${userProfile.localizedFirstName} ${userProfile.localizedLastName}`,
        email: userEmail,
      },
    });
  } catch (error) {
    console.error('Error during LinkedIn sign-in:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to authenticate with LinkedIn' });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
