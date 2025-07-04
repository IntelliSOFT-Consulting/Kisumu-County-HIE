import express from "express";
import cors from 'cors'
import * as dotenv from 'dotenv'
import cron from 'node-cron';
// import { setupSwagger } from "./swagger";

dotenv.config() // Load environment variables

const CRON_INTERVAL = Number(process.env.CRON_INTERVAL ?? 10); // set interval for cron jobs


//Import routes 

import Auth from './routes/auth';
import Patient from './routes/patient';
import Encounter from './routes/encounters';
import Observation from './routes/observations';


const app = express();
const PORT = 3000;

app.use(cors());

// setupSwagger(app);

app.use((req, res, next) => {
  try {
    // Starts when a new request is received by the server
    console.log(`${new Date().toUTCString()} : The Mediator has received ${req.method} request from ${req.hostname} on ${req.path}`);
    next()
  } catch (error) {
    // Starts when a new request is received by the server
    res.json(error);
    return;
  }
});

// app.use('/auth', Auth)
app.use('/client-registry/v1/Patient', Patient);
app.use('/shr/v1/Encounter', Encounter);
app.use('/shr/v1/Observation', Observation);





app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});

// Set up a cron job to run every three minutes
// cron.schedule(`*/${CRON_INTERVAL} * * * *`, () => {
//   console.log(`Cron job running every ${CRON_INTERVAL} minutes`);
//   fetchVisits();
//   fetchApprovedEndorsements();
// });

