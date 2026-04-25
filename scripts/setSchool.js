#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const school = process.argv[2];
const envPath = path.join(__dirname, '../.env.local');

if (!school) {
  console.error('School name is required');
  process.exit(1);
}

try {
  let envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Replace or add VITE_SCHOOL
  if (envContent.includes('VITE_SCHOOL=')) {
    envContent = envContent.replace(/VITE_SCHOOL=.*/g, `VITE_SCHOOL=${school}`);
  } else {
    envContent += `\nVITE_SCHOOL=${school}`;
  }
  
  fs.writeFileSync(envPath, envContent, 'utf-8');
  console.log(`✅ Updated VITE_SCHOOL to: ${school}`);
} catch (error) {
  console.error('Error updating .env.local:', error.message);
  process.exit(1);
}
