const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const activeSessions = new Map();

const dialectResponses = {
    'Palestinian': [
        "مرحبا، كيف حالك؟",
        "شو أخبارك اليوم؟",
        "إن شاء الله تكون بخير",
        "بتحب نحكي عن شي معين؟",
        "شو رأيك نتعرف أكثر؟"
    ],
    'Syrian': [
        "كيفك؟ شو عم تعمل؟",
        "يا هلا، كيفك اليوم؟",
        "إن شاء الله تكون بأحسن حال",
        "شو رأيك نحكي شوي؟",
        "خبرني عن يومك"
    ],
    'Saudi Arabian': [
        "السلام عليكم، كيف حالك؟",
        "وش أخبارك اليوم؟",
        "عساك بخير",
        "ودي نتعرف أكثر",
        "تبي نتكلم عن شي معين؟"
    ]
};

function getRandomResponse(dialect) {
    const responses = dialectResponses[dialect];
    return responses[Math.floor(Math.random() * responses.length)];
}

function getTypingDelay(messageLength) {
    const baseDelay = 1000;
    const perCharDelay = 50;
    return Math.min(baseDelay + (messageLength * perCharDelay), 5000);
}

app.get('/', (req, res) => {
    if (!req.session.chatId) {
        req.session.chatId = Math.random().toString(36).substring(7);

        const dialects = Object.keys(dialectResponses);
        const randomDialect = dialects[Math.floor(Math.random() * dialects.length)];

        activeSessions.set(req.session.chatId, {
            dialect: randomDialect,
            messages: []
        });
    }

    res.render('index', {
        sessionData: activeSessions.get(req.session.chatId)
    });
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function generateAIResponse(message, dialect, previousMessages = []) {
    try {
        const conversationHistory = previousMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        }));

        const dialectTraits = {
            'Palestinian': {
                vocab: "Use Palestinian words like 'وين' instead of 'أين', 'شو' instead of 'ماذا', 'هيك' instead of 'هكذا', 'بدي' instead of 'أريد', 'كتير' instead of 'كثير'",
                style: "Use casual Palestinian expressions like 'يسلمو', 'والله', 'يا زلمة'. Avoid formal Arabic completely."
            },
            'Syrian': {
                vocab: "Use Syrian words like 'شلون' instead of 'كيف', 'هلأ' instead of 'الآن', 'شو' instead of 'ماذا', 'منيح' instead of 'جيد', 'في' instead of 'يوجد'",
                style: "Use Syrian expressions like 'تكرم عينك', 'يا حبيبي', 'والله'. Keep it very casual and friendly."
            },
            'Saudi Arabian': {
                vocab: "Use Saudi words like 'وش' instead of 'ماذا', 'ابغى' instead of 'أريد', 'فيه' instead of 'يوجد', 'ذا' instead of 'هذا', 'كذا' instead of 'هكذا'",
                style: "Use Saudi expressions like 'يالغالي', 'والله', 'يا حبيبي'. Be casual but slightly more formal than other dialects."
            }
        };

        const dialectInfo = dialectTraits[dialect];

        const systemPrompt = {
            role: 'system',
            content: `You are a young person chatting casually in ${dialect} dialect. Important instructions:

- Use ONLY ${dialect} dialect vocabulary and expressions, NEVER use formal Arabic
- ${dialectInfo.vocab}
- ${dialectInfo.style}
- Keep responses SHORT and CASUAL like texting (1-2 lines maximum)
- Use common typing shortcuts and casual punctuation
- Respond like you're texting a friend
- NEVER use formal Arabic expressions or grammar
- If user writes in English, respond in ${dialect} dialect Arabic
- Act natural and spontaneous, like a real person texting
- Show personality and emotion through dialect expressions
- Avoid any hint of being AI or formal

Remember: You're just a normal person having a casual chat. Keep it super natural and informal.`
        };

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                systemPrompt,
                ...conversationHistory,
                { role: 'user', content: message }
            ],
            temperature: 0.9,
            max_tokens: 100,
            presence_penalty: 0.6,
            frequency_penalty: 0.3
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return getRandomResponse(dialect);
    }
}

app.post('/api/message', async (req, res) => {
    const { message } = req.body;
    const sessionData = activeSessions.get(req.session.chatId);

    if (!sessionData) {
        return res.status(400).json({
            success: false,
            error: 'Invalid session'
        });
    }

    try {
        sessionData.lastActive = Date.now();

        sessionData.messages.push({
            text: message,
            sender: 'user',
            timestamp: Date.now()
        });

        const response = await generateAIResponse(
            message,
            sessionData.dialect,
            sessionData.messages.slice(-6)
        );

        const delay = getTypingDelay(response.length);

        setTimeout(() => {
            sessionData.messages.push({
                text: response,
                sender: 'ai',
                timestamp: Date.now()
            });

            res.json({
                success: true,
                response: response,
                typing: delay
            });
        }, delay);

    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.get('/api/status', (req, res) => {
    const sessionData = activeSessions.get(req.session.chatId);

    if (!sessionData) {
        return res.status(400).json({
            success: false,
            error: 'Invalid session'
        });
    }
});

setInterval(() => {
    const now = Date.now();
    for (const [sessionId, data] of activeSessions.entries()) {
        if (now - data.lastActive > 10 * 60 * 1000) {
            activeSessions.delete(sessionId);
        }
    }
}, 60 * 1000);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Haki server running on port ${port}`);
});