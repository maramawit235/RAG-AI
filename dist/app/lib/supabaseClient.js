"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = exports.supabase = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
Object.defineProperty(exports, "createClient", { enumerable: true, get: function () { return supabase_js_1.createClient; } });
var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
var supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? localStorage : undefined
    }
});
