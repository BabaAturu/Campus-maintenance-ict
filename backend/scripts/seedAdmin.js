import 'dotenv/config';
import readline from 'node:readline/promises';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User, { USER_ROLES } from '../models/User.js';
import { redactSecrets, validatePassword, validateProfile } from '../utils/auth.js';

function ask(question) {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  return prompt.question(question).finally(() => prompt.close());
}

function askHidden(question) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('Run the seed script from an interactive terminal to enter the password securely.'));
  }

  return new Promise((resolve, reject) => {
    let value = '';
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    const finish = (error) => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(wasRaw);
      stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') return finish(new Error('Admin setup cancelled.'));
        if (character === '\r' || character === '\n') return finish();
        if (character === '\u0008' || character === '\u007f') {
          value = value.slice(0, -1);
        } else {
          value += character;
        }
      }
    };

    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

async function seedAdmin() {
  try {
    const profile = validateProfile({
      fullName: await ask('Full name: '),
      email: await ask('Email: '),
      phone: await ask('Phone number: '),
      department: await ask('Department: '),
    });
    const password = await askHidden('Admin password (input hidden): ');
    validatePassword(password);

    await connectDB();
    const existingAdmin = await User.exists({ role: USER_ROLES.ICT_ADMIN });
    if (existingAdmin) {
      throw new Error('An ICT Admin already exists; refusing to create another seed admin.');
    }

    await User.create({
      ...profile,
      password: await bcrypt.hash(password, 12),
      role: USER_ROLES.ICT_ADMIN,
      isActive: true,
      isInitialAdmin: true,
    });
    console.log('Initial ICT Admin created successfully.');
  } catch (error) {
    console.error(`Admin setup failed: ${redactSecrets(error.message)}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
