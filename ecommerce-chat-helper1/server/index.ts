import 'dotenv/config';
import express, { type Express, type Request, type Response } from 'express';
import {MongoClient} from 'mongodb';
import {callAgent} from './agent';

const app: Express = express();
const port = process.env.PORT || 8000; // Use environment variable for port or default to 3000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


import cors from 'cors';
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_ATLAS_URI as string);


async function startServer() {
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('Connected to MongoDB Atlas');  
    app.get('/', async (req: Request, res: Response) => {
      res.send('Hello, World!');
    });

    app.post('/chat', async (req: Request, res: Response) => {
      const initialMessage  = req.body.message;
      const threadId = Date.now().toString(); // Generate a unique thread ID (you can use a more robust method in production)
      console.log(initialMessage);

      try {
        const response = await callAgent(client ,initialMessage, threadId);
        res.json({ threadId,response });
      } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
      }
    })


   app.post('/chat/:threadId', async (req: Request, res: Response) => {
      const threadId = req.params.threadId;
      const message = req.body.message;
      console.log(`Received message for thread ${threadId}: ${message}`); 
      try {
        const response = await callAgent(client, message, threadId);
        res.json({ response });
      } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
      }
    });

  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
    process.exit(1); // Exit the process with an error code
  }
}