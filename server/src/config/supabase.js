import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const DEFAULT_SUPABASE_URL = 'https://gpyzxpefddvxmjzxyhzy.supabase.co';
const envUrl = process.env.SUPABASE_URL;
const supabaseUrl = (!envUrl || envUrl.includes('clytujskrmcnstzuvuaf')) ? DEFAULT_SUPABASE_URL : envUrl;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required; configure it as a server-side secret and rotate any previously embedded credential.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
