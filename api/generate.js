// This is a Vercel serverless function that handles image generation
// It acts as a middleman between your frontend and ModelsLab's API
// This keeps your API key secure and avoids CORS issues

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract the data sent from the frontend
    const { apiKey, initImage, prompt } = req.body;

    // Validate that we have all required data
    if (!apiKey || !initImage || !prompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Forwarding request to ModelsLab API...');

    // Make the request to ModelsLab from the backend
    // This request happens server-to-server, so no CORS issues
    const response = await fetch('https://api.modelslab.com/api/v6/images/img2img', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: apiKey, // User's API key
        init_image: initImage, // The canvas drawing as base64
        prompt: prompt, // What to generate
        negative_prompt: '',
        strength: 0.5,
        guidance_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000),
        samples: 1,
        steps: 30,
        safety_checker: true,
      }),
    });

    // Check if the response is ok
    if (!response.ok) {
      console.error('ModelsLab API error:', response.status);
      return res.status(response.status).json({ 
        error: `ModelsLab API returned ${response.status}` 
      });
    }

    // Parse the response from ModelsLab
    const data = await response.json();
    console.log('ModelsLab response:', data);

    // Send the ModelsLab response back to the frontend
    return res.status(200).json(data);

  } catch (error) {
    // Log the error for debugging
    console.error('Backend error:', error);
    // Send error back to frontend
    return res.status(500).json({ error: error.message });
  }
}
