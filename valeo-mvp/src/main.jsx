import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
/* 600 carries every heading. 400 exists for one thing: the clinician's note,
   which is a person writing rather than a page shouting. */
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/600.css';
/* Chakra Petch is the meter face: squared terminals and mechanical numerals, so
   a score reads as instrumentation rather than editorial. Used ONLY for live
   readouts — never for prose, where it would look like a video game. */
import '@fontsource/chakra-petch/600.css';
import '@fontsource/chakra-petch/700.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
