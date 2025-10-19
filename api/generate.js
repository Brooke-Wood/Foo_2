export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, initImage, prompt } = req.body;

    // Make the request to ModelsLab from the backend (not the browser)
    const response = await fetch('https://api.modelslab.com/api/v6/images/img2img', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: apiKey,
        init_image: initImage,
        prompt: prompt,
        negative_prompt: '',
        strength: 0.5,
        guidance_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000),
        samples: 1,
        steps: 30,
        safety_checker: true,
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
