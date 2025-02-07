# Haki (حكي) - Humanized AI Chatting Web App

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/Node-%3E%3D16.0.0-brightgreen)
![Express Version](https://img.shields.io/badge/Express-%5E4.18.0-lightgrey)
![OpenAI](https://img.shields.io/badge/OpenAI-API-darkgreen)

Haki is a chat application that simulates natural conversations in different Arabic dialects (Palestinian, Syrian, and Saudi Arabian) using AI. Creates a chatting experience by incorporating realistic typing delays, dialect-specific responses, and human-like behaviors.

<div align="center">
  <img src="./assets/haki-preview.png" alt="Haki Preview" width="1920" height="953">
</div>

## Features

- Support for multiple Arabic dialects
- Realistic typing delays and response times
- AI-powered conversations using OpenAI
- Dialect-specific expressions
- Human-like behaviors
- Responsive design

### Installation

1. Clone the repository:
```bash
git clone https://github.com/immapolar/Haki-Humanized-AI-Chatting
```

2. Install dependencies:
```bash
npm install
```

3. Modify `.env`:
```bash
PORT=your_port_here
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run the server:
```bash
node app.js
```

> [!NOTE]
> The app will simulate realistic chat behaviors by default, including random wait times.

## Customization

### Adding New Dialects

Add new dialects in `app.js` by extending the `dialectResponses` object:

```javascript
const dialectResponses = {
    'NewDialect': [
        "Your dialect-specific responses here",
        // Add more responses
    ],
    // Existing dialects...
};
```

### Styling

Customize the app's appearance by modifying `style.css`:

```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #1e40af;
    // ... other variables
}
```

## License

This project is [MIT](https://opensource.org/licenses/MIT) licensed.
