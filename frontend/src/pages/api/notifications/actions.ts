import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

// POST /api/notifications/actions - Bulk actions on notifications
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { action, notification_ids } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (action) {
      case 'mark_all_read':
        // Mark all notifications as read for the user
        const { data: updatedAll, error: updateAllError } = await supabase
          .from('notifications')
          .update({ 
            is_read: true, 
            updated_at: new Date().toISOString() 
          })
          .eq('user_id', user.id)
          .eq('is_read', false)
          .select();

        if (updateAllError) {
          return new Response(
            JSON.stringify({ error: 'Failed to mark all notifications as read', details: updateAllError.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        result = {
          action: 'mark_all_read',
          affected_count: updatedAll?.length || 0,
          notifications: updatedAll
        };
        break;

      case 'mark_selected_read':
        if (!notification_ids || !Array.isArray(notification_ids)) {
          return new Response(
            JSON.stringify({ error: 'notification_ids array is required for mark_selected_read action' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const { data: updatedSelected, error: updateSelectedError } = await supabase
          .from('notifications')
          .update({ 
            is_read: true, 
            updated_at: new Date().toISOString() 
          })
          .eq('user_id', user.id)
          .in('id', notification_ids)
          .select();

        if (updateSelectedError) {
          return new Response(
            JSON.stringify({ error: 'Failed to mark selected notifications as read', details: updateSelectedError.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        result = {
          action: 'mark_selected_read',
          affected_count: updatedSelected?.length || 0,
          notifications: updatedSelected
        };
        break;

      case 'delete_selected':
        if (!notification_ids || !Array.isArray(notification_ids)) {
          return new Response(
            JSON.stringify({ error: 'notification_ids array is required for delete_selected action' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const { data: deletedSelected, error: deleteSelectedError } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id)
          .in('id', notification_ids)
          .select();

        if (deleteSelectedError) {
          return new Response(
            JSON.stringify({ error: 'Failed to delete selected notifications', details: deleteSelectedError.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        result = {
          action: 'delete_selected',
          affected_count: deletedSelected?.length || 0,
          notifications: deletedSelected
        };
        break;

      case 'delete_all_read':
        const { data: deletedAllRead, error: deleteAllReadError } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id)
          .eq('is_read', true)
          .select();

        if (deleteAllReadError) {
          return new Response(
            JSON.stringify({ error: 'Failed to delete all read notifications', details: deleteAllReadError.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        result = {
          action: 'delete_all_read',
          affected_count: deletedAllRead?.length || 0,
          notifications: deletedAllRead
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};