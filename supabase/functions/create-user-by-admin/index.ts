import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'moderator' | 'user';
  credits?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get the authorization header to verify the requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user making the request is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the user has admin privileges
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const body: CreateUserRequest = await req.json();
    
    if (!body.name || !body.email || !body.password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to create the user in Supabase Auth
    let userId: string;
    let userExists = false;
    
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        full_name: body.name,
        name: body.name
      }
    });

    // If user already exists, get their ID
    if (createUserError?.message?.includes('already been registered')) {
      console.log('User already exists, fetching existing user...');
      userExists = true;
      
      // Get the existing user by email
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', listError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch existing user' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const existingUser = existingUsers.users.find(u => u.email === body.email);
      
      if (!existingUser) {
        return new Response(
          JSON.stringify({ error: 'User exists but could not be found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      userId = existingUser.id;
    } else if (createUserError || !newUser.user) {
      console.error('Error creating user:', createUserError);
      return new Response(
        JSON.stringify({ 
          error: createUserError?.message || 'Failed to create user' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      userId = newUser.user.id;
    }

    try {
      // Create or update user profile (only if user was just created)
      if (!userExists) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userId,
            name: body.name,
            email: body.email,
            credits: body.credits || (body.role === 'moderator' ? 500 : 10)
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Try to delete the user if profile creation fails
          await supabaseAdmin.auth.admin.deleteUser(userId);
          throw profileError;
        }
      } else {
        // If user exists, update credits if needed
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            credits: body.credits || (body.role === 'moderator' ? 500 : 10)
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error updating profile credits:', updateError);
        }
      }

      // If creating a moderator, add to admin_users table
      if (body.role === 'moderator') {
        const { error: adminUserError } = await supabaseAdmin
          .from('admin_users')
          .upsert({
            user_id: userId,
            role: 'moderator',
            permissions: ['manage_user_credits', 'create_users']
          });

        if (adminUserError) {
          console.error('Error creating admin user:', adminUserError);
          // Clean up
          await supabaseAdmin.auth.admin.deleteUser(userId);
          throw adminUserError;
        }

        // Record that this admin created this moderator
        const { error: moderatorUserError } = await supabaseAdmin
          .from('moderator_users')
          .insert({
            moderator_id: userId,
            user_id: userId, // Self-reference for the moderator
            created_by_admin: user.id
          });

        if (moderatorUserError) {
          console.error('Error recording moderator creation:', moderatorUserError);
          // This is not critical, so we don't fail the entire operation
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user_id: userId,
          message: userExists 
            ? `Usuário existente promovido a ${body.role} com sucesso`
            : `${body.role} criado com sucesso`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Error in user creation process:', error);
      
      // Clean up: delete the user if something went wrong (only if it was just created)
      if (!userExists) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        } catch (cleanupError) {
          console.error('Error cleaning up user:', cleanupError);
        }
      }
      
      throw error;
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});