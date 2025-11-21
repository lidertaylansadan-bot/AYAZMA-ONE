import { createClient } from '@supabase/supabase-js';
import { config } from '../core/config.js'

export const supabase = createClient(config.supabaseUrl, config.supabaseKey);

export default supabase;